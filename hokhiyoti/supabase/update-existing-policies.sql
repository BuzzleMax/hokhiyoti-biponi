-- Update existing policies instead of creating new ones
-- This should work since the policies already exist

-- Update the existing "Public can read orders" policy to be more permissive
-- Change it to allow authenticated users to read as well
DROP POLICY IF EXISTS "Public can read orders" ON orders;
CREATE POLICY "Public can read orders" ON orders
  FOR SELECT TO public USING (true);

-- If the above fails, try this approach - just make sure authenticated users can read
CREATE POLICY IF NOT EXISTS "Admin authenticated read" ON orders
  FOR SELECT TO authenticated USING (true);

-- Make sure authenticated users can update orders
CREATE POLICY IF NOT EXISTS "Admin authenticated update" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Make sure public can insert orders (for buy button)
CREATE POLICY IF NOT EXISTS "Public authenticated insert" ON orders
  FOR INSERT TO public WITH CHECK (true);
