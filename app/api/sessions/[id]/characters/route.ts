import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

const VALID_TYPES = ['rookie', 'soldier', 'specialist']
const VALID_STATUS = ['available', 'wounded', 'dead', 'lost', 'retired', 'archived']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabaseServer
      .from('characters')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Failed to fetch characters:', error)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await request.json()
    const {
      name,
      character_type,
      playbook,
      status = 'available',
      squad_key = null,
      assigned_member_id = null,
      data = {},
    } = payload

    if (!name || !character_type || !playbook) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!VALID_TYPES.includes(character_type)) {
      return NextResponse.json({ error: 'Invalid character_type' }, { status: 400 })
    }

    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (character_type === 'specialist' && squad_key) {
      // enforce specialist has no squad
      return NextResponse.json({ error: 'Specialist cannot have a squad_key' }, { status: 400 })
    }

    const { data: inserted, error } = await supabaseServer
      .from('characters')
      .insert([
        {
          session_id: id,
          name,
          character_type,
          playbook,
          status,
          squad_key,
          assigned_member_id,
          data,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(inserted)
  } catch (error) {
    console.error('Failed to create character:', error)
    return NextResponse.json({ error: 'Failed to create character' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await request.json()
    const { id: charId, patch } = payload
    if (!charId || !patch) {
      return NextResponse.json({ error: 'Missing id or patch' }, { status: 400 })
    }

    // If changing to specialist, clear squad_key
    if (patch.character_type === 'specialist') {
      patch.squad_key = null
    }

    if (patch.character_type && !VALID_TYPES.includes(patch.character_type)) {
      return NextResponse.json({ error: 'Invalid character_type' }, { status: 400 })
    }

    if (patch.status && !VALID_STATUS.includes(patch.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: updated, error } = await supabaseServer
      .from('characters')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', charId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update character:', error)
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id: charId, hard = false } = body
    if (!charId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    if (hard) {
      const { error } = await supabaseServer.from('characters').delete().eq('id', charId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    const { data: archived, error } = await supabaseServer
      .from('characters')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', charId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(archived)
  } catch (error) {
    console.error('Failed to delete/archive character:', error)
    return NextResponse.json({ error: 'Failed to delete/archive character' }, { status: 500 })
  }
}
