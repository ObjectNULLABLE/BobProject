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

export interface SessionMember {
  id: string
  session_id: string
  role: 'commander' | 'marshal' | 'quartermaster' | 'lorekeeper' | 'spymaster'
  player_name: string
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