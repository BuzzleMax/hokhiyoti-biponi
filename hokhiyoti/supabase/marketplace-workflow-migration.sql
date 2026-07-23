-- ============================================================================
-- HOKHIYOTI BIPONI — MARKETPLACE WORKFLOW MIGRATION
-- Safe additive migration. Does NOT drop any tables or columns.
-- Run in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. ADD commission_status TO orders
-- Values: 'none' | 'pending' | 'earned' | 'cancelled' | 'rejected' | 'paid'
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'none';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 2. ADD commission_type for future extensibility
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 3. ADD admin_note to orders (for status-change notes)
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- 4. CREATE order_timeline TABLE
-- Tracks every status change with timestamp, who changed it, and optional note.
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_timeline (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status       TEXT NOT NULL,
  changed_by   TEXT NOT NULL DEFAULT 'Admin',
  note         TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by order
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY on order_timeline
-- ============================================================================
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin)
DO $$ BEGIN
  CREATE POLICY "Allow all for authenticated" ON order_timeline
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow inserts for anonymous (order creation from product page)
DO $$ BEGIN
  CREATE POLICY "Allow anon insert" ON order_timeline
    FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow reads for anonymous (not strictly needed but safe)
DO $$ BEGIN
  CREATE POLICY "Allow anon read" ON order_timeline
    FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 6. MIGRATE EXISTING ORDERS
-- Map old statuses to new statuses and set commission_status accordingly.
-- Old:     pending   → lead_created  (commission: none)
-- Old:     confirmed → confirmed     (commission: pending)
-- Old:     processing→ confirmed     (commission: pending)
-- Old:     shipped   → shipped       (commission: pending)
-- Old:     delivered → delivered     (commission: earned)
-- Old:     cancelled → cancelled     (commission: cancelled)
-- ============================================================================

-- Set commission_status for existing orders based on order_status
UPDATE orders
SET commission_status = CASE
  WHEN order_status IN ('delivered') THEN 'earned'
  WHEN order_status IN ('confirmed', 'processing', 'shipped', 'packed') THEN 'pending'
  WHEN order_status IN ('cancelled', 'rejected') THEN 'cancelled'
  ELSE 'none'  -- pending, lead_created, customer_contacted, null
END
WHERE commission_status IS NULL OR commission_status = 'none';

-- Map old 'pending' status to 'lead_created' for semantic correctness
-- Only do this where commission_status = 'none' (true leads)
UPDATE orders
SET order_status = 'lead_created'
WHERE order_status = 'pending'
  AND commission_status = 'none';

-- Map old 'processing' to 'confirmed'
UPDATE orders
SET order_status = 'confirmed'
WHERE order_status = 'processing';

-- ============================================================================
-- 7. SEED order_timeline for existing orders (create initial timeline entry)
-- This gives existing orders at least one timeline row so the UI shows history.
-- ============================================================================
INSERT INTO order_timeline (order_id, status, changed_by, note, created_at)
SELECT
  id,
  COALESCE(order_status, 'lead_created'),
  'System Migration',
  'Order imported from previous system',
  COALESCE(created_at, NOW())
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_timeline);

-- ============================================================================
-- DONE
-- ============================================================================
