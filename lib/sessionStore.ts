import { create } from 'zustand'
import type { Session, SessionRole } from './types'

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