-- Migration: add campaign_roles and characters tables with indexes
-- Idempotent: safe to run multiple times

BEGIN;

-- Ensure gen_random_uuid is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Campaign roles table
CREATE TABLE IF NOT EXISTS public.campaign_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  role_type text NOT NULL,
  primary_member_id uuid NULL REFERENCES public.session_members(id) ON DELETE SET NULL,
  acting_member_id uuid NULL REFERENCES public.session_members(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT campaign_roles_role_type_check CHECK (
    role_type IN ('commander', 'marshal', 'quartermaster', 'lorekeeper', 'spymaster')
  ),

  CONSTRAINT campaign_roles_unique_role_per_session UNIQUE (session_id, role_type)
);

-- Campaign roles indexes
CREATE INDEX IF NOT EXISTS campaign_roles_session_id_idx ON public.campaign_roles (session_id);
CREATE INDEX IF NOT EXISTS campaign_roles_primary_member_id_idx ON public.campaign_roles (primary_member_id);
CREATE INDEX IF NOT EXISTS campaign_roles_acting_member_id_idx ON public.campaign_roles (acting_member_id);

-- Characters table
CREATE TABLE IF NOT EXISTS public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  character_type text NOT NULL,
  playbook text NOT NULL,
  status text NOT NULL DEFAULT 'available',
  squad_key text NULL,
  assigned_member_id uuid NULL REFERENCES public.session_members(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT characters_character_type_check CHECK (
    character_type IN ('rookie', 'soldier', 'specialist')
  ),

  CONSTRAINT characters_status_check CHECK (
    status IN ('available', 'wounded', 'dead', 'lost', 'retired', 'archived')
  ),

  CONSTRAINT specialists_cannot_have_squad CHECK (
    character_type != 'specialist' OR squad_key IS NULL
  )
);

-- Characters indexes
CREATE INDEX IF NOT EXISTS characters_session_id_idx ON public.characters (session_id);
CREATE INDEX IF NOT EXISTS characters_session_status_idx ON public.characters (session_id, status);
CREATE INDEX IF NOT EXISTS characters_session_squad_key_idx ON public.characters (session_id, squad_key);
CREATE INDEX IF NOT EXISTS characters_assigned_member_id_idx ON public.characters (assigned_member_id);

COMMIT;
