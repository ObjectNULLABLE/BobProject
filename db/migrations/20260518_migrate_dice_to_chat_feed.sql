-- Migration: move dice_history JSON arrays into chat_feed table
-- Idempotent: safe to run multiple times

BEGIN;

-- Create chat_feed table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_feed (
  id text PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert each dice_history element as a chat_feed row (avoid duplicates)
INSERT INTO public.chat_feed (id, session_id, type, content, created_at)
SELECT
  coalesce(elem->> 'id', md5(s.id::text || index::text)) AS id,
  s.id AS session_id,
  'dice' AS type,
  elem AS content,
  coalesce((elem->> 'timestamp')::timestamptz, now()) AS created_at
FROM public.sessions s,
  jsonb_array_elements(coalesce(s.dice_history, '[]'::jsonb)) WITH ORDINALITY AS arr(elem, index)
WHERE jsonb_array_length(coalesce(s.dice_history, '[]'::jsonb)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_feed cf WHERE cf.id = coalesce(elem->> 'id', md5(s.id || index::text))
  );

-- Optional: clear dice_history arrays after successful migration
-- Uncomment the following line if you want to remove the old arrays
-- UPDATE public.sessions SET dice_history = '[]'::jsonb WHERE jsonb_array_length(coalesce(dice_history, '[]'::jsonb)) > 0;

COMMIT;
