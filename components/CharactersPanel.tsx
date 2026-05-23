"use client"

import { useEffect, useState } from 'react'
import { SQUADS } from '@/lib/constants'
import type { Character, SessionMember } from '@/lib/types'

type Props = {
  sessionId: string
  members: SessionMember[]
  initialCharacters?: Character[]
}

export default function CharactersPanel({ sessionId, members }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({
    name: '',
    character_type: 'rookie',
    playbook: '',
    status: 'available',
    squad_key: '',
    assigned_member_id: '',
    data: { stress: 0, notes: '' },
  })

  const fetchChars = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/characters`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setCharacters(data)
      } else {
        console.error('Unexpected characters response:', data)
        setCharacters([])
      }
    } catch (err) {
      console.error('Failed to fetch characters:', err)
      setCharacters([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchChars()
  }, [sessionId])

  const handleCreate = async (e: any) => {
    e.preventDefault()
    const payload = { ...form, squad_key: form.squad_key || null, assigned_member_id: form.assigned_member_id || null }
    await fetch(`/api/sessions/${sessionId}/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setForm({ name: '', character_type: 'rookie', playbook: '', status: 'available', squad_key: '', assigned_member_id: '', data: { stress: 0, notes: '' } })
    setShowForm(false)
    await fetchChars()
  }

  const handleArchive = async (id: string) => {
    await fetch(`/api/sessions/${sessionId}/characters`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchChars()
  }

  if (loading) return <div>Loading characters...</div>

  const specialists = characters.filter((c) => c.character_type === 'specialist')
  const others = characters.filter((c) => c.character_type !== 'specialist')
  const bySquad: Record<string, Character[]> = {}
  others.forEach((c) => {
    const key = c.squad_key || 'unassigned'
    bySquad[key] = bySquad[key] || []
    bySquad[key].push(c)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Characters ({characters.length})</h3>
        <button onClick={() => setShowForm((s) => !s)} className="px-3 py-1 border rounded text-sm">
          {showForm ? 'Close' : 'New Character'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-2 border rounded" />
            <input required placeholder="Playbook" value={form.playbook} onChange={(e) => setForm({ ...form, playbook: e.target.value })} className="p-2 border rounded" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={form.character_type} onChange={(e) => setForm({ ...form, character_type: e.target.value })} className="p-2 border rounded">
              <option value="rookie">Rookie</option>
              <option value="soldier">Soldier</option>
              <option value="specialist">Specialist</option>
            </select>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="p-2 border rounded">
              <option value="available">Available</option>
              <option value="wounded">Wounded</option>
              <option value="dead">Dead</option>
              <option value="lost">Lost</option>
              <option value="retired">Retired</option>
              <option value="archived">Archived</option>
            </select>
            {/* squad selection only for rookies/soldiers */}
            {form.character_type !== 'specialist' ? (
              <select value={form.squad_key} onChange={(e) => setForm({ ...form, squad_key: e.target.value })} className="p-2 border rounded">
                <option value="">-- Squad (optional) --</option>
                {SQUADS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <div />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select value={form.assigned_member_id} onChange={(e) => setForm({ ...form, assigned_member_id: e.target.value })} className="p-2 border rounded">
              <option value="">-- Assign to member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.player_name}
                </option>
              ))}
            </select>
            <input type="number" min={0} value={form.data?.stress || 0} onChange={(e) => setForm({ ...form, data: { ...(form.data || {}), stress: Number(e.target.value) } })} className="p-2 border rounded" />
          </div>

          <textarea placeholder="Notes" value={form.data?.notes || ''} onChange={(e) => setForm({ ...form, data: { ...(form.data || {}), notes: e.target.value } })} className="w-full p-2 border rounded" />

          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
              Create
            </button>
          </div>
        </form>
      )}

      <div>
        <h4 className="font-semibold">Specialists</h4>
        <div className="space-y-2 mt-2">
          {specialists.length === 0 && <div className="text-sm text-gray-500">No specialists</div>}
          {specialists.map((c) => (
            <div key={c.id} className="p-3 bg-gray-50 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.playbook} — {c.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-700">{c.assigned_member_id ? members.find(m=>m.id===c.assigned_member_id)?.player_name : ''}</div>
                <button onClick={() => handleArchive(c.id)} className="text-sm text-red-600">Archive</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold">Rookies & Soldiers</h4>
        <div className="space-y-3 mt-2">
          {Object.keys(bySquad).map((key) => (
            <div key={key} className="p-3 bg-white border rounded">
              <div className="font-medium">{key === 'unassigned' ? 'Unassigned' : (SQUADS.find(s=>s.key===key)?.name || key)}</div>
              <div className="mt-2 space-y-2">
                {bySquad[key].map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 border rounded">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-gray-600">{c.playbook} — {c.character_type} — {c.status}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-700">{c.assigned_member_id ? members.find(m=>m.id===c.assigned_member_id)?.display_name || members.find(m=>m.id===c.assigned_member_id)?.display_name || members.find(m=>m.id===c.assigned_member_id)?.player_name : ''}</div>
                      <button onClick={() => handleArchive(c.id)} className="text-sm text-red-600">Archive</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
