-- Allow an authenticated worker to expire only their own overdue active attempts.
-- SECURITY DEFINER bypasses table RLS, so explicitly scope the UPDATE to auth.uid().

BEGIN;

CREATE OR REPLACE FUNCTION public.expire_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_count integer;
    v_worker_id uuid := auth.uid();
BEGIN
    IF v_worker_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.job_submissions
       SET status = 'expired'
     WHERE worker_id = v_worker_id
       AND status = 'in_progress'
       AND expires_at IS NOT NULL
       AND expires_at <= NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.expire_submissions()
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_submissions()
    TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
