CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
BEGIN
  LOOP
    v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

UPDATE public.users
  SET referral_code = public.generate_unique_referral_code()
  WHERE referral_code IS NULL;

ALTER TABLE public.users
  ALTER COLUMN referral_code SET NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_referral_code_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_unique_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_referral_code ON public.users;
CREATE TRIGGER trg_assign_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_referral_code_trigger();

CREATE OR REPLACE FUNCTION public.get_my_referral_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT referral_code FROM public.users WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_referral_code() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;

CREATE OR REPLACE FUNCTION public.record_referral(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id   UUID := auth.uid();
  v_referrer_id     UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in';
  END IF;

  IF p_code IS NULL OR length(p_code) > 32 OR p_code !~ '^[A-Za-z0-9+/=_-]+$' THEN
    RAISE EXCEPTION 'Invalid referral code format';
  END IF;

  SELECT id INTO v_referrer_id
    FROM public.users
    WHERE referral_code = p_code
    LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'Referral code not found';
  END IF;

  IF v_referrer_id = current_user_id THEN
    RAISE EXCEPTION 'Self-referral not allowed';
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = current_user_id) THEN
    RAISE EXCEPTION 'Already referred';
  END IF;

  INSERT INTO public.referrals (referrer_user_id, referred_user_id)
    VALUES (v_referrer_id, current_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_referral(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.record_referral(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.lookup_referral_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE referral_code = p_code
  );
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_referral_code(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.lookup_referral_code(TEXT) TO anon, authenticated;
