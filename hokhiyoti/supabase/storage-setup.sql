-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Allow public read access on product-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow public upload access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public upload access on product-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'product-images');

-- Allow public update access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public update access on product-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'product-images');

-- Allow public delete access to the bucket (for admin dashboard - no auth)
CREATE POLICY "Allow public delete access on product-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'product-images');
