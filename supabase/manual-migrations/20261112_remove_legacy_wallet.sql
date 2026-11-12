-- Remove LEGACY wallet compatibility and prohibit future LEGACY wallet rows.
-- Apply after the LEGACY wallet data has been migrated to a real payment method.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.wallets
        WHERE UPPER(BTRIM(payment_method)) = 'LEGACY'
    ) THEN
        RAISE EXCEPTION
            'LEGACY wallets still exist. Migrate all LEGACY balances and references before applying this migration.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.wallets'::regclass
          AND conname = 'wallets_no_legacy_method'
    ) THEN
        ALTER TABLE public.wallets
        ADD CONSTRAINT wallets_no_legacy_method
        CHECK (UPPER(BTRIM(payment_method)) <> 'LEGACY');
    END IF;
END
$$;

-- Pending withdrawals must always reference their exact wallet.
-- There is intentionally no LEGACY fallback or method guessing.
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

    IF v_withdrawal.wallet_id IS NULL THEN
        RAISE EXCEPTION 'Withdrawal has no linked wallet; manual review is required';
    END IF;

    SELECT *
    INTO v_wallet
    FROM public.wallets
    WHERE id = v_withdrawal.wallet_id
      AND user_id = v_withdrawal.user_id
      AND currency = v_withdrawal.currency
    FOR UPDATE;

    IF NOT FOUND OR v_wallet.held_balance < v_withdrawal.amount THEN
        RAISE EXCEPTION 'Held balance inconsistency or linked wallet is missing';
    END IF;

    IF v_wallet.payment_method IS NULL
       OR UPPER(BTRIM(v_wallet.payment_method)) = 'LEGACY' THEN
        RAISE EXCEPTION 'Withdrawal wallet method is invalid';
    END IF;

    v_method := v_wallet.payment_method;

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
            'withdrawal', p_withdrawal_id,
            'Rejected withdrawal released from held balance'
        ),
        (
            v_wallet.id, v_withdrawal.user_id, 'withdrawal_refund', 'credit',
            'available', v_withdrawal.amount, v_withdrawal.currency,
            'withdrawal', p_withdrawal_id,
            'Withdrawal amount returned to the same wallet'
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

-- Verification:
-- SELECT currency, payment_method, COUNT(*)
-- FROM public.wallets
-- GROUP BY currency, payment_method
-- ORDER BY currency, payment_method;
