'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSessionStore } from '../../../lib/sessionStore'
import RoleSelectionModal from '@/components/RoleSelectionModal'
import DiceRoller from '@/components/DiceRoller'
import { getCurrentUser } from '@/lib/auth'
import type { LegionRole } from '@/lib/auth'
import type { Session } from '@/lib/types'

export default function SessionPage() {
  const params = useParams()
  const { currentSession, setSession } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionMembers, setSessionMembers] = useState<any[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [playerRole, setPlayerRole] = useState<LegionRole | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [isGM, setIsGM] = useState(false)
  const [diceHistory, setDiceHistory] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${params.id}`)
        if (!response.ok) {
          throw new Error('Session not found')
        }
        const session: Session = await response.json()
        setSession(session)

        // Check if current user is the GM
        const { user } = await getCurrentUser()
        setCurrentUser(user)
        const isUserGM = user && (
          session.owner === user.user_metadata?.name ||
          session.owner === user.email ||
          session.gm_id === user.id
        )
        setIsGM(!!isUserGM)

        // Fetch session members
        const membersResponse = await fetch(`/api/sessions/${params.id}/members`)
        if (membersResponse.ok) {
          const members = await membersResponse.json()
          setSessionMembers(members)
        }

        // Fetch dice history
        const diceResponse = await fetch(`/api/sessions/${params.id}/dice`)
        if (diceResponse.ok) {
          const dice = await diceResponse.json()
          setDiceHistory(dice)
        }

        // Check for saved role in local storage (only for non-GMs)
        if (!isUserGM) {
          const savedRole = localStorage.getItem(`session_${params.id}_role`)
          const savedName = localStorage.getItem(`session_${params.id}_player_name`)
          if (savedRole && savedName) {
            setPlayerRole(savedRole as LegionRole)
            setPlayerName(savedName)
          } else {
            // Show role selection modal for players
            setShowRoleModal(true)
          }
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

  const handleDiceRoll = (roll: any) => {
    setDiceHistory(prev => [...prev, roll])
  }

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
          {isGM ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 inline-block">
              <p className="text-sm text-green-800">
                You are the <span className="font-semibold">Game Master</span> of this session
              </p>
            </div>
          ) : playerRole && playerName ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 inline-block">
              <p className="text-sm text-indigo-800">
                You are playing as: <span className="font-semibold capitalize">{playerRole}</span> ({playerName})
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 inline-block">
              <p className="text-sm text-yellow-800">
                Select your role to join the session
              </p>
            </div>
          )}
        </div>
        {!isGM && playerRole && (
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

      {/* Dice Roller */}
      {(isGM || playerRole) && currentUser && (
        <DiceRoller
          sessionId={currentSession.id}
          playerName={
            isGM
              ? (currentUser.user_metadata?.name || currentUser.email || 'GM')
              : (playerName || 'Player')
          }
          playerRole={isGM ? 'Game Master' : playerRole || undefined}
          isGM={isGM}
          onRoll={handleDiceRoll}
        />
      )}

      {/* Dice History */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dice History</h2>
        {diceHistory.length > 0 ? (
          <div className="space-y-3">
            {diceHistory.slice().reverse().map((roll: any) => (
              <div key={roll.id} className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">
                    {roll.player_name}
                    {roll.player_role && (
                      <span className="text-sm text-gray-600 ml-2">
                        ({roll.player_role})
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(roll.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Rolled {roll.dice_count} d6:
                  </span>
                  <div className="flex gap-1">
                    {roll.results.map((result: number, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded text-sm font-medium"
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                  <span className="font-semibold ml-2">Total: {roll.total}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No dice rolls yet</p>
        )}
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