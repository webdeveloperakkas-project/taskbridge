-- TaskBridge Part 3: exact-wallet job funding, worker rewards, and refunds
-- Run only after Part 1 and Part 2 migrations have completed.

BEGIN;

-- Remove legacy RPC overloads that did not require a funding wallet.
DROP FUNCTION IF EXISTS public.create_job_with_funding(uuid,text,text,text,text,text,text,numeric,integer,integer,text,integer,text,integer);
DROP FUNCTION IF EXISTS public.create_job_with_funding(uuid,text,text,text,text,text,text,numeric,integer,integer,text,text);
DROP FUNCTION IF EXISTS public.create_job_with_funding(uuid,text,text,text,text,text,text,numeric,integer,integer,text,integer);
DROP FUNCTION IF EXISTS public.create_job_with_funding(uuid,text,text,text,text,text,text,numeric,integer,integer,text);

-- Main funding function: the selected wallet is authoritative for currency and method.
CREATE FUNCTION public.create_job_with_funding(
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
    p_funding_wallet_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user uuid := auth.uid();
    v_job_id uuid;
    v_wallet public.wallets%ROWTYPE;
    v_method_currency text;
    v_color text;
    v_color_fee numeric(18,2);
    v_fee_rate numeric(18,2) := 15.00;
    v_reward numeric(18,2);
    v_reward_budget numeric(18,2);
    v_fee_budget numeric(18,2);
    v_total_fee numeric(18,2);
    v_total_charge numeric(18,2);
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT public.has_role(v_user, 'advertiser') THEN
        RAISE EXCEPTION 'Advertiser role required';
    END IF;

    IF p_reward_per_worker IS NULL OR p_reward_per_worker <= 0
       OR p_total_slots IS NULL OR p_total_slots <= 0 THEN
        RAISE EXCEPTION 'Invalid reward or slot count';
    END IF;

    IF p_duration_minutes IS NULL OR p_duration_minutes <= 0 THEN
        RAISE EXCEPTION 'Job duration must be positive';
    END IF;

    IF p_funding_wallet_id IS NULL THEN
        RAISE EXCEPTION 'Select an active funding wallet before posting the job';
    END IF;

    SELECT *
      INTO v_wallet
      FROM public.wallets
     WHERE id = p_funding_wallet_id
       AND user_id = v_user
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected funding wallet was not found for this account';
    END IF;

    v_method_currency := CASE v_wallet.payment_method
        WHEN 'bKash' THEN 'BDT'
        WHEN 'Nagad' THEN 'BDT'
        WHEN 'Rocket' THEN 'BDT'
        WHEN 'Bank Transfer' THEN 'BDT'
        WHEN 'Wise' THEN 'USD'
        WHEN 'WebMoney' THEN 'USD'
        WHEN 'Visa' THEN 'USD'
        WHEN 'Mastercard' THEN 'USD'
        ELSE NULL
    END;

    IF v_method_currency IS NULL OR v_wallet.currency <> v_method_currency THEN
        RAISE EXCEPTION 'This wallet cannot be used for new job funding';
    END IF;

    v_reward := ROUND(p_reward_per_worker, 2);
    v_color := LOWER(TRIM(COALESCE(p_card_color, 'white')));

    v_color_fee := CASE v_color
        WHEN 'white' THEN 0.00
        WHEN 'blue' THEN 0.10
        WHEN 'green' THEN 0.10
        WHEN 'yellow' THEN 0.15
        WHEN 'orange' THEN 0.15
        WHEN 'purple' THEN 0.20
        WHEN 'pink' THEN 0.20
        ELSE NULL
    END;

    IF v_color_fee IS NULL THEN
        RAISE EXCEPTION 'Invalid job card color';
    END IF;

    v_reward_budget := ROUND(v_reward * p_total_slots, 2);
    v_fee_budget := ROUND(v_reward_budget * v_fee_rate / 100, 2);
    v_total_fee := v_fee_budget + v_color_fee;
    v_total_charge := v_reward_budget + v_total_fee;

    UPDATE public.wallets
       SET available_balance = available_balance - v_total_charge,
           held_balance = held_balance + v_reward_budget,
           updated_at = NOW()
     WHERE id = v_wallet.id
       AND available_balance >= v_total_charge;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient available balance in selected wallet';
    END IF;

    INSERT INTO public.jobs (
        advertiser_id, category_id, title, description, instructions,
        target_url, proof_requirements, extra_instructions,
        reward_per_worker, total_slots, duration_minutes, currency,
        funding_wallet_id, platform_fee_rate, reward_budget,
        platform_fee_budget, card_color, color_fee, reserved_budget,
        remaining_budget, status
    )
    VALUES (
        v_user, p_category_id, p_title, p_description, p_instructions,
        p_target_url, p_proof_requirements, p_extra_instructions,
        v_reward, p_total_slots, p_duration_minutes, v_wallet.currency,
        v_wallet.id, v_fee_rate, v_reward_budget, v_fee_budget,
        v_color, v_color_fee, v_reward_budget, v_reward_budget,
        'pending_review'
    )
    RETURNING id INTO v_job_id;

    INSERT INTO public.administration_fee_ledger (
        job_id, advertiser_id, currency, administration_fee,
        color_fee, total_fee, status
    )
    VALUES (
        v_job_id, v_user, v_wallet.currency, v_fee_budget,
        v_color_fee, v_total_fee, 'pending'
    );

    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, transaction_type, direction, balance_type,
        amount, currency, reference_type, reference_id, description
    )
    VALUES
    (
        v_wallet.id, v_user, 'job_funding_hold', 'debit', 'available',
        v_total_charge, v_wallet.currency, 'job', v_job_id,
        'Job reward budget, 15% platform fee, and color fee charged'
    ),
    (
        v_wallet.id, v_user, 'job_funding_hold', 'credit', 'held',
        v_reward_budget, v_wallet.currency, 'job', v_job_id,
        'Worker reward budget held'
    );

    RETURN v_job_id;
END;
$function$;

-- Buyer payment window wrapper.
CREATE FUNCTION public.create_job_with_funding(
    p_category_id uuid, p_title text, p_description text,
    p_instructions text, p_target_url text, p_proof_requirements text,
    p_extra_instructions text, p_reward_per_worker numeric,
    p_total_slots integer, p_duration_minutes integer,
    p_card_color text, p_buyer_payment_days integer,
    p_funding_wallet_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job_id uuid;
BEGIN
    IF p_buyer_payment_days IS NULL OR p_buyer_payment_days < 1
       OR p_buyer_payment_days > 15 THEN
        RAISE EXCEPTION 'Buyer payment time must be between 1 and 15 days';
    END IF;

    v_job_id := public.create_job_with_funding(
        p_category_id, p_title, p_description, p_instructions,
        p_target_url, p_proof_requirements, p_extra_instructions,
        p_reward_per_worker, p_total_slots, p_duration_minutes,
        p_card_color, p_funding_wallet_id
    );

    UPDATE public.jobs
       SET buyer_payment_days = p_buyer_payment_days
     WHERE id = v_job_id;

    RETURN v_job_id;
END;
$function$;

-- Target-country wrapper.
CREATE FUNCTION public.create_job_with_funding(
    p_category_id uuid, p_title text, p_description text,
    p_instructions text, p_target_url text, p_proof_requirements text,
    p_extra_instructions text, p_reward_per_worker numeric,
    p_total_slots integer, p_duration_minutes integer,
    p_card_color text, p_target_country text,
    p_funding_wallet_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job_id uuid;
    v_user uuid := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_target_country IS NULL OR BTRIM(p_target_country) = ''
       OR LENGTH(p_target_country) > 100 THEN
        RAISE EXCEPTION 'Invalid target country';
    END IF;

    v_job_id := public.create_job_with_funding(
        p_category_id, p_title, p_description, p_instructions,
        p_target_url, p_proof_requirements, p_extra_instructions,
        p_reward_per_worker, p_total_slots, p_duration_minutes,
        p_card_color, p_funding_wallet_id
    );

    UPDATE public.jobs
       SET target_country = BTRIM(p_target_country)
     WHERE id = v_job_id AND advertiser_id = v_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not save job target country';
    END IF;

    RETURN v_job_id;
END;
$function$;

-- Combined target-country and buyer-payment-window wrapper used by dashboard.js.
CREATE FUNCTION public.create_job_with_funding(
    p_category_id uuid, p_title text, p_description text,
    p_instructions text, p_target_url text, p_proof_requirements text,
    p_extra_instructions text, p_reward_per_worker numeric,
    p_total_slots integer, p_duration_minutes integer,
    p_card_color text, p_target_country text,
    p_buyer_payment_days integer, p_funding_wallet_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job_id uuid;
    v_user uuid := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_target_country IS NULL OR BTRIM(p_target_country) = ''
       OR LENGTH(p_target_country) > 100 THEN
        RAISE EXCEPTION 'Invalid target country';
    END IF;

    IF p_buyer_payment_days IS NULL OR p_buyer_payment_days < 1
       OR p_buyer_payment_days > 15 THEN
        RAISE EXCEPTION 'Buyer payment time must be between 1 and 15 days';
    END IF;

    v_job_id := public.create_job_with_funding(
        p_category_id, p_title, p_description, p_instructions,
        p_target_url, p_proof_requirements, p_extra_instructions,
        p_reward_per_worker, p_total_slots, p_duration_minutes,
        p_card_color, p_funding_wallet_id
    );

    UPDATE public.jobs
       SET target_country = BTRIM(p_target_country),
           buyer_payment_days = p_buyer_payment_days
     WHERE id = v_job_id AND advertiser_id = v_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Could not save job targeting and payment settings';
    END IF;

    RETURN v_job_id;
END;
$function$;

-- Reward release: source is the exact wallet that funded the job.
CREATE OR REPLACE FUNCTION public.approve_submission_internal(
    p_submission_id uuid, p_review_note text, p_reviewer_id uuid
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
    SELECT * INTO v_submission
      FROM public.job_submissions
     WHERE id = p_submission_id
     FOR UPDATE;

    IF NOT FOUND OR v_submission.status <> 'submitted' THEN
        RETURN false;
    END IF;

    SELECT * INTO v_job
      FROM public.jobs
     WHERE id = v_submission.job_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF p_reviewer_id IS NOT NULL AND p_reviewer_id <> v_job.advertiser_id THEN
        RAISE EXCEPTION 'Only the job advertiser can review this submission';
    END IF;

    IF v_job.status NOT IN ('active', 'paused') THEN
        RAISE EXCEPTION 'Job cannot be reviewed in its current status';
    END IF;

    v_reward := v_job.reward_per_worker;

    IF v_job.remaining_budget < v_reward THEN
        RAISE EXCEPTION 'Insufficient remaining job funding';
    END IF;

    IF v_job.funding_wallet_id IS NULL THEN
        RAISE EXCEPTION 'This job has no recorded funding wallet; reward release is blocked for safety';
    END IF;

    SELECT * INTO v_advertiser_wallet
      FROM public.wallets
     WHERE id = v_job.funding_wallet_id
       AND user_id = v_job.advertiser_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Original job funding wallet not found';
    END IF;

    IF v_advertiser_wallet.currency <> v_job.currency
       OR v_advertiser_wallet.payment_method IS NULL
       OR v_advertiser_wallet.payment_method = 'LEGACY' THEN
        RAISE EXCEPTION 'Original job funding wallet identity is invalid';
    END IF;

    IF v_advertiser_wallet.held_balance < v_reward THEN
        RAISE EXCEPTION 'Advertiser held balance is insufficient';
    END IF;

    SELECT * INTO v_worker_wallet
      FROM public.wallets
     WHERE user_id = v_submission.worker_id
       AND currency = v_advertiser_wallet.currency
       AND payment_method = v_advertiser_wallet.payment_method
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Worker wallet for the original funding method is missing; no wallet was created';
    END IF;

    UPDATE public.wallets
       SET held_balance = held_balance - v_reward,
           updated_at = NOW()
     WHERE id = v_advertiser_wallet.id;

    UPDATE public.wallets
       SET available_balance = available_balance + v_reward,
           updated_at = NOW()
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

    INSERT INTO public.job_reviews (submission_id, reviewer_id, decision, review_note)
    VALUES (p_submission_id, p_reviewer_id, 'approved', p_review_note);

    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, transaction_type, direction,
        balance_type, amount, currency, reference_type, reference_id, description
    )
    VALUES
    (
        v_advertiser_wallet.id, v_job.advertiser_id,
        'worker_reward', 'debit', 'held', v_reward,
        v_advertiser_wallet.currency, 'submission', p_submission_id,
        'Worker reward released from the exact job funding wallet'
    ),
    (
        v_worker_wallet.id, v_submission.worker_id,
        'worker_reward', 'credit', 'available', v_reward,
        v_worker_wallet.currency, 'submission', p_submission_id,
        'Full approved worker reward credited to matching payment-method wallet'
    );

    SELECT COUNT(*) INTO v_completed
      FROM public.job_submissions
     WHERE job_id = v_job.id AND status = 'approved';

    IF v_completed >= v_job.total_slots THEN
        UPDATE public.jobs SET status = 'completed' WHERE id = v_job.id;
    END IF;

    INSERT INTO public.notifications (
        user_id, title, message, notification_type, related_job_id
    )
    VALUES (
        v_submission.worker_id,
        'Reward Approved',
        CASE
            WHEN p_reviewer_id IS NULL THEN
                'Your submission was automatically approved after the buyer payment window ended. Your full reward has been credited.'
            ELSE
                'Your job submission has been approved and your reward has been credited.'
        END,
        'payment',
        v_job.id
    );

    RETURN true;
END;
$function$;

-- Cancel: preserve the original policy (pending-review fee fully refunded;
-- after approval only unused reward budget is refunded).
CREATE OR REPLACE FUNCTION public.cancel_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job public.jobs%ROWTYPE;
    v_wallet public.wallets%ROWTYPE;
    v_fee public.administration_fee_ledger%ROWTYPE;
    v_reward_refund numeric(18,2);
    v_fee_refund numeric(18,2) := 0;
BEGIN
    SELECT * INTO v_job
      FROM public.jobs
     WHERE id = p_job_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;

    IF auth.uid() <> v_job.advertiser_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to cancel this job';
    END IF;

    IF v_job.status IN ('completed', 'cancelled', 'rejected') THEN
        RAISE EXCEPTION 'Job cannot be cancelled';
    END IF;

    IF v_job.status = 'pending_review' THEN
        SELECT * INTO v_fee
          FROM public.administration_fee_ledger
         WHERE job_id = p_job_id
         FOR UPDATE;

        IF NOT FOUND OR v_fee.status <> 'pending' THEN
            RAISE EXCEPTION 'Refundable administration fee record not found';
        END IF;

        v_fee_refund := v_fee.total_fee;
    END IF;

    v_reward_refund := v_job.remaining_budget;

    IF v_job.funding_wallet_id IS NULL THEN
        RAISE EXCEPTION 'This job has no recorded funding wallet; refund is blocked for safety';
    END IF;

    SELECT * INTO v_wallet
      FROM public.wallets
     WHERE id = v_job.funding_wallet_id
       AND user_id = v_job.advertiser_id
     FOR UPDATE;

    IF NOT FOUND OR v_wallet.currency <> v_job.currency THEN
        RAISE EXCEPTION 'Original job funding wallet not found or currency mismatch';
    END IF;

    UPDATE public.job_submissions
       SET status = 'cancelled'
     WHERE job_id = p_job_id
       AND status IN ('in_progress', 'submitted');

    IF v_reward_refund > 0 THEN
        UPDATE public.wallets
           SET held_balance = held_balance - v_reward_refund,
               available_balance = available_balance + v_reward_refund,
               updated_at = NOW()
         WHERE id = v_wallet.id
           AND held_balance >= v_reward_refund;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Held balance inconsistency';
        END IF;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES
        (
            v_wallet.id, v_job.advertiser_id,
            'job_funding_release', 'debit', 'held',
            v_reward_refund, v_wallet.currency, 'job', p_job_id,
            'Cancelled job reward hold released'
        ),
        (
            v_wallet.id, v_job.advertiser_id,
            'refund', 'credit', 'available',
            v_reward_refund, v_wallet.currency, 'job', p_job_id,
            'Unused worker reward budget refunded'
        );
    END IF;

    IF v_fee_refund > 0 THEN
        UPDATE public.wallets
           SET available_balance = available_balance + v_fee_refund,
               updated_at = NOW()
         WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES (
            v_wallet.id, v_job.advertiser_id, 'refund', 'credit',
            'available', v_fee_refund, v_wallet.currency, 'job', p_job_id,
            'Pending-review platform and color fees fully refunded'
        );

        UPDATE public.administration_fee_ledger
           SET status = 'refunded', refunded_at = NOW()
         WHERE job_id = p_job_id AND status = 'pending';
    END IF;

    UPDATE public.jobs
       SET status = 'cancelled', remaining_budget = 0
     WHERE id = p_job_id;
END;
$function$;

-- Reject: refund unused job budget and Color Fee only; retain the 15% platform fee.
CREATE OR REPLACE FUNCTION public.reject_job(p_job_id uuid, p_admin_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_job public.jobs%ROWTYPE;
    v_wallet public.wallets%ROWTYPE;
    v_fee public.administration_fee_ledger%ROWTYPE;
    v_reward_refund numeric(18,2);
    v_color_refund numeric(18,2);
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT * INTO v_job
      FROM public.jobs
     WHERE id = p_job_id
     FOR UPDATE;

    IF NOT FOUND OR v_job.status <> 'pending_review' THEN
        RAISE EXCEPTION 'Job is not pending review';
    END IF;

    SELECT * INTO v_fee
      FROM public.administration_fee_ledger
     WHERE job_id = p_job_id
     FOR UPDATE;

    IF NOT FOUND OR v_fee.status <> 'pending' THEN
        RAISE EXCEPTION 'Refundable administration fee record not found';
    END IF;

    v_reward_refund := v_job.remaining_budget;
    v_color_refund := COALESCE(v_fee.color_fee, v_job.color_fee, 0);

    IF v_job.funding_wallet_id IS NULL THEN
        RAISE EXCEPTION 'This job has no recorded funding wallet; refund is blocked for safety';
    END IF;

    SELECT * INTO v_wallet
      FROM public.wallets
     WHERE id = v_job.funding_wallet_id
       AND user_id = v_job.advertiser_id
     FOR UPDATE;

    IF NOT FOUND OR v_wallet.currency <> v_job.currency THEN
        RAISE EXCEPTION 'Original job funding wallet not found or currency mismatch';
    END IF;

    IF v_reward_refund > 0 THEN
        UPDATE public.wallets
           SET held_balance = held_balance - v_reward_refund,
               available_balance = available_balance + v_reward_refund,
               updated_at = NOW()
         WHERE id = v_wallet.id
           AND held_balance >= v_reward_refund;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Held balance inconsistency';
        END IF;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES
        (
            v_wallet.id, v_job.advertiser_id, 'job_funding_release',
            'debit', 'held', v_reward_refund, v_wallet.currency,
            'job', p_job_id, 'Rejected job reward hold released'
        ),
        (
            v_wallet.id, v_job.advertiser_id, 'refund',
            'credit', 'available', v_reward_refund, v_wallet.currency,
            'job', p_job_id, 'Rejected job reward budget refunded'
        );
    END IF;

    IF v_color_refund > 0 THEN
        UPDATE public.wallets
           SET available_balance = available_balance + v_color_refund,
               updated_at = NOW()
         WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES (
            v_wallet.id, v_job.advertiser_id, 'refund', 'credit',
            'available', v_color_refund, v_wallet.currency, 'job', p_job_id,
            'Rejected job Color Fee refunded; 15% platform fee retained'
        );
    END IF;

    -- Keep the percentage platform fee in the ledger; only Color Fee is refunded.
    UPDATE public.administration_fee_ledger
       SET color_fee = 0,
           total_fee = administration_fee,
           status = 'earned',
           earned_at = COALESCE(earned_at, NOW()),
           refunded_at = NULL
     WHERE job_id = p_job_id;

    UPDATE public.jobs
       SET status = 'rejected',
           remaining_budget = 0,
           admin_reviewed_by = auth.uid(),
           admin_reviewed_at = NOW(),
           admin_review_note = p_admin_note
     WHERE id = p_job_id;

    INSERT INTO public.admin_logs (admin_id, action, target_type, target_id)
    VALUES (auth.uid(), 'reject_job', 'job', p_job_id);
END;
$function$;

COMMIT;

-- Verification:
-- SELECT id, currency, payment_method, funding_wallet_id, status
-- FROM public.jobs ORDER BY created_at DESC LIMIT 10;
-- SELECT id, user_id, currency, payment_method, available_balance, held_balance
-- FROM public.wallets ORDER BY user_id, currency, payment_method;
