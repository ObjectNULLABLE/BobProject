import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const rollData = await request.json()

    // Get current session
    const { data: session, error: sessionError } = await supabaseServer
      .from('sessions')
      .select('dice_history')
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Add new roll to dice history
    const currentHistory = session.dice_history || []
    const updatedHistory = [...currentHistory, rollData]

    // Update session with new dice history
    const { error: updateError } = await supabaseServer
      .from('sessions')
      .update({ dice_history: updatedHistory })
      .eq('id', id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, roll: rollData })
  } catch (error) {
    console.error('Failed to save dice roll:', error)
    return NextResponse.json({ error: 'Failed to save dice roll' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: session, error } = await supabaseServer
      .from('sessions')
      .select('dice_history')
      .eq('id', id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session.dice_history || [])
  } catch (error) {
    console.error('Failed to fetch dice history:', error)
    return NextResponse.json({ error: 'Failed to fetch dice history' }, { status: 500 })
  }
}