-- Create the app-downloads bucket with 100MB limit for desktop installers
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('app-downloads', 'app-downloads', true, 104857600);

-- Allow anyone to download the app files (public read access)
CREATE POLICY "Public can download app files"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-downloads');

-- Allow admins to upload/manage app files
CREATE POLICY "Admins can upload app files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'app-downloads' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Allow admins to update app files
CREATE POLICY "Admins can update app files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'app-downloads' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Allow admins to delete app files
CREATE POLICY "Admins can delete app files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'app-downloads' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);