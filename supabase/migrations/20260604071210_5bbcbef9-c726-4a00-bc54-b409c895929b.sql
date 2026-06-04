-- Track signup attempts by phone & device fingerprint to enforce max 2 per identifier
CREATE TABLE IF NOT EXISTS public.signup_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text,
  fingerprint text,
  email text NOT NULL,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.signup_registry TO authenticated;
GRANT SELECT, INSERT ON public.signup_registry TO anon;
GRANT ALL ON public.signup_registry TO service_role;
ALTER TABLE public.signup_registry ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signup-time check is via RPC); allow user to read their own
CREATE POLICY "anon can insert signup_registry"
ON public.signup_registry FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "user reads own signup_registry"
ON public.signup_registry FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_signup_phone ON public.signup_registry(phone);
CREATE INDEX IF NOT EXISTS idx_signup_fp ON public.signup_registry(fingerprint);

-- RPC to check if signup is allowed before attempting auth.signUp
CREATE OR REPLACE FUNCTION public.check_signup_allowed(_phone text, _fingerprint text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  phone_count int := 0;
  fp_count int := 0;
BEGIN
  IF _phone IS NOT NULL AND length(_phone) > 0 THEN
    SELECT count(*) INTO phone_count FROM public.signup_registry WHERE phone = _phone;
  END IF;
  IF _fingerprint IS NOT NULL AND length(_fingerprint) > 0 THEN
    SELECT count(*) INTO fp_count FROM public.signup_registry WHERE fingerprint = _fingerprint;
  END IF;
  IF phone_count >= 2 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'phone_limit');
  END IF;
  IF fp_count >= 2 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'device_limit');
  END IF;
  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_signup_allowed(text, text) TO anon, authenticated;

-- Add phone column to profiles for record
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;