import { supabase } from './supabase'

export const LEGION_ROLES = [
  'commander',
  'marshal',
  'quartermaster',
  'lorekeeper',
  'spymaster',
] as const

export type LegionRole = typeof LEGION_ROLES[number]

export async function signUpGM(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        is_gm: true,
      },
    },
  })
  return { data, error }
}

export async function signInGM(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  return await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  return { user: data?.user, error }
}
