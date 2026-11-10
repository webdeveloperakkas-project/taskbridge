-- TaskBridge Profile & KYC verification
-- Run this migration once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.user_profile_details (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    date_of_birth date,
    phone_number text,
    gender text,
    country text,
    address_line text,
    city text,
    region text,
    postal_code text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile details" ON public.user_profile_details;
CREATE POLICY "Users read own profile details"
ON public.user_profile_details FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own profile details" ON public.user_profile_details;
CREATE POLICY "Users insert own profile details"
ON public.user_profile_details FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile details" ON public.user_profile_details;
CREATE POLICY "Users update own profile details"
ON public.user_profile_details FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins update profile details" ON public.user_profile_details;
CREATE POLICY "Admins update profile details"
ON public.user_profile_details FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.user_profile_details TO authenticated;


CREATE TABLE IF NOT EXISTS public.user_verification_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type text NOT NULL CHECK (verification_type IN ('identity', 'address')),
    status text NOT NULL DEFAULT 'pending_review'
        CHECK (status IN ('pending_review', 'approved', 'rejected')),
    document_type text,
    country text,
    front_path text,
    back_path text,
    selfie_path text,
    address_document_type text,
    address_line text,
    city text,
    region text,
    postal_code text,
    address_country text,
    address_document_path text,
    admin_note text,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, verification_type)
);

CREATE INDEX IF NOT EXISTS user_verification_submissions_status_idx
ON public.user_verification_submissions (status, submitted_at DESC);

ALTER TABLE public.user_verification_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own verification submissions" ON public.user_verification_submissions;
CREATE POLICY "Users read own verification submissions"
ON public.user_verification_submissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users submit verification" ON public.user_verification_submissions;
CREATE POLICY "Users submit verification"
ON public.user_verification_submissions FOR INSERT TO authenticated
WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending_review'
    AND (front_path IS NULL OR front_path LIKE auth.uid()::text || '/identity/%')
    AND (back_path IS NULL OR back_path LIKE auth.uid()::text || '/identity/%')
    AND (selfie_path IS NULL OR selfie_path LIKE auth.uid()::text || '/identity/%')
    AND (address_document_path IS NULL OR address_document_path LIKE auth.uid()::text || '/address/%')
);

DROP POLICY IF EXISTS "Users resubmit rejected verification" ON public.user_verification_submissions;
CREATE POLICY "Users resubmit rejected verification"
ON public.user_verification_submissions FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status = 'rejected')
WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending_review'
    AND (front_path IS NULL OR front_path LIKE auth.uid()::text || '/identity/%')
    AND (back_path IS NULL OR back_path LIKE auth.uid()::text || '/identity/%')
    AND (selfie_path IS NULL OR selfie_path LIKE auth.uid()::text || '/identity/%')
    AND (address_document_path IS NULL OR address_document_path LIKE auth.uid()::text || '/address/%')
);

DROP POLICY IF EXISTS "Admins review verification submissions" ON public.user_verification_submissions;
CREATE POLICY "Admins review verification submissions"
ON public.user_verification_submissions FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.user_verification_submissions TO authenticated;


-- Private KYC bucket: all uploaded identity/address files are private and limited to 2 MB.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'private-kyc-documents',
    'private-kyc-documents',
    false,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 2097152,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own KYC files" ON storage.objects;
CREATE POLICY "Users upload own KYC files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'private-kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users and admins view KYC files" ON storage.objects;
CREATE POLICY "Users and admins view KYC files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'private-kyc-documents'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

-- KYC uploads are retained for audit; users cannot delete submitted evidence.
