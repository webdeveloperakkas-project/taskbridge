
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidIp(value: string): boolean {
  const ip = value.trim();
  const ipv4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) return ipv4.slice(1).every(part => Number(part) >= 0 && Number(part) <= 255);
  return ip.includes(":") && /^[0-9a-f:]+$/i.test(ip);
}

function getClientIp(request: Request): string | null {
  // Prefer the IP set by the Cloudflare edge. Never accept an IP from the JSON body
  // or trust the first X-Forwarded-For value supplied by a client.
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
  ];

  for (const candidate of candidates) {
    if (candidate && isValidIp(candidate)) return candidate.trim();
  }
  return null;
}

type IpCountryResult = {
  country: string | null;
  countryCode: string | null;
};

async function getIpCountry(ip: string | null): Promise<IpCountryResult> {
  const token = Deno.env.get("IPINFO_TOKEN");
  if (!ip || !token) return { country: null, countryCode: null };

  try {
    const response = await fetch(
      `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) {
      console.warn("IP country lookup returned HTTP", response.status);
      return { country: null, countryCode: null };
    }

    const result = await response.json();
    return {
      country: typeof result.country === "string" && result.country.trim()
        ? result.country.trim()
        : null,
      countryCode: typeof result.country_code === "string" && result.country_code.trim()
        ? result.country_code.trim().toUpperCase()
        : null,
    };
  } catch (error) {
    console.warn("IP country lookup failed:", error);
    return { country: null, countryCode: null };
  }
}

function getDeviceType(userAgent: string): string {
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function getBrowser(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/chrome\//i.test(userAgent) && !/chromium/i.test(userAgent)) return "Google Chrome";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return "Safari";
  return "Unknown";
}

function getOperatingSystem(userAgent: string): string {
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/android/i.test(userAgent)) return "Android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Supabase server environment is not configured.");
    }

    const authorization = request.headers.get("Authorization") || "";
    const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's access token; never accept a user_id from the browser.
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { device_timezone?: unknown; user_agent?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const userAgent = String(body.user_agent || request.headers.get("user-agent") || "").slice(0, 1500);
    const timezoneValue = typeof body.device_timezone === "string"
      ? body.device_timezone.trim().slice(0, 100)
      : null;

    const clientIp = getClientIp(request);
    const { error: insertError } = await supabaseAdmin
      .from("user_login_history")
      .insert({
        user_id: authData.user.id,
        ip_address: clientIp,
        device_type: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        operating_system: getOperatingSystem(userAgent),
        user_agent: userAgent || null,
        device_timezone: timezoneValue || null,
      });

    if (insertError) throw insertError;

    // Store the server-derived IP context first. This write is deliberately independent
    // of KYC queries, so a KYC schema/query problem cannot prevent country data being saved.
    // Omitted KYC/flag fields are left unchanged on conflict; new rows use DB defaults.
    const ipCountryResult = await getIpCountry(clientIp);
    const now = new Date().toISOString();

    const { error: countryUpsertError } = await supabaseAdmin
      .from("user_country_verifications")
      .upsert({
        user_id: authData.user.id,
        ip_country: ipCountryResult.country,
        ip_country_code: ipCountryResult.countryCode,
        ip_address: clientIp,
        checked_at: now,
        updated_at: now,
      }, { onConflict: "user_id" });

    if (countryUpsertError) {
      // Do not block a valid login, but keep a clear server-side diagnostic.
      console.error("Could not save IP country verification context:", countryUpsertError);
    } else {
      // Populate the ordinary profile country from the user's profile details.
      // Only update rows that are not KYC-verified, so a locked identity-document
      // country can never be replaced by an editable profile value.
      try {
        const { data: profileDetails, error: profileDetailsError } = await supabaseAdmin
          .from("user_profile_details")
          .select("country")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (profileDetailsError) throw profileDetailsError;

        const profileCountry = typeof profileDetails?.country === "string"
          ? profileDetails.country.trim()
          : "";

        if (profileCountry) {
          const { error: profileCountryUpdateError } = await supabaseAdmin
            .from("user_country_verifications")
            .update({
              profile_country: profileCountry,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", authData.user.id)
            .eq("verified", false);

          if (profileCountryUpdateError) throw profileCountryUpdateError;
        }
      } catch (profileCountryError) {
        // Profile country is supplementary; do not block login or IP-country storage.
        console.error("Could not sync profile country from user_profile_details:", profileCountryError);
      }

      // KYC country locking is a separate operation. It must never overwrite a
      // country that has already been verified and locked.
      try {
        const [submissionsResult, existingResult] = await Promise.all([
          supabaseAdmin.from("user_verification_submissions")
            .select("verification_type,status,country")
            .eq("user_id", authData.user.id),
          supabaseAdmin.from("user_country_verifications")
            .select("profile_country,verified")
            .eq("user_id", authData.user.id)
            .maybeSingle(),
        ]);

        if (submissionsResult.error) throw submissionsResult.error;
        if (existingResult.error) throw existingResult.error;

        const submissions = submissionsResult.data || [];
        const approvedIdentity = submissions.find(row =>
          row.verification_type === "identity" && row.status === "approved"
        );
        const approvedAddress = submissions.find(row =>
          row.verification_type === "address" && row.status === "approved"
        );

        const identityDocumentCountry =
          typeof approvedIdentity?.country === "string"
            ? approvedIdentity.country.trim()
            : null;

        const wasAlreadyVerified = existingResult.data?.verified === true;
        const newlyVerified = Boolean(
          !wasAlreadyVerified &&
          approvedIdentity &&
          approvedAddress &&
          identityDocumentCountry
        );

        if (newlyVerified) {
          const { error: lockError } = await supabaseAdmin
            .from("user_country_verifications")
            .update({
              profile_country: identityDocumentCountry,
              verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", authData.user.id)
            .eq("verified", false);

          if (lockError) throw lockError;
        }
      } catch (kycError) {
        // IP country has already been saved; KYC locking can safely retry next login.
        console.error("KYC country lock could not be refreshed:", kycError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("log-login failed:", error);
    return new Response(JSON.stringify({ error: "Could not record login activity" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
