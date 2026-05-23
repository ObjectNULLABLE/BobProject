import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabaseServer
      .from('session_members')
      .select('*')
      .eq('session_id', id)

    if (error) throw error

    const mapped = (data || []).map((row: any) => ({
      id: row.id,
      session_id: row.session_id,
      display_name: row.display_name || row.player_name || 'Player',
      kind: row.kind || 'player',
      auth_user_id: row.auth_user_id ?? row.user_id ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      player_name: row.player_name,
      role: row.role,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Failed to fetch session members:', error)
    return NextResponse.json({ error: 'Failed to fetch session members' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role, player_name, replace: replaceExisting } = await request.json()

    if (!role || !player_name) {
      return NextResponse.json({ error: 'Role and player name are required' }, { status: 400 })
    }

    // Check if role is already taken
    const { data: existing, error: existingError } = await supabaseServer
      .from('session_members')
      .select('*')
      .eq('session_id', id)
      .eq('role', role)
      .maybeSingle()

    if (existing) {
      if (!replaceExisting) {
        return NextResponse.json({ error: 'Role already taken' }, { status: 409 })
      }

      const { data, error } = await supabaseServer
        .from('session_members')
        .update({ player_name })
        .eq('session_id', id)
        .eq('role', role)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json(data)
    }

    // Create member entry
    const { data, error } = await supabaseServer
      .from('session_members')
      .insert([
        {
          session_id: id,
          role,
          player_name,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to create session member:', error)
    return NextResponse.json({ error: 'Failed to create session member' }, { status: 500 })
  }
}
