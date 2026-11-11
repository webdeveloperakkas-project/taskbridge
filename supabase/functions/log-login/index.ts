
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

async function getIpCountry(ip: string | null): Promise<string | null> {
  const token = Deno.env.get("IPINFO_TOKEN");
  if (!ip || !token) return null;

  try {
    const response = await fetch(
      `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${encodeURIComponent(token)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      console.warn("IP country lookup returned HTTP", response.status);
      return null;
    }

    const result = await response.json();
    return typeof result.country === "string" && result.country.trim()
      ? result.country.trim()
      : null;
  } catch (error) {
    console.warn("IP country lookup failed:", error);
    return null;
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

    // Country targeting uses IP country only while the user is not fully KYC verified.
    // The API token stays in Supabase Secrets; no IP or country is accepted from the browser body.
    try {
      const [ipCountry, detailsResult, submissionsResult] = await Promise.all([
        getIpCountry(clientIp),
        supabaseAdmin.from("user_profile_details")
          .select("country")
          .eq("user_id", authData.user.id)
          .maybeSingle(),
        supabaseAdmin.from("user_verification_submissions")
          .select("verification_type,status,country,address_country")
          .eq("user_id", authData.user.id),
      ]);
      if (detailsResult.error) throw detailsResult.error;
      if (submissionsResult.error) throw submissionsResult.error;

      const submissions = submissionsResult.data || [];
      const identity = submissions.find(row =>
        row.verification_type === "identity" && row.status === "approved"
      );
      const address = submissions.find(row =>
        row.verification_type === "address" && row.status === "approved"
      );
      const profileCountry = detailsResult.data?.country?.trim() || null;
      const identityCountry = identity?.country?.trim() || null;
      const sameCountry = (a: string | null, b: string | null) =>
        Boolean(a && b && a.toLowerCase() === b.toLowerCase());

      // Both identity and address documents must be approved. The issuing country
      // on the approved identity document must match the saved profile country.
      // Address country may legitimately differ for people living abroad.
      const documentVerified = Boolean(
        identity && address &&
        sameCountry(profileCountry, identityCountry)
      );

      const { error: countryUpsertError } = await supabaseAdmin
        .from("user_country_verifications")
        .upsert({
          user_id: authData.user.id,
          profile_country: profileCountry,
          ip_country: ipCountry,
          ip_address: clientIp,
          verified: documentVerified,
          checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (countryUpsertError) throw countryUpsertError;
    } catch (countryError) {
      // Country lookup/storage must not block a valid login. Missing lookup data
      // leaves the worker without a trusted country until the next successful check.
      console.error("Country targeting context could not be refreshed:", countryError);
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
