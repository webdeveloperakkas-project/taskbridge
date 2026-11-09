-- TaskBridge: allow an administrator to reject a job after it has been approved.
-- Run this in the Supabase SQL Editor before using the new Admin action.
--
-- This reuses the existing cancel_job() transaction so that remaining held
-- funds are refunded using the existing wallet logic. As cancel_job() does,
-- this cancels worker submissions in 'in_progress' and 'submitted' states.
-- Completed work/payouts are not reversed.

CREATE OR REPLACE FUNCTION public.admin_reject_approved_job(
    p_job_id uuid,
    p_admin_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job public.jobs%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    IF NULLIF(btrim(p_admin_note), '') IS NULL THEN
        RAISE EXCEPTION 'A rejection reason is required';
    END IF;

    SELECT *
      INTO v_job
      FROM public.jobs
     WHERE id = p_job_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF v_job.status <> 'active' THEN
        RAISE EXCEPTION 'Only an active, previously approved job can be rejected here';
    END IF;

    -- Existing secure cancellation logic refunds remaining held funds and
    -- cancels unfinished/submitted worker tasks within this transaction.
    PERFORM public.cancel_job(p_job_id);

    UPDATE public.jobs
       SET status = 'rejected',
           admin_reviewed_by = auth.uid(),
           admin_reviewed_at = now(),
           admin_review_note = btrim(p_admin_note),
           updated_at = now()
     WHERE id = p_job_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_reject_approved_job(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_approved_job(uuid, text) TO authenticated;
