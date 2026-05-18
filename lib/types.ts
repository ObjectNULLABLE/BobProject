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
export type Effect = 'limited' | 'standard' | 'great'
export type ResistanceAttribute = 'insight' | 'prowess' | 'resolve'

export interface BobDiceRoll {
  id: string
  player_name: string
  player_role?: string
  type: DiceRollType
  dice_count: number
  results: number[]
  total: number
  timestamp: string
  // Action roll specific
  position?: Position
  effect?: Effect
  highest_die?: number
  outcome?: 'failure' | 'partial' | 'success' | 'critical'
  // Resistance roll specific
  resistance_attribute?: ResistanceAttribute
  stress_taken?: number
  // Outcome description
  description?: string
}

export interface ChatFeedEntry {
  id: string
  session_id: string
  type: 'dice' | 'message'
  content: BobDiceRoll | ChatMessage
  created_at: string
}

export interface ChatMessage {
  id: string
  player_name: string
  player_role?: string
  text: string
  timestamp: string
}