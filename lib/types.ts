export interface Session {
  id: string
  name: string
  owner: string
  created_at: string
  characters: any[]
  maps: any[]
  dice_history: any[]
  gm_id?: string
}

export interface SessionRole {
  role: 'commander' | 'marshal' | 'quartermaster' | 'lorekeeper' | 'spymaster'
  player_id?: string
  player_name?: string
}

export type SessionMemberKind = 'gm' | 'player'

export interface SessionMember {
  id: string
  session_id: string
  display_name: string
  kind: SessionMemberKind
  auth_user_id?: string | null
  created_at?: string
  updated_at?: string
  // backward compatibility for legacy session_members shape
  player_name?: string
  role?: string
}

export interface SessionItem {
  id: string
  name: string
  owner: string
  created_at: string
}

export type DiceRollType = 'action' | 'resistance' | 'fortune'
export type Position = 'controlled' | 'risky' | 'desperate'
export type Effect = 'zero' | 'limited' | 'standard' | 'great' | 'extreme'
export type ResistanceAttribute = 'insight' | 'prowess' | 'resolve'

export type RollActor = {
  member_id: string
  name: string
  role?: string
}

export interface BaseRollContent {
  roll_type: string
  dice_pool: number
  results: number[]
  actor: RollActor
  note?: string
}

export interface ActionRollContent extends BaseRollContent {
  roll_type: 'action'
  action?: string | null
  position: 'controlled' | 'risky' | 'desperate'
  effect: Effect
}

export interface ResistanceRollContent extends BaseRollContent {
  roll_type: 'resistance'
  attribute: ResistanceAttribute
}

export interface FortuneRollContent extends BaseRollContent {
  roll_type: 'fortune'
  context?: string
}

export interface EngagementRollContent extends BaseRollContent {
  roll_type: 'engagement'
  mission_id?: string
}

export interface CampaignRollContent extends BaseRollContent {
  roll_type: 'campaign'
  campaign_roll_type: string
}

export type RollContent =
  | ActionRollContent
  | ResistanceRollContent
  | FortuneRollContent
  | EngagementRollContent
  | CampaignRollContent

export interface ChatFeedEntry {
  id: string
  session_id: string
  type: 'roll' | 'dice' | 'message' | 'system'
  content: RollContent | ChatMessage | Record<string, any>
  created_at: string
}

export interface ChatMessage {
  id: string
  player_name: string
  player_role?: string
  text: string
  timestamp: string
}

export type CampaignRoleType =
  | 'commander'
  | 'marshal'
  | 'quartermaster'
  | 'lorekeeper'
  | 'spymaster'

export type CampaignRole = {
  id: string
  session_id: string
  role_type: CampaignRoleType
  primary_member_id: string | null
  acting_member_id: string | null
  data: Record<string, unknown>
  created_at: string
  updated_at: string
  // legacy compatibility
  assigned_member_id?: string | null
}

export function getEffectiveRoleMemberId(role: CampaignRole) {
  return role.acting_member_id ?? role.primary_member_id
}

export type CharacterType = 'rookie' | 'soldier' | 'specialist'

export type CharacterStatus =
  | 'available'
  | 'wounded'
  | 'dead'
  | 'lost'
  | 'retired'
  | 'archived'

export type CharacterData = {
  stress?: number
  trauma?: string[]
  harm?: Array<{
    level: 1 | 2 | 3 | 4
    label: string
  }>
  actions?: Record<string, number>
  xp?: {
    playbook?: number
    insight?: number
    prowess?: number
    resolve?: number
  }
  abilities?: string[]
  items?: string[]
  notes?: string
  custom?: Record<string, unknown>
}

export type Character = {
  id: string
  session_id: string
  name: string
  character_type: CharacterType
  playbook: string
  status: CharacterStatus
  squad_key: string | null
  assigned_member_id: string | null
  data: CharacterData
  created_at: string
  updated_at: string
}