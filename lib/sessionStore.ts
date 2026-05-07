import { create } from 'zustand'

interface Session {
  id: string
  name: string
  owner: string
  created_at: string
  characters: any[]
  maps: any[]
  dice_history: any[]
  gm_id?: string
}

interface SessionRole {
  role: 'commander' | 'marshal' | 'quartermaster' | 'lorekeeper' | 'spymaster'
  player_id?: string
  player_name?: string
}

interface SessionStore {
  currentSession: Session | null
  setSession: (session: Session) => void
  clearSession: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentSession: null,
  setSession: (session) => set({ currentSession: session }),
  clearSession: () => set({ currentSession: null }),
}))