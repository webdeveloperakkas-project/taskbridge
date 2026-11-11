-- TaskBridge: add WebMoney WMZ as a conditional withdrawal method.
-- A member may request WebMoney withdrawal only after at least one WebMoney deposit
-- has been approved by an administrator. Frontend visibility is not the security boundary.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_webmoney_withdrawal_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF lower(trim(coalesce(NEW.payment_method, ''))) = 'webmoney'
       AND NOT EXISTS (
           SELECT 1
           FROM public.deposits AS d
           WHERE d.user_id = NEW.user_id
             AND lower(trim(coalesce(d.payment_method, ''))) = 'webmoney'
             AND lower(trim(coalesce(d.status, ''))) IN ('approved', 'completed')
       )
    THEN
        RAISE EXCEPTION 'WebMoney withdrawals are available only after an approved WebMoney deposit.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_webmoney_withdrawal_eligibility ON public.withdrawals;

CREATE TRIGGER enforce_webmoney_withdrawal_eligibility
BEFORE INSERT OR UPDATE OF user_id, payment_method
ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_webmoney_withdrawal_eligibility();

COMMIT;

NOTIFY pgrst, 'reload schema';
