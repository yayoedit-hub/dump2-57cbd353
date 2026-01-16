-- Allow creators to delete their own dump packs
CREATE POLICY "Creators can delete their own packs"
ON public.dump_packs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM creators
    WHERE creators.id = dump_packs.creator_id
    AND creators.user_id = auth.uid()
  )
);