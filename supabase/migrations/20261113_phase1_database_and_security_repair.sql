-- ==============================================================================
-- LUV KUSH SEVA TRUST – PHASE 1: DATABASE AND SECURITY REPAIR MIGRATION
-- Project ID: yjbowhkgwatrwmuyvkja
-- Safe, Additive & Idempotent Migration (Zero Drops, Zero Data Deletion)
--
-- IMPORTANT BEFORE RUNNING:
-- 1. First run the Read-Only Schema & Policy Inspection queries separately.
-- 2. Take a full Supabase Database Backup / pg_dump or CSV export first.
--    The *_backup_phase1 tables below are row-level snapshots only (they do NOT
--    copy indexes, constraints, sequences, or policies) and will NOT overwrite
--    an earlier snapshot if this script is re-run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 0: IN-DATABASE ROW SNAPSHOTS (NON-OVERWRITING, LOCKED DOWN)
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
-- Note: `status` defaults to 'Pending' (never auto-'Approved') for safety.
-- Existing rows are NOT altered if `status` already exists.
-- ------------------------------------------------------------------------------
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS pan_card TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approval_remarks TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual';

-- Unique Receipt Number Sequence & Collision-Proof Generator (IST / Asia/Kolkata)
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
  yr := EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Kolkata'))::TEXT;
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

-- Safe Duplicate Guard + Partial Unique Indexes on public.donations
DO $$
DECLARE
  dup_pay_count INT;
  dup_ord_count INT;
  dup_rec_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_pay_count FROM (
    SELECT razorpay_payment_id
    FROM public.donations
    WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> ''
    GROUP BY razorpay_payment_id
    HAVING COUNT(*) > 1
  ) t;

  SELECT COUNT(*) INTO dup_ord_count FROM (
    SELECT razorpay_order_id
    FROM public.donations
    WHERE razorpay_order_id IS NOT NULL AND razorpay_order_id <> ''
    GROUP BY razorpay_order_id
    HAVING COUNT(*) > 1
  ) t;

  SELECT COUNT(*) INTO dup_rec_count FROM (
    SELECT receipt_number
    FROM public.donations
    WHERE receipt_number IS NOT NULL AND receipt_number <> ''
    GROUP BY receipt_number
    HAVING COUNT(*) > 1
  ) t;

  IF dup_pay_count > 0 THEN
    RAISE EXCEPTION 'Cannot create unique index uq_donations_razorpay_payment_id: % duplicate razorpay_payment_id group(s) exist.', dup_pay_count;
  END IF;

  IF dup_ord_count > 0 THEN
    RAISE EXCEPTION 'Cannot create unique index uq_donations_razorpay_order_id: % duplicate razorpay_order_id group(s) exist.', dup_ord_count;
  END IF;

  IF dup_rec_count > 0 THEN
    RAISE EXCEPTION 'Existing duplicate receipt_number group(s) detected: %.', dup_rec_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_payment_id
  ON public.donations (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL AND razorpay_payment_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_razorpay_order_id
  ON public.donations (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL AND razorpay_order_id <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_donations_receipt_number
  ON public.donations (receipt_number)
  WHERE receipt_number IS NOT NULL AND receipt_number <> '';

CREATE INDEX IF NOT EXISTS idx_donations_rzp_payment ON public.donations (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_donations_rzp_order ON public.donations (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_donations_mobile ON public.donations (mobile);

-- ------------------------------------------------------------------------------
-- STEP 2: TYPE-CHECKED ID DEFAULTS & ADDITIVE PAYMENT TABLE ALIGNMENT
-- Only attaches `DEFAULT gen_random_uuid()` when column `id` is confirmed UUID.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  tbl TEXT;
  col_udt TEXT;
  order_id_nullable TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['razorpay_orders', 'razorpay_payments', 'razorpay_webhooks', 'id_card_orders']
  LOOP
    SELECT udt_name INTO col_udt
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'id';

    IF col_udt = 'uuid' THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()', tbl);
    ELSE
      RAISE NOTICE 'Skipped gen_random_uuid() on public.%.id because live type is % (expected uuid).', tbl, COALESCE(col_udt, 'MISSING');
    END IF;
  END LOOP;

  SELECT is_nullable INTO order_id_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'id_card_orders' AND column_name = 'order_id';

  IF order_id_nullable = 'NO' THEN
    ALTER TABLE public.id_card_orders ALTER COLUMN order_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.razorpay_orders ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.razorpay_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS tax NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.razorpay_payments ADD COLUMN IF NOT EXISTS verified_via TEXT DEFAULT 'server_hmac';

ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.razorpay_webhooks ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE public.id_card_orders ADD COLUMN IF NOT EXISTS registration_id TEXT;
ALTER TABLE public.id_card_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------------------
-- STEP 3: TARGETED RLS HARDENING & LEAST-PRIVILEGE GRANTS
-- Drops ONLY known unsafe/legacy policies and target policy names (no wildcard drop).
-- ------------------------------------------------------------------------------
ALTER TABLE public.razorpay_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.razorpay_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_card_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Drop only known permissive/legacy policies & our target policy names for idempotency
DROP POLICY IF EXISTS "Allow service role all razorpay_orders" ON public.razorpay_orders;
DROP POLICY IF EXISTS "Service role only razorpay_orders" ON public.razorpay_orders;

DROP POLICY IF EXISTS "Allow service role all razorpay_payments" ON public.razorpay_payments;
DROP POLICY IF EXISTS "Service role only razorpay_payments" ON public.razorpay_payments;

DROP POLICY IF EXISTS "Allow service role all razorpay_webhooks" ON public.razorpay_webhooks;
DROP POLICY IF EXISTS "Service role only razorpay_webhooks" ON public.razorpay_webhooks;

DROP POLICY IF EXISTS "Allow service role all id_card_orders" ON public.id_card_orders;
DROP POLICY IF EXISTS "Service role only id_card_orders" ON public.id_card_orders;
DROP POLICY IF EXISTS "Authenticated admins read id_card_orders" ON public.id_card_orders;
DROP POLICY IF EXISTS "Authenticated admins update id_card_orders" ON public.id_card_orders;

DROP POLICY IF EXISTS "Allow public access donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public select donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public insert donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public update donations" ON public.donations;
DROP POLICY IF EXISTS "Allow public delete donations" ON public.donations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.donations;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.donations;
DROP POLICY IF EXISTS "Service role full access donations" ON public.donations;
DROP POLICY IF EXISTS "Authenticated admins manage donations" ON public.donations;

-- 3A. Internal Razorpay Ledger Tables (service_role only; ZERO anon/authenticated access)
REVOKE ALL ON public.razorpay_orders FROM anon, authenticated;
REVOKE ALL ON public.razorpay_payments FROM anon, authenticated;
REVOKE ALL ON public.razorpay_webhooks FROM anon, authenticated;

GRANT ALL ON public.razorpay_orders TO service_role;
GRANT ALL ON public.razorpay_payments TO service_role;
GRANT ALL ON public.razorpay_webhooks TO service_role;

CREATE POLICY "Service role only razorpay_orders"
  ON public.razorpay_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only razorpay_payments"
  ON public.razorpay_payments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only razorpay_webhooks"
  ON public.razorpay_webhooks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3B. public.id_card_orders (Exact Parity: Admin has SELECT + UPDATE GRANT and matching RLS)
-- Paid orders are created strictly by backend Edge Functions via service_role.
REVOKE ALL ON public.id_card_orders FROM anon, authenticated;
GRANT ALL ON public.id_card_orders TO service_role;
GRANT SELECT, UPDATE ON public.id_card_orders TO authenticated;

CREATE POLICY "Service role only id_card_orders"
  ON public.id_card_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated admins read id_card_orders"
  ON public.id_card_orders FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Authenticated admins update id_card_orders"
  ON public.id_card_orders FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 3C. public.donations (NO anon access; service_role full; Admin CRUD strictly via app_metadata.role = 'admin')
REVOKE ALL ON public.donations FROM anon, authenticated;
GRANT ALL ON public.donations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;

CREATE POLICY "Service role full access donations"
  ON public.donations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated admins manage donations"
  ON public.donations FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ------------------------------------------------------------------------------
-- STEP 4: PRIVACY-HARDENED PUBLIC RECEIPT LOOKUP RPC
-- Compatibility Note: Keeps existing return columns & exact Postgres types with explicit
-- casts so the live website requires NO rebuild, while:
--   1. Disallowing lookup by mobile number alone (requires Receipt No or Payment/Txn ID).
--   2. Masking mobile, payment ID, and transaction ID, and hiding order ID, email, address, PAN.
--   3. Returning ONLY Approved donations.
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
  -- Require at least 8 characters and NEVER allow mobile-only public enumeration
  IF LENGTH(clean_q) < 8 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.id::TEXT,
    d.receipt_number::TEXT,
    d.donor_name::TEXT,
    CASE
      WHEN LENGTH(REGEXP_REPLACE(COALESCE(d.mobile, ''), '\D', '', 'g')) >= 4
        THEN ('XXXXXX' || RIGHT(REGEXP_REPLACE(d.mobile, '\D', '', 'g'), 4))::TEXT
      ELSE NULL::TEXT
    END AS mobile,
    d.amount::NUMERIC,
    d.payment_mode::TEXT,
    CASE
      WHEN COALESCE(d.transaction_id, '') <> '' AND LENGTH(d.transaction_id) > 8
        THEN (LEFT(d.transaction_id, 6) || '****' || RIGHT(d.transaction_id, 4))::TEXT
      WHEN COALESCE(d.transaction_id, '') <> ''
        THEN '****'::TEXT
      ELSE NULL::TEXT
    END AS transaction_id,
    d.purpose::TEXT,
    COALESCE(d.is_verified, FALSE)::BOOLEAN AS is_verified,
    d.status::TEXT,
    d.donated_at::TIMESTAMPTZ,
    d.approved_at::TIMESTAMPTZ,
    NULL::TEXT AS razorpay_order_id,
    CASE
      WHEN COALESCE(d.razorpay_payment_id, '') <> '' AND LENGTH(d.razorpay_payment_id) > 8
        THEN (LEFT(d.razorpay_payment_id, 8) || '****' || RIGHT(d.razorpay_payment_id, 4))::TEXT
      WHEN COALESCE(d.razorpay_payment_id, '') <> ''
        THEN '****'::TEXT
      ELSE NULL::TEXT
    END AS razorpay_payment_id,
    d.payment_gateway::TEXT
  FROM public.donations d
  WHERE d.status = 'Approved'
    AND (
      UPPER(d.receipt_number) = UPPER(clean_q)
      OR d.razorpay_payment_id = clean_q
      OR d.transaction_id = clean_q
    )
  ORDER BY d.donated_at DESC
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_approved_donation_receipt(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_approved_donation_receipt(TEXT) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.generate_unique_receipt_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_unique_receipt_number() TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.donation_receipt_seq TO service_role;
