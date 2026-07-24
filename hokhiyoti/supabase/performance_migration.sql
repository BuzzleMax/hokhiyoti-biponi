-- Performance Indexing Migration (Safety-First)
-- This migration only adds indexes, views, and functions to optimize query lookups,
-- pagination, and cursor performance. It does NOT recreate tables or remove data.

-- ─────────────────────────────────────────────────────────────────────────────
-- PRODUCTS — cursor-based pagination indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_active_archived_created ON products (active, archived, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products (featured, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products (new_arrival, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_best_seller ON products (best_seller, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_slug, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products (collection_slug, active, archived, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_products_cursor ON products (created_at DESC, id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDERS — cursor-based pagination indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders (order_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_commission_status ON orders (commission_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_cursor ON orders (created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_orders_followup ON orders (order_status, created_at) WHERE order_status = 'lead_created';
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SELLER PAYOUTS — cursor-based pagination indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_seller_payouts_order ON seller_payouts (order_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_payment ON seller_payouts (payment_status, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_cursor ON seller_payouts (created_at DESC, id);

-- ─────────────────────────────────────────────────────────────────────────────
-- REVIEWS — cursor-based pagination indexes (product_reviews table + reviews view)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_created ON product_reviews (product_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_cursor ON product_reviews (created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews (is_approved, created_at DESC, id);

-- Backward-compatible view alias (if not already present)
CREATE OR REPLACE VIEW reviews AS SELECT * FROM product_reviews;
CREATE INDEX IF NOT EXISTS idx_reviews_product_created ON product_reviews (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_cursor ON product_reviews (created_at DESC, id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ORDER TIMELINE — cursor-based pagination indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline (order_id, created_at DESC, id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_cursor ON order_timeline (created_at DESC, id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CUSTOMERS — derived view for cursor-paginated customer listing
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW customer_profiles AS
SELECT
  COALESCE(
    NULLIF(TRIM(customer_phone), ''),
    NULLIF(TRIM(customer_email), ''),
    id::text
  ) AS customer_key,
  MAX(customer_name) AS customer_name,
  MAX(NULLIF(TRIM(customer_phone), '')) AS customer_phone,
  MAX(NULLIF(TRIM(customer_email), '')) AS customer_email,
  COUNT(*)::integer AS order_count,
  MAX(created_at) AS last_order_at,
  COALESCE(SUM(product_price), 0)::numeric AS total_spent
FROM orders
WHERE order_status IS DISTINCT FROM 'archived'
GROUP BY customer_key;

CREATE INDEX IF NOT EXISTS idx_orders_customer_key_created ON orders (
  COALESCE(NULLIF(TRIM(customer_phone), ''), NULLIF(TRIM(customer_email), ''), id::text),
  created_at DESC
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AGGREGATE FUNCTIONS — avoid full-table scans in application code
-- ─────────────────────────────────────────────────────────────────────────────

-- Payout summary (seller payouts panel)
CREATE OR REPLACE FUNCTION get_payout_summary()
RETURNS TABLE (
  pending_amount numeric,
  total_seller_earnings numeric,
  total_commission numeric,
  paid_amount numeric,
  processing_amount numeric,
  pending_commission numeric,
  earned_commission numeric,
  cancelled_commission numeric,
  rejected_commission numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status <> 'none'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status <> 'none'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'paid'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status <> 'none' AND payment_status = 'processing'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status IN ('earned', 'paid')), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'cancelled'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'rejected'), 0)
  FROM orders
  WHERE order_status IS DISTINCT FROM 'archived'
    AND commission_status <> 'none';
$$;

-- Order status counts (analytics dashboard)
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS TABLE (
  leads_created bigint,
  customer_contacted bigint,
  confirmed_orders bigint,
  packed_orders bigint,
  shipped_orders bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  rejected_orders bigint,
  total_orders bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE order_status IN ('lead_created', 'pending')),
    COUNT(*) FILTER (WHERE order_status = 'customer_contacted'),
    COUNT(*) FILTER (WHERE order_status IN ('confirmed', 'processing')),
    COUNT(*) FILTER (WHERE order_status = 'packed'),
    COUNT(*) FILTER (WHERE order_status = 'shipped'),
    COUNT(*) FILTER (WHERE order_status = 'delivered'),
    COUNT(*) FILTER (WHERE order_status = 'cancelled'),
    COUNT(*) FILTER (WHERE order_status = 'rejected'),
    COUNT(*) FILTER (WHERE order_status IS DISTINCT FROM 'archived')
  FROM orders;
$$;

-- Revenue aggregates (analytics dashboard)
CREATE OR REPLACE FUNCTION get_revenue_aggregates()
RETURNS TABLE (
  today_revenue numeric,
  monthly_revenue numeric,
  total_revenue numeric,
  today_orders bigint,
  monthly_orders bigint,
  total_orders bigint,
  average_order_value numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH delivered AS (
    SELECT created_at, product_price
    FROM orders
    WHERE order_status = 'delivered'
  )
  SELECT
    COALESCE(SUM(product_price) FILTER (
      WHERE created_at >= date_trunc('day', now())
    ), 0),
    COALESCE(SUM(product_price) FILTER (
      WHERE created_at >= date_trunc('month', now())
    ), 0),
    COALESCE(SUM(product_price), 0),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())),
    (SELECT COUNT(*) FROM orders WHERE order_status IS DISTINCT FROM 'archived'),
    CASE WHEN COUNT(*) > 0 THEN ROUND(COALESCE(SUM(product_price), 0) / COUNT(*), 0) ELSE 0 END
  FROM delivered;
$$;

-- Commission aggregates (analytics dashboard)
CREATE OR REPLACE FUNCTION get_commission_aggregates()
RETURNS TABLE (
  today_commission numeric,
  monthly_commission numeric,
  total_commission numeric,
  pending_commission numeric,
  earned_commission numeric,
  cancelled_commission numeric,
  rejected_commission numeric,
  paid_commission numeric,
  seller_earnings numeric,
  pending_payouts numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
        AND created_at >= date_trunc('day', now())
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
        AND created_at >= date_trunc('month', now())
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (
      WHERE commission_status IN ('pending', 'earned', 'paid')
    ), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'pending'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status IN ('earned', 'paid')), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'cancelled'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'rejected'), 0),
    COALESCE(SUM(commission_amount) FILTER (WHERE commission_status = 'paid'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE order_status = 'delivered'), 0),
    COALESCE(SUM(seller_earnings) FILTER (WHERE commission_status = 'pending'), 0)
  FROM orders
  WHERE order_status IS DISTINCT FROM 'archived';
$$;

-- Monthly revenue + commission graph (last N months)
CREATE OR REPLACE FUNCTION get_monthly_graph(month_count integer DEFAULT 6)
RETURNS TABLE (
  month_label text,
  revenue numeric,
  commission numeric
)
LANGUAGE sql
STABLE
AS $$
  WITH months AS (
    SELECT
      generate_series(
        date_trunc('month', now()) - ((month_count - 1) || ' months')::interval,
        date_trunc('month', now()),
        '1 month'::interval
      ) AS month_start
  )
  SELECT
    to_char(m.month_start, 'Mon'),
    COALESCE(SUM(o.product_price) FILTER (WHERE o.order_status = 'delivered'), 0),
    COALESCE(SUM(o.commission_amount) FILTER (
      WHERE o.commission_status IN ('pending', 'earned', 'paid')
    ), 0)
  FROM months m
  LEFT JOIN orders o
    ON o.created_at >= m.month_start
   AND o.created_at < m.month_start + interval '1 month'
   AND o.order_status IS DISTINCT FROM 'archived'
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;
