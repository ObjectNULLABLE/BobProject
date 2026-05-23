import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

const VALID_ROLES = ['commander', 'marshal', 'quartermaster', 'lorekeeper', 'spymaster']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabaseServer
      .from('campaign_roles')
      .select('*')
      .eq('session_id', id)

    if (error) throw error

    const mapped = (data || []).map((row: any) => ({
      ...row,
      primary_member_id: row.primary_member_id ?? row.assigned_member_id ?? null,
      acting_member_id: row.acting_member_id ?? null,
      assigned_member_id: row.assigned_member_id ?? row.primary_member_id ?? null,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Failed to fetch campaign roles:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign roles' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { role_type, primary_member_id = null, acting_member_id = null, assigned_member_id = null, data = {} } = body
    const primaryId = primary_member_id ?? assigned_member_id

    if (!role_type || !VALID_ROLES.includes(role_type)) {
      return NextResponse.json({ error: 'Invalid role_type' }, { status: 400 })
    }

    // Check if role exists
    const { data: existing, error: existingError } = await supabaseServer
      .from('campaign_roles')
      .select('*')
      .eq('session_id', id)
      .eq('role_type', role_type)
      .maybeSingle()

    if (existing) {
      const { data: updated, error: updateError } = await supabaseServer
        .from('campaign_roles')
        .update({ assigned_member_id: primaryId, data, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      return NextResponse.json(updated)
    }

    // Insert new role
    const { data: inserted, error: insertError } = await supabaseServer
      .from('campaign_roles')
      .insert([
        {
          session_id: id,
          role_type,
          assigned_member_id: primaryId,
          data,
        },
      ])
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(inserted)
  } catch (error) {
    console.error('Failed to upsert campaign role:', error)
    return NextResponse.json({ error: 'Failed to upsert campaign role' }, { status: 500 })
  }
}
