-- Make preview_path nullable for desktop app uploads that don't have previews
ALTER TABLE public.dump_packs ALTER COLUMN preview_path DROP NOT NULL;