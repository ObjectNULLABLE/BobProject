"use client"

import { useEffect, useState } from 'react'
import type { SessionMember } from '@/lib/types'

const ROLES = ['commander', 'marshal', 'quartermaster', 'lorekeeper', 'spymaster'] as const

type Props = {
  sessionId: string
  members: SessionMember[]
}

export default function CampaignRolesPanel({ sessionId, members }: Props) {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/campaign_roles`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setRoles(data)
      } else {
        // API returned an error object or unexpected payload
        console.error('Unexpected campaign_roles response:', data)
        setRoles([])
      }
    } catch (err) {
      console.error('Failed to fetch campaign roles:', err)
      setRoles([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRoles()
  }, [sessionId])

  const handleAssign = async (roleType: string, memberId: string | null) => {
    await fetch(`/api/sessions/${sessionId}/campaign_roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_type: roleType, assigned_member_id: memberId }),
    })
    await fetchRoles()
  }

  const getAssignedName = (roleType: string) => {
    const r = Array.isArray(roles) ? roles.find((x) => x.role_type === roleType) : undefined
    const memberId = r?.primary_member_id ?? r?.assigned_member_id ?? null
    if (!memberId) return null
    const m = members.find((mm) => mm.id === memberId)
    return m ? m.display_name ?? m.player_name : memberId
  }

  if (loading) return <div>Loading roles...</div>

  return (
    <div className="space-y-3">
      {ROLES.map((role) => (
        <div key={role} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div>
            <div className="font-medium capitalize">{role.replace('_', ' ')}</div>
            <div className="text-sm text-gray-600">{getAssignedName(role) || 'Unassigned'}</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={roles.find((r) => r.role_type === role)?.primary_member_id ?? roles.find((r) => r.role_type === role)?.assigned_member_id || ''}
              onChange={(e) => handleAssign(role, e.target.value || null)}
              className="border rounded p-1 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.player_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
