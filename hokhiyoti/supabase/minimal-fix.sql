-- Minimal fix: Just add what's missing without touching existing policies
-- This should work regardless of what policies already exist

-- Add a policy specifically for authenticated users to read orders
-- This won't conflict with existing public read policy
CREATE POLICY IF NOT EXISTS "Authenticated read orders" ON orders
  FOR SELECT TO authenticated USING (true);

-- Add a policy for authenticated users to update orders
CREATE POLICY IF NOT EXISTS "Authenticated update orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Add a policy for authenticated users to delete orders
CREATE POLICY IF NOT EXISTS "Authenticated delete orders" ON orders
  FOR DELETE TO authenticated USING (true);

-- Add a policy for public to insert orders (in case it's missing)
CREATE POLICY IF NOT EXISTS "Public insert orders" ON orders
  FOR INSERT TO public WITH CHECK (true);
