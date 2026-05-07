import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { name, owner } = await request.json()

    if (!name || !owner) {
      return NextResponse.json({ error: 'Name and owner are required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('sessions')
      .insert([{ name, owner }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('sessions')
      .select('*')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}