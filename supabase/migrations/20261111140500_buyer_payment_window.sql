-- TaskBridge: buyer-selected payment deadline and automatic approval
-- Run once in Supabase SQL Editor after reviewing this migration.

BEGIN;

-- Existing jobs default to the previous 7-day review window.
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS buyer_payment_days integer NOT NULL DEFAULT 7;

ALTER TABLE public.jobs
    DROP CONSTRAINT IF EXISTS jobs_buyer_payment_days_check;

ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_buyer_payment_days_check
    CHECK (buyer_payment_days BETWEEN 1 AND 15);

CREATE INDEX IF NOT EXISTS job_submissions_due_auto_approval_idx
ON public.job_submissions (submitted_at)
WHERE status = 'submitted';

-- Keep the original funding implementation untouched. This overload calls it,
-- then stores the buyer-selected payment window on the created job.
CREATE OR REPLACE FUNCTION public.create_job_with_funding(
    p_category_id uuid,
    p_title text,
    p_description text,
    p_instructions text,
    p_target_url text,
    p_proof_requirements text,
    p_extra_instructions text,
    p_reward_per_worker numeric,
    p_total_slots integer,
    p_duration_minutes integer,
    p_card_color text,
    p_buyer_payment_days integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job_id uuid;
BEGIN
    IF p_buyer_payment_days IS NULL
       OR p_buyer_payment_days < 1
       OR p_buyer_payment_days > 15 THEN
        RAISE EXCEPTION 'Buyer payment time must be between 1 and 15 days';
    END IF;

    v_job_id := public.create_job_with_funding(
        p_category_id,
        p_title,
        p_description,
        p_instructions,
        p_target_url,
        p_proof_requirements,
        p_extra_instructions,
        p_reward_per_worker,
        p_total_slots,
        p_duration_minutes,
        p_card_color
    );

    UPDATE public.jobs
       SET buyer_payment_days = p_buyer_payment_days
     WHERE id = v_job_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not save buyer payment time';
    END IF;

    RETURN v_job_id;
END;
$function$;

-- Country-aware overload used by the website. The existing 12-argument
-- country wrapper remains available for older callers.
CREATE OR REPLACE FUNCTION public.create_job_with_funding(
    p_category_id uuid,
    p_title text,
    p_description text,
    p_instructions text,
    p_target_url text,
    p_proof_requirements text,
    p_extra_instructions text,
    p_reward_per_worker numeric,
    p_total_slots integer,
    p_duration_minutes integer,
    p_card_color text,
    p_target_country text,
    p_buyer_payment_days integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user uuid := auth.uid();
    v_job_id uuid;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_target_country IS NULL
       OR BTRIM(p_target_country) = ''
       OR LENGTH(p_target_country) > 100 THEN
        RAISE EXCEPTION 'Invalid target country';
    END IF;

    IF p_buyer_payment_days IS NULL
       OR p_buyer_payment_days < 1
       OR p_buyer_payment_days > 15 THEN
        RAISE EXCEPTION 'Buyer payment time must be between 1 and 15 days';
    END IF;

    v_job_id := public.create_job_with_funding(
        p_category_id,
        p_title,
        p_description,
        p_instructions,
        p_target_url,
        p_proof_requirements,
        p_extra_instructions,
        p_reward_per_worker,
        p_total_slots,
        p_duration_minutes,
        p_card_color,
        p_buyer_payment_days
    );

    UPDATE public.jobs
       SET target_country = BTRIM(p_target_country)
     WHERE id = v_job_id
       AND advertiser_id = v_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not save job target country';
    END IF;

    RETURN v_job_id;
END;
$function$;

-- Automatic approvals are system actions. reviewer_id is nullable so the
-- audit row does not falsely impersonate the buyer when the system approves.
ALTER TABLE public.job_reviews
    ALTER COLUMN reviewer_id DROP NOT NULL;

-- Shared, transaction-safe payout implementation used by both manual and
-- scheduled approval. The submission row lock and status check prevent
-- manual/automatic approval from crediting the same submission twice.
CREATE OR REPLACE FUNCTION public.approve_submission_internal(
    p_submission_id uuid,
    p_review_note text,
    p_reviewer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_submission public.job_submissions%ROWTYPE;
    v_job public.jobs%ROWTYPE;
    v_advertiser_wallet public.wallets%ROWTYPE;
    v_worker_wallet public.wallets%ROWTYPE;
    v_reward numeric(18,2);
    v_completed integer;
BEGIN
    SELECT *
      INTO v_submission
      FROM public.job_submissions
     WHERE id = p_submission_id
     FOR UPDATE;

    IF NOT FOUND OR v_submission.status <> 'submitted' THEN
        RETURN false;
    END IF;

    SELECT *
      INTO v_job
      FROM public.jobs
     WHERE id = v_submission.job_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF p_reviewer_id IS NOT NULL
       AND p_reviewer_id <> v_job.advertiser_id THEN
        RAISE EXCEPTION 'Only the job advertiser can review this submission';
    END IF;

    IF v_job.status NOT IN ('active', 'paused') THEN
        RAISE EXCEPTION 'Job cannot be reviewed in its current status';
    END IF;

    v_reward := v_job.reward_per_worker;

    IF v_job.remaining_budget < v_reward THEN
        RAISE EXCEPTION 'Insufficient remaining job funding';
    END IF;

    SELECT *
      INTO v_advertiser_wallet
      FROM public.wallets
     WHERE user_id = v_job.advertiser_id
       AND currency = v_job.currency
     FOR UPDATE;

    IF NOT FOUND OR v_advertiser_wallet.held_balance < v_reward THEN
        RAISE EXCEPTION 'Advertiser held balance is insufficient';
    END IF;

    SELECT *
      INTO v_worker_wallet
      FROM public.wallets
     WHERE user_id = v_submission.worker_id
       AND currency = v_job.currency
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Worker wallet not found';
    END IF;

    UPDATE public.wallets
       SET held_balance = held_balance - v_reward
     WHERE id = v_advertiser_wallet.id;

    UPDATE public.wallets
       SET available_balance = available_balance + v_reward
     WHERE id = v_worker_wallet.id;

    UPDATE public.jobs
       SET remaining_budget = remaining_budget - v_reward
     WHERE id = v_job.id;

    UPDATE public.job_submissions
       SET status = 'approved',
           reviewed_at = NOW(),
           approved_at = NOW(),
           review_note = p_review_note
     WHERE id = p_submission_id;

    INSERT INTO public.job_reviews (
        submission_id, reviewer_id, decision, review_note
    )
    VALUES (
        p_submission_id, p_reviewer_id, 'approved', p_review_note
    );

    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, transaction_type, direction,
        balance_type, amount, reference_type, reference_id, description
    )
    VALUES
    (
        v_advertiser_wallet.id, v_job.advertiser_id,
        'worker_reward', 'debit', 'held', v_reward,
        'submission', p_submission_id,
        'Worker reward released from held balance'
    ),
    (
        v_worker_wallet.id, v_submission.worker_id,
        'worker_reward', 'credit', 'available', v_reward,
        'submission', p_submission_id,
        'Full approved worker reward'
    );

    SELECT COUNT(*)
      INTO v_completed
      FROM public.job_submissions
     WHERE job_id = v_job.id
       AND status = 'approved';

    IF v_completed >= v_job.total_slots THEN
        UPDATE public.jobs
           SET status = 'completed'
         WHERE id = v_job.id;
    END IF;

    INSERT INTO public.notifications (
        user_id, title, message, notification_type, related_job_id
    )
    VALUES (
        v_submission.worker_id,
        'Reward Approved',
        CASE
            WHEN p_reviewer_id IS NULL
            THEN 'Your submission was automatically approved after the buyer payment window ended. Your full reward has been credited.'
            ELSE 'Your job submission has been approved and your reward has been credited.'
        END,
        'payment',
        v_job.id
    );

    RETURN true;
END;
$function$;

-- Preserve the existing public RPC name for buyer manual approval.
CREATE OR REPLACE FUNCTION public.approve_submission(
    p_submission_id uuid,
    p_review_note text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_approved boolean;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT public.approve_submission_internal(
        p_submission_id,
        p_review_note,
        auth.uid()
    )
    INTO v_approved;

    IF NOT v_approved THEN
        RAISE EXCEPTION 'Submission is not awaiting review';
    END IF;
END;
$function$;

-- Runs from pg_cron. It does not impersonate the buyer and uses the same
-- payout helper as manual approval.
CREATE OR REPLACE FUNCTION public.auto_approve_due_submissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_submission_id uuid;
    v_approved boolean;
    v_count integer := 0;
BEGIN
    FOR v_submission_id IN
        SELECT s.id
          FROM public.job_submissions s
          JOIN public.jobs j ON j.id = s.job_id
         WHERE s.status = 'submitted'
           AND s.submitted_at IS NOT NULL
           AND s.submitted_at
               + make_interval(days => COALESCE(j.buyer_payment_days, 7))
               <= NOW()
         ORDER BY s.submitted_at
         LIMIT 200
    LOOP
        SELECT public.approve_submission_internal(
            v_submission_id,
            'Automatically approved after the buyer payment window elapsed.',
            NULL
        )
        INTO v_approved;

        IF v_approved THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$function$;

-- Internal functions must not be callable directly by normal client roles.
REVOKE ALL ON FUNCTION public.approve_submission_internal(uuid, text, uuid)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_approve_due_submissions()
    FROM PUBLIC, anon, authenticated;

-- Run every minute. Replace any earlier job with the same name safely.
DO $schedule$
DECLARE
    v_job_id bigint;
BEGIN
    FOR v_job_id IN
        SELECT jobid
          FROM cron.job
         WHERE jobname = 'taskbridge-auto-approve-submissions'
    LOOP
        PERFORM cron.unschedule(v_job_id);
    END LOOP;

    PERFORM cron.schedule(
        'taskbridge-auto-approve-submissions',
        '* * * * *',
        'SELECT public.auto_approve_due_submissions();'
    );
END;
$schedule$;

NOTIFY pgrst, 'reload schema';

COMMIT;
