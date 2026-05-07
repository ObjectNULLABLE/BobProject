'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSessionStore } from '../../../lib/sessionStore'
import RoleSelectionModal from '@/components/RoleSelectionModal'
import type { LegionRole } from '@/lib/auth'

interface Session {
  id: string
  name: string
  owner: string
  created_at: string
  characters: any[]
  maps: any[]
  dice_history: any[]
}

export default function SessionPage() {
  const params = useParams()
  const { currentSession, setSession } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionMembers, setSessionMembers] = useState<any[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [playerRole, setPlayerRole] = useState<LegionRole | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${params.id}`)
        if (!response.ok) {
          throw new Error('Session not found')
        }
        const session: Session = await response.json()
        setSession(session)

        // Fetch session members
        const membersResponse = await fetch(`/api/sessions/${params.id}/members`)
        if (membersResponse.ok) {
          const members = await membersResponse.json()
          setSessionMembers(members)
        }

        // Check for saved role in local storage
        const savedRole = localStorage.getItem(`session_${params.id}_role`)
        const savedName = localStorage.getItem(`session_${params.id}_player_name`)
        if (savedRole && savedName) {
          setPlayerRole(savedRole as LegionRole)
          setPlayerName(savedName)
        } else {
          // Show role selection modal for players
          setShowRoleModal(true)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSession()
    }
  }, [params.id, setSession])

  if (loading) {
    return <div className="container mx-auto p-4">Loading session...</div>
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>
  }

  if (!currentSession) {
    return <div className="container mx-auto p-4">Session not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">{currentSession.name}</h1>
          {playerRole && playerName && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 inline-block">
              <p className="text-sm text-indigo-800">
                You are playing as: <span className="font-semibold capitalize">{playerRole}</span> ({playerName})
              </p>
            </div>
          )}
        </div>
        {playerRole && (
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Change Role
          </button>
        )}
      </div>

      <div className="space-y-2 mb-8">
        <p>
          <span className="font-medium">Session ID:</span> {currentSession.id}
        </p>
        <p>
          <span className="font-medium">Owner:</span> {currentSession.owner}
        </p>
        <p>
          <span className="font-medium">Created:</span> {new Date(currentSession.created_at).toLocaleString()}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Legion Members</h2>
        <div className="space-y-2">
          {sessionMembers.length > 0 ? (
            sessionMembers.map((member) => (
              <div key={member.id} className="p-3 bg-gray-50 rounded-md">
                <p className="capitalize">
                  <span className="font-medium">{member.role}:</span> {member.player_name}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No members joined yet</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Characters</h2>
        <p>{currentSession.characters.length} characters</p>
        {/* TODO: Display characters */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Maps</h2>
        <p>{currentSession.maps.length} maps</p>
        {/* TODO: Display maps */}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dice History</h2>
        <p>{currentSession.dice_history.length} rolls</p>
        {/* TODO: Display dice history */}
      </div>

      {showRoleModal && (
        <RoleSelectionModal
          sessionId={currentSession.id}
          takenRoles={sessionMembers.map((m) => m.role)}
          onRoleSelected={(role, name) => {
            setPlayerRole(role)
            setPlayerName(name)
            setShowRoleModal(false)
            // Refresh members list
            fetch(`/api/sessions/${currentSession.id}/members`)
              .then((r) => r.json())
              .then(setSessionMembers)
          }}
          onClose={() => setShowRoleModal(false)}
        />
      )}
    </div>
  )
}