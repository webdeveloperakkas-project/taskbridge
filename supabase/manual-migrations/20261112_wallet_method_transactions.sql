-- TaskBridge Part 2: method-specific deposits and withdrawals
-- Requires: 20261112_wallet_foundation.sql already completed successfully.
-- This migration preserves the existing admin review and transaction-ledger flow.
-- It does not create wallets during deposit/withdrawal processing.

BEGIN;

CREATE OR REPLACE FUNCTION public.process_deposit(
    p_deposit_id uuid,
    p_approve boolean,
    p_review_note text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_deposit public.deposits%ROWTYPE;
    v_wallet public.wallets%ROWTYPE;
    v_method text;
    v_currency text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT *
    INTO v_deposit
    FROM public.deposits
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND OR v_deposit.status <> 'pending' THEN
        RAISE EXCEPTION 'Deposit is not pending';
    END IF;

    IF p_approve THEN
        v_method := CASE lower(trim(v_deposit.payment_method))
            WHEN 'bkash' THEN 'bKash'
            WHEN 'nagad' THEN 'Nagad'
            WHEN 'rocket' THEN 'Rocket'
            WHEN 'bank transfer' THEN 'Bank Transfer'
            WHEN 'wise' THEN 'Wise'
            WHEN 'wise (manual transfer)' THEN 'Wise'
            WHEN 'webmoney' THEN 'WebMoney'
            WHEN 'visa' THEN 'Visa'
            WHEN 'mastercard' THEN 'Mastercard'
            ELSE NULL
        END;

        v_currency := CASE
            WHEN v_method IN ('bKash', 'Nagad', 'Rocket', 'Bank Transfer') THEN 'BDT'
            WHEN v_method IN ('Wise', 'WebMoney', 'Visa', 'Mastercard') THEN 'USD'
            ELSE NULL
        END;

        IF v_method IS NULL OR COALESCE(upper(trim(v_deposit.currency)), '') <> v_currency THEN
            RAISE EXCEPTION 'Unsupported deposit method or currency mismatch';
        END IF;

        SELECT *
        INTO v_wallet
        FROM public.wallets
        WHERE user_id = v_deposit.user_id
          AND currency = v_currency
          AND payment_method = v_method
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'The matching % % wallet is missing; deposit was not credited',
                v_currency, v_method;
        END IF;

        UPDATE public.wallets
        SET available_balance = available_balance + v_deposit.amount,
            updated_at = NOW()
        WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type,
            reference_id, description
        )
        VALUES (
            v_wallet.id, v_deposit.user_id, 'deposit', 'credit',
            'available', v_deposit.amount, v_currency,
            'deposit', p_deposit_id,
            'Approved deposit to ' || v_method || ' wallet - no fee deducted'
        );

        UPDATE public.deposits
        SET status = 'approved',
            reviewed_by = auth.uid(),
            reviewed_at = NOW(),
            review_note = p_review_note
        WHERE id = p_deposit_id;
    ELSE
        UPDATE public.deposits
        SET status = 'rejected',
            reviewed_by = auth.uid(),
            reviewed_at = NOW(),
            review_note = p_review_note
        WHERE id = p_deposit_id;
    END IF;
END;
$function$;


CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_amount numeric,
    p_currency text,
    p_payment_method text,
    p_payment_account text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user uuid := auth.uid();
    v_wallet public.wallets%ROWTYPE;
    v_withdrawal_id uuid;
    v_min numeric;
    v_max numeric;
    v_currency text;
    v_method text;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_method := CASE lower(trim(p_payment_method))
        WHEN 'bkash' THEN 'bKash'
        WHEN 'nagad' THEN 'Nagad'
        WHEN 'rocket' THEN 'Rocket'
        WHEN 'bank transfer' THEN 'Bank Transfer'
        WHEN 'wise' THEN 'Wise'
        WHEN 'wise (manual transfer)' THEN 'Wise'
        WHEN 'webmoney' THEN 'WebMoney'
        WHEN 'visa' THEN 'Visa'
        WHEN 'mastercard' THEN 'Mastercard'
        ELSE NULL
    END;

    v_currency := CASE
        WHEN v_method IN ('bKash', 'Nagad', 'Rocket', 'Bank Transfer') THEN 'BDT'
        WHEN v_method IN ('Wise', 'WebMoney', 'Visa', 'Mastercard') THEN 'USD'
        ELSE NULL
    END;

    IF v_currency IS NULL OR COALESCE(upper(trim(p_currency)), '') <> v_currency THEN
        RAISE EXCEPTION 'Unsupported payment method or currency mismatch';
    END IF;

    IF p_payment_account IS NULL OR length(trim(p_payment_account)) = 0 THEN
        RAISE EXCEPTION 'Receiving account details are required';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid withdrawal amount';
    END IF;

    SELECT (setting_value #>> '{}')::numeric
    INTO v_min
    FROM public.platform_settings
    WHERE setting_key = 'minimum_withdrawal';

    SELECT (setting_value #>> '{}')::numeric
    INTO v_max
    FROM public.platform_settings
    WHERE setting_key = 'maximum_withdrawal';

    IF p_amount < COALESCE(v_min, 5)
       OR p_amount > COALESCE(v_max, 1000) THEN
        RAISE EXCEPTION 'Withdrawal amount is outside allowed limits';
    END IF;

    SELECT *
    INTO v_wallet
    FROM public.wallets
    WHERE user_id = v_user
      AND currency = v_currency
      AND payment_method = v_method
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Your % % wallet is missing. Contact support; no wallet was created.',
            v_currency, v_method;
    END IF;

    IF v_wallet.available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient available balance in the selected % wallet', v_method;
    END IF;

    UPDATE public.wallets
    SET available_balance = available_balance - p_amount,
        held_balance = held_balance + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    INSERT INTO public.withdrawals (
        user_id, wallet_id, amount, currency, payment_method, payment_account
    )
    VALUES (
        v_user, v_wallet.id, p_amount, v_currency, v_method, trim(p_payment_account)
    )
    RETURNING id INTO v_withdrawal_id;

    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, transaction_type, direction,
        balance_type, amount, currency, reference_type,
        reference_id, description
    )
    VALUES
    (
        v_wallet.id, v_user, 'withdrawal_hold', 'debit',
        'available', p_amount, v_currency, 'withdrawal',
        v_withdrawal_id, 'Withdrawal amount reserved from ' || v_method || ' wallet'
    ),
    (
        v_wallet.id, v_user, 'withdrawal_hold', 'credit',
        'held', p_amount, v_currency, 'withdrawal',
        v_withdrawal_id, 'Withdrawal amount held in ' || v_method || ' wallet'
    );

    RETURN v_withdrawal_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.process_withdrawal(
    p_withdrawal_id uuid,
    p_approve boolean,
    p_admin_note text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_withdrawal public.withdrawals%ROWTYPE;
    v_wallet public.wallets%ROWTYPE;
    v_method text;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT *
    INTO v_withdrawal
    FROM public.withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND OR v_withdrawal.status <> 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is not pending';
    END IF;

    -- New requests always carry wallet_id. For older pending requests created
    -- before Part 2, use the preserved LEGACY wallet only; never guess a method wallet.
    IF v_withdrawal.wallet_id IS NOT NULL THEN
        SELECT *
        INTO v_wallet
        FROM public.wallets
        WHERE id = v_withdrawal.wallet_id
          AND user_id = v_withdrawal.user_id
          AND currency = v_withdrawal.currency
        FOR UPDATE;
    ELSE
        SELECT *
        INTO v_wallet
        FROM public.wallets
        WHERE user_id = v_withdrawal.user_id
          AND currency = v_withdrawal.currency
          AND payment_method = 'LEGACY'
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.withdrawals
            SET wallet_id = v_wallet.id
            WHERE id = p_withdrawal_id;
        END IF;
    END IF;

    IF NOT FOUND OR v_wallet.held_balance < v_withdrawal.amount THEN
        RAISE EXCEPTION 'Held balance inconsistency or linked wallet is missing';
    END IF;

    v_method := COALESCE(v_wallet.payment_method, 'LEGACY');

    IF p_approve THEN
        UPDATE public.wallets
        SET held_balance = held_balance - v_withdrawal.amount,
            updated_at = NOW()
        WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES (
            v_wallet.id, v_withdrawal.user_id, 'withdrawal', 'debit',
            'held', v_withdrawal.amount, v_withdrawal.currency,
            'withdrawal', p_withdrawal_id,
            'Withdrawal processed from ' || v_method || ' wallet'
        );

        UPDATE public.withdrawals
        SET status = 'approved',
            processed_by = auth.uid(),
            processed_at = NOW(),
            admin_note = p_admin_note
        WHERE id = p_withdrawal_id;
    ELSE
        UPDATE public.wallets
        SET held_balance = held_balance - v_withdrawal.amount,
            available_balance = available_balance + v_withdrawal.amount,
            updated_at = NOW()
        WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, transaction_type, direction,
            balance_type, amount, currency, reference_type, reference_id, description
        )
        VALUES
        (
            v_wallet.id, v_withdrawal.user_id, 'withdrawal_refund', 'debit',
            'held', v_withdrawal.amount, v_withdrawal.currency,
            'withdrawal', p_withdrawal_id, 'Rejected withdrawal released from held balance'
        ),
        (
            v_wallet.id, v_withdrawal.user_id, 'withdrawal_refund', 'credit',
            'available', v_withdrawal.amount, v_withdrawal.currency,
            'withdrawal', p_withdrawal_id, 'Withdrawal amount returned to the same wallet'
        );

        UPDATE public.withdrawals
        SET status = 'rejected',
            processed_by = auth.uid(),
            processed_at = NOW(),
            admin_note = p_admin_note
        WHERE id = p_withdrawal_id;
    END IF;
END;
$function$;

COMMIT;

-- Verification after execution:
-- SELECT payment_method, currency, COUNT(*)
-- FROM public.wallets
-- GROUP BY payment_method, currency
-- ORDER BY currency, payment_method;
--
-- Check new pending withdrawals have wallet_id:
-- SELECT id, payment_method, currency, wallet_id, status
-- FROM public.withdrawals
-- WHERE status = 'pending'
-- ORDER BY created_at DESC;
