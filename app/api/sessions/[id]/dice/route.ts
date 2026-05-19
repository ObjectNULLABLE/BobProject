import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { normalizeRollContent } from '@/lib/rollHelpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rollData = await request.json()

    const feedEntry = {
      id: rollData.id || Date.now().toString(),
      session_id: id,
      type: 'roll',
      content: normalizeRollContent(rollData),
      created_at: rollData.timestamp || new Date().toISOString(),
    }

    // Insert into chat_feed table
    const { data, error } = await supabaseServer.from('chat_feed').insert([feedEntry]).select()

    if (error) {
      console.error('Failed to insert chat feed entry from dice API:', error)
      throw error
    }

    return NextResponse.json({ success: true, roll: data?.[0] || feedEntry })
  } catch (error) {
    console.error('Failed to save dice roll (chat_feed):', error)
    return NextResponse.json({ error: 'Failed to save dice roll' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: entries, error } = await supabaseServer
      .from('chat_feed')
      .select('*')
      .eq('session_id', id)
      .eq('type', 'dice')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch dice entries from chat_feed:', error)
      throw error
    }

    return NextResponse.json(entries || [])
  } catch (error) {
    console.error('Failed to fetch dice history from chat_feed:', error)
    return NextResponse.json({ error: 'Failed to fetch dice history' }, { status: 500 })
  }
}