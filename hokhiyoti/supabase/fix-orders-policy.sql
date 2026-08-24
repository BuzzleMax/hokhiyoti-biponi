-- Fix orders table policies to ensure proper access
-- This ensures orders created via buy button show up in admin panel

-- First, disable RLS temporarily to remove all policies
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public can create orders (for buy button functionality)
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT TO public WITH CHECK (true);

-- Public can read orders (for basic order tracking)
CREATE POLICY "Public can read orders" ON orders
  FOR SELECT TO public USING (true);

-- Authenticated users can update orders
CREATE POLICY "Authenticated can update orders" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Authenticated users can delete orders  
CREATE POLICY "Authenticated can delete orders" ON orders
  FOR DELETE TO authenticated USING (true);
