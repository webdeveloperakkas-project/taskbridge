-- TaskBridge: Wallet foundation migration
-- Date: 2026-11-12
-- IMPORTANT: This is a schema/data migration, not a database backup.
-- Before running it, create a Supabase database backup (Dashboard > Database > Backups)
-- or take a full logical export. Do not rely on this file as a backup of live data.
--
-- This migration:
--   * preserves all existing wallet balances under payment_method = 'LEGACY'
--   * allows one wallet per user + currency + payment method
--   * creates eight zero-balance wallets for existing and future users
--   * adds wallet references to jobs and withdrawals
--
-- It deliberately does NOT reassign historical balances, jobs, or withdrawals.

BEGIN;

-- 1. Add payment_method. Existing rows are retained as LEGACY.
ALTER TABLE public.wallets
    ADD COLUMN IF NOT EXISTS payment_method text;

UPDATE public.wallets
SET payment_method = 'LEGACY'
WHERE payment_method IS NULL;

ALTER TABLE public.wallets
    ALTER COLUMN payment_method SET DEFAULT 'LEGACY';

ALTER TABLE public.wallets
    ALTER COLUMN payment_method SET NOT NULL;

-- 2. Remove the old (user_id, currency) unique rule whether it is
--    represented as a table constraint or as a standalone unique index.
DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.wallets'::regclass
          AND conname = 'wallets_user_id_currency_key'
    ) THEN
        ALTER TABLE public.wallets
            DROP CONSTRAINT wallets_user_id_currency_key;
    ELSE
        DROP INDEX IF EXISTS public.wallets_user_id_currency_key;
    END IF;
END
$migration$;

-- 3. Enforce the new wallet identity.
CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_currency_method_key
    ON public.wallets (user_id, currency, payment_method);

ALTER TABLE public.wallets
    DROP CONSTRAINT IF EXISTS wallets_payment_method_check;

ALTER TABLE public.wallets
    ADD CONSTRAINT wallets_payment_method_check
    CHECK (
        payment_method IN (
            'bKash', 'Nagad', 'Rocket', 'Bank Transfer',
            'Wise', 'WebMoney', 'Visa', 'Mastercard', 'LEGACY'
        )
    );

-- 4. Record the exact funding wallet on each new job.
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS funding_wallet_id uuid;

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.jobs'::regclass
          AND conname = 'jobs_funding_wallet_id_fkey'
    ) THEN
        ALTER TABLE public.jobs
            ADD CONSTRAINT jobs_funding_wallet_id_fkey
            FOREIGN KEY (funding_wallet_id)
            REFERENCES public.wallets(id)
            ON DELETE RESTRICT;
    END IF;
END
$migration$;

-- 5. Record the exact wallet reserved by each new withdrawal.
ALTER TABLE public.withdrawals
    ADD COLUMN IF NOT EXISTS wallet_id uuid;

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.withdrawals'::regclass
          AND conname = 'withdrawals_wallet_id_fkey'
    ) THEN
        ALTER TABLE public.withdrawals
            ADD CONSTRAINT withdrawals_wallet_id_fkey
            FOREIGN KEY (wallet_id)
            REFERENCES public.wallets(id)
            ON DELETE RESTRICT;
    END IF;
END
$migration$;

-- 6. Provision all eight supported wallets for a user.
CREATE OR REPLACE FUNCTION public.provision_user_wallets(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;

    INSERT INTO public.wallets (
        user_id, currency, payment_method,
        available_balance, held_balance
    )
    VALUES
        (p_user_id, 'BDT', 'bKash', 0, 0),
        (p_user_id, 'BDT', 'Nagad', 0, 0),
        (p_user_id, 'BDT', 'Rocket', 0, 0),
        (p_user_id, 'BDT', 'Bank Transfer', 0, 0),
        (p_user_id, 'USD', 'Wise', 0, 0),
        (p_user_id, 'USD', 'WebMoney', 0, 0),
        (p_user_id, 'USD', 'Visa', 0, 0),
        (p_user_id, 'USD', 'Mastercard', 0, 0)
    ON CONFLICT (user_id, currency, payment_method) DO NOTHING;
END;
$function$;

-- 7. Backfill zero-balance supported wallets for existing auth users.
INSERT INTO public.wallets (
    user_id, currency, payment_method,
    available_balance, held_balance
)
SELECT
    u.id,
    w.currency,
    w.payment_method,
    0,
    0
FROM auth.users AS u
CROSS JOIN (
    VALUES
        ('BDT', 'bKash'),
        ('BDT', 'Nagad'),
        ('BDT', 'Rocket'),
        ('BDT', 'Bank Transfer'),
        ('USD', 'Wise'),
        ('USD', 'WebMoney'),
        ('USD', 'Visa'),
        ('USD', 'Mastercard')
) AS w(currency, payment_method)
ON CONFLICT (user_id, currency, payment_method) DO NOTHING;

-- 8. Automatically provision wallets for future auth users.
CREATE OR REPLACE FUNCTION public.handle_new_user_wallets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    PERFORM public.provision_user_wallets(NEW.id);
    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created_wallets ON auth.users;

CREATE TRIGGER on_auth_user_created_wallets
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_wallets();

-- Prevent direct client invocation of the SECURITY DEFINER helper.
REVOKE ALL ON FUNCTION public.provision_user_wallets(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user_wallets() FROM PUBLIC;

COMMIT;

-- After running, verify:
-- SELECT payment_method, currency, COUNT(*)
-- FROM public.wallets
-- GROUP BY payment_method, currency
-- ORDER BY currency, payment_method;
--
-- This is only Part 1. Deposit, withdrawal, job-funding, reward,
-- approval, cancellation and refund RPCs must be migrated separately
-- before enabling the new wallet flow in production.
