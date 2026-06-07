
-- =========================================================
-- 1. SUBSCRIPTIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free','starter','pro','business')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  current_period_end timestamptz,
  paystack_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own subscription" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- 2. USAGE DAILY (rate limit counter)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.usage_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);
GRANT SELECT ON public.usage_daily TO authenticated;
GRANT ALL ON public.usage_daily TO service_role;
ALTER TABLE public.usage_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own usage" ON public.usage_daily FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- 3. PAYMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier text NOT NULL CHECK (tier IN ('starter','pro','business')),
  amount_kes integer NOT NULL,
  display_currency text,
  display_amount numeric,
  reference text NOT NULL UNIQUE,
  authorization_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_payments_status_expires ON public.payments(status, expires_at);
CREATE TRIGGER trg_pay_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- 4. WEBHOOK ENDPOINTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  secret text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['sms.sent','sms.delivered','sms.failed'],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own webhooks" ON public.webhook_endpoints FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_wh_updated BEFORE UPDATE ON public.webhook_endpoints FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- 5. WEBHOOK DELIVERIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered','failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  last_response_code integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own deliveries" ON public.webhook_deliveries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_deliveries_pending ON public.webhook_deliveries(status, next_attempt_at);
CREATE TRIGGER trg_wd_updated BEFORE UPDATE ON public.webhook_deliveries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- 6. QUOTA FUNCTION
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_and_increment_sms_quota(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text := 'free';
  _limit int := 20;
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _sub record;
  _used int := 0;
BEGIN
  SELECT tier, status, current_period_end INTO _sub FROM public.subscriptions WHERE user_id = _user_id;
  IF _sub.tier IS NOT NULL AND _sub.status = 'active' AND (_sub.current_period_end IS NULL OR _sub.current_period_end > now()) THEN
    _tier := _sub.tier;
  END IF;
  _limit := CASE _tier
    WHEN 'starter' THEN 200
    WHEN 'pro' THEN 1500
    WHEN 'business' THEN 5000
    ELSE 20
  END;

  INSERT INTO public.usage_daily(user_id, day, sent_count)
  VALUES (_user_id, _today, 0)
  ON CONFLICT (user_id, day) DO NOTHING;

  SELECT sent_count INTO _used FROM public.usage_daily WHERE user_id = _user_id AND day = _today FOR UPDATE;

  IF _used >= _limit THEN
    RETURN jsonb_build_object('allowed', false, 'tier', _tier, 'limit', _limit, 'used', _used, 'remaining', 0);
  END IF;

  UPDATE public.usage_daily SET sent_count = sent_count + 1, updated_at = now()
   WHERE user_id = _user_id AND day = _today;

  RETURN jsonb_build_object('allowed', true, 'tier', _tier, 'limit', _limit, 'used', _used + 1, 'remaining', _limit - _used - 1);
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_and_increment_sms_quota(uuid) TO service_role;

-- =========================================================
-- 7. WEBHOOK TRIGGER on messages status change
-- =========================================================
CREATE OR REPLACE FUNCTION public.enqueue_webhook_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event text;
  _ep record;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;
  _event := CASE NEW.status
    WHEN 'sent' THEN 'sms.sent'
    WHEN 'delivered' THEN 'sms.delivered'
    WHEN 'failed' THEN 'sms.failed'
    ELSE NULL
  END;
  IF _event IS NULL THEN RETURN NEW; END IF;
  FOR _ep IN SELECT * FROM public.webhook_endpoints WHERE user_id = NEW.user_id AND active = true AND _event = ANY(events) LOOP
    INSERT INTO public.webhook_deliveries(endpoint_id, user_id, event, payload)
    VALUES (_ep.id, NEW.user_id, _event, jsonb_build_object(
      'event', _event,
      'message_id', NEW.id,
      'recipient', NEW.recipient,
      'status', NEW.status,
      'failure_reason', NEW.failure_reason,
      'sent_at', NEW.sent_at,
      'delivered_at', NEW.delivered_at,
      'failed_at', NEW.failed_at
    ));
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_messages_webhook ON public.messages;
CREATE TRIGGER trg_messages_webhook
  AFTER UPDATE OF status ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_webhook_delivery();

-- =========================================================
-- 8. EXPIRE PAYMENTS CRON
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'expire-pending-payments',
  '* * * * *',
  $cron$
  UPDATE public.payments SET status = 'expired', updated_at = now()
   WHERE status = 'pending' AND expires_at < now();
  $cron$
);
