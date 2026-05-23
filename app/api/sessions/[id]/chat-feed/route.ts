import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import type { ChatFeedEntry } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await request.json()

    const feedEntry: ChatFeedEntry = {
      id: entry.id || Date.now().toString(),
      session_id: id,
      type: entry.type || 'message',
      content: entry.content,
      created_at: new Date().toISOString(),
    }

    // Insert into chat_feed table
    const { data, error } = await supabaseServer
      .from('chat_feed')
      .insert([feedEntry])
      .select()

    if (error) {
      console.error('Failed to insert chat feed entry:', error)
      throw error
    }

    return NextResponse.json({ success: true, entry: data?.[0] })
  } catch (error) {
    console.error('Failed to save chat feed entry:', error)
    return NextResponse.json(
      { error: 'Failed to save chat feed entry' },
      { status: 500 }
    )
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
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch chat feed:', error)
      throw error
    }

    return NextResponse.json(entries || [])
  } catch (error) {
    console.error('Failed to fetch chat feed entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat feed entries' },
      { status: 500 }
    )
  }
}
