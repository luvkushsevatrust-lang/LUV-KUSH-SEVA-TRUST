-- ==============================================================================
-- LUV KUSH SEVA TRUST – PHASE 1: DATABASE AND SECURITY REPAIR MIGRATION
-- Project ID: yjbowhkgwatrwmuyvkja
-- Safe, Additive & Idempotent Migration (Zero Drops, Zero Data Deletion)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 0: IN-DATABASE BACKUP SNAPSHOTS BEFORE ANY CHANGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.donations_backup_phase1 AS
SELECT * FROM public.donations;

CREATE TABLE IF NOT EXISTS public.razorpay_orders_backup_phase1 AS
SELECT * FROM public.razorpay_orders;

CREATE TABLE IF NOT EXISTS public.razorpay_payments_backup_phase1 AS
SELECT * FROM public.razorpay_payments;

CREATE TABLE IF NOT EXISTS public.razorpay_webhooks_backup_phase1 AS
SELECT * FROM public.razorpay_webhooks;

CREATE TABLE IF NOT EXISTS public.id_card_orders_backup_phase1 AS
SELECT * FROM public.id_card_orders;

-- Lock backup tables immediately against anon/authenticated access
ALTER TABLE public.donations_backup_phase1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_orders_backup_phase1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_payments_backup_phase1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_webhooks_backup_phase1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_orders_backup_phase1 ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.donations_backup_phase1 FROM anon, authenticated;
REVOKE ALL ON public.razorpay_orders_backup_phase1 FROM anon, authenticated;
REVOKE ALL ON public.razorpay_payments_backup_phase1 FROM anon, authenticated;
REVOKE ALL ON public.razorpay_webhooks_backup_phase1 FROM anon, authenticated;
REVOKE ALL ON public.id_card_orders_backup_phase1 FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- STEP 1: SAFE ADDITIVE COLUMNS ON public.donations
-- (Preserves all existing rows; adds columns expected by backend verification)
-- ------------------------------------------------------------------------------
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pan_card TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Approved';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approval_remarks TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual';

-- Unique Receipt Number Sequence & Collision-Proof Generator
CREATE SEQUENCE IF NOT EXISTS public.donation_receipt_seq START WITH 2000 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_unique_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
  yr TEXT;
  candidate TEXT;
BEGIN
  yr := EXTRACT(YEAR FROM NOW())::TEXT;
  LOOP
    seq_val := nextval('public.donation_receipt_seq');
    candidate := 'LKST-REC-' || yr || '-' || LPAD(seq_val::TEXT, 5, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.donations WHERE receipt_number = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

-- Prevent duplicate Razorpay donation records atomically (partial indexes keep historical NULLs valid)
CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_payment_id
  ON public.donations (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_order_id
  ON public.donations (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL AND razorpay_order_id <> '';

CREATE INDEX IF NOT EXISTS idx_donations_rzp_payment ON public.donations (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_donations_rzp_order ON public.donations (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_donations_mobile ON public.donations (mobile);

-- ------------------------------------------------------------------------------
-- STEP 2: ALIGN PAYMENT TABLES & FIX UUID DEFAULTS (ADDITIVE ONLY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.razorpay_orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.razorpay_orders ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.razorpay_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.razorpay_payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS verified_via TEXT DEFAULT 'server_hmac';

ALTER TABLE public.razorpay_webhooks ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE public.id_card_orders ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.id_card_orders ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE public.id_card_orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.id_card_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- STEP 3: HARDEN RLS POLICIES (PREVENT UNAUTHORIZED PUBLIC ACCESS TO DONOR PII)
-- ------------------------------------------------------------------------------

-- 3A. Lock down internal Razorpay ledger tables (service_role only; NO anon access)
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role all razorpay_orders" ON public.razorpay_orders;
DROP POLICY IF EXISTS "Allow service role all razorpay_payments" ON public.razorpay_payments;
DROP POLICY IF EXISTS "Allow service role all razorpay_webhooks" ON public.razorpay_webhooks;
DROP POLICY IF EXISTS "Allow service role all id_card_orders" ON public.id_card_orders;

REVOKE ALL ON public.razorpay_orders FROM anon, authenticated;
REVOKE ALL ON public.razorpay_payments FROM anon, authenticated;
REVOKE ALL ON public.razorpay_webhooks FROM anon, authenticated;
REVOKE ALL ON public.id_card_orders FROM anon, authenticated;

CREATE POLICY "Service role only razorpay_orders"
  ON public.razorpay_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only razorpay_payments"
  ON public.razorpay_payments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only razorpay_webhooks"
  ON public.razorpay_webhooks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only id_card_orders"
  ON public.id_card_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3B. Lock down public.donations (NO anonymous table dump, NO anonymous forged inserts/deletes)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public select donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public insert donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public update donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public delete donations" ON public.donations;

REVOKE ALL ON public.donations FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.donations FROM authenticated;

CREATE POLICY "Service role full access donations"
  ON public.donations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated admins manage donations"
  ON public.donations FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow authenticated admins to view id_card_orders if using Supabase Auth
CREATE POLICY "Authenticated admins read id_card_orders"
  ON public.id_card_orders FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ------------------------------------------------------------------------------
-- STEP 4: SAFE PUBLIC RECEIPT LOOKUP RPC (EXACT MATCH ONLY, ZERO TABLE DUMP)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_approved_donation_receipt(p_query TEXT)
RETURNS TABLE (
  id TEXT,
  receipt_number TEXT,
  donor_name TEXT,
  mobile TEXT,
  amount NUMERIC,
  payment_mode TEXT,
  transaction_id TEXT,
  purpose TEXT,
  is_verified BOOLEAN,
  status TEXT,
  donated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_gateway TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_q TEXT;
BEGIN
  clean_q := TRIM(COALESCE(p_query, ''));
  IF LENGTH(clean_q) < 6 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.receipt_number,
    d.donor_name,
    d.mobile,
    d.amount,
    d.payment_mode,
    d.transaction_id,
    d.purpose,
    d.is_verified,
    d.status,
    d.donated_at,
    d.approved_at,
    d.razorpay_order_id,
    d.razorpay_payment_id,
    d.payment_gateway
  FROM public.donations d
  WHERE d.status = 'Approved'
    AND (
      UPPER(d.receipt_number) = UPPER(clean_q)
      OR d.razorpay_payment_id = clean_q
      OR d.transaction_id = clean_q
      OR (LENGTH(REGEXP_REPLACE(clean_q, '\D', '', 'g')) >= 10
          AND RIGHT(REGEXP_REPLACE(d.mobile, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(clean_q, '\D', '', 'g'), 10))
    )
  ORDER BY d.donated_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_approved_donation_receipt(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_approved_donation_receipt(TEXT) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.generate_unique_receipt_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_unique_receipt_number() TO service_role;
