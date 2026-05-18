'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSessionStore } from '../../../lib/sessionStore'
import RoleSelectionModal from '@/components/RoleSelectionModal'
import BobDiceRoller from '@/components/BobDiceRoller'
import ChatFeed from '@/components/ChatFeed'
import { getCurrentUser } from '@/lib/auth'
import type { LegionRole } from '@/lib/auth'
import type { Session, SessionMember, BobDiceRoll } from '@/lib/types'

type TabType = 'role' | 'characters' | 'maps' | 'notes' | 'info'

export default function SessionPage() {
  const params = useParams()
  const { currentSession, setSession } = useSessionStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [playerRole, setPlayerRole] = useState<LegionRole | null>(null)
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [isGM, setIsGM] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('role')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${params.id}`)
        if (!response.ok) {
          throw new Error('Session not found')
        }
        const session: Session = await response.json()
        setSession(session)

        console.log('Fetched session:', session)

        // Check if current user is the GM
        const { user } = await getCurrentUser()

        setCurrentUser(user)
        console.log('Current user:', user)
        const isUserSessionOwner = user && (
          session.owner === user.user_metadata?.name ||
          session.owner === user.email ||
          session.gm_id === user.id
        )
        setIsGM(!!isUserSessionOwner)

        console.log('Is user session owner (GM)?', isUserSessionOwner)
        console.log('Is GM:', isGM)

        // Fetch session members
        const membersResponse = await fetch(`/api/sessions/${params.id}/members`)
        if (membersResponse.ok) {
          const members = await membersResponse.json()
          setSessionMembers(members)
        }

        // Check for saved role in local storage (only for non-GMs)
        if (!isUserSessionOwner) {
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
  }, [params.id, setSession, isGM, setIsGM])

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-40">
        <div className="container px-4 mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-3">{currentSession.name}</h1>
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
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto p-4 flex gap-6">
        {/* Left: Tabbed Content */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50">
              {(['role', 'characters', 'maps', 'notes', 'info'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 px-4 text-sm font-medium text-center capitalize transition-colors ${
                    activeTab === tab
                      ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'role' ? 'Legion' : tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white p-6">
              {/* Role Tab */}
              {activeTab === 'role' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Legion Members</h2>
                    <div className="space-y-2">
                      {sessionMembers.length > 0 ? (
                        sessionMembers.map((member) => (
                          <div key={member.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
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
                </div>
              )}

              {/* Characters Tab */}
              {activeTab === 'characters' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Characters</h2>
                  <p className="text-gray-600 mb-4">{currentSession.characters.length} characters</p>
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-500">Character management coming soon</p>
                  </div>
                </div>
              )}

              {/* Maps Tab */}
              {activeTab === 'maps' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Maps</h2>
                  <p className="text-gray-600 mb-4">{currentSession.maps.length} maps</p>
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-500">Map management coming soon</p>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-500">Session notes coming soon</p>
                  </div>
                </div>
              )}

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Session Information</h2>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600">Session ID</p>
                      <p className="font-mono font-medium">{currentSession.id}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600">Game Master</p>
                      <p className="font-medium">{currentSession.owner}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{new Date(currentSession.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Dice Roller & History Sidebar */}
        <div className="w-80 sticky top-24 h-fit">
          {/* Band of Blades Dice Roller */}
          {(isGM || playerRole) && (
            <BobDiceRoller
              sessionId={currentSession.id}
              playerName={
                isGM
                  ? (currentUser.user_metadata?.name || currentUser.email || 'GM')
                  : (playerName || 'Player')
              }
              playerRole={isGM ? 'Game Master' : playerRole || undefined}
              isGM={isGM}
            />
          )}

          {/* Chat Feed */}
          <ChatFeed sessionId={currentSession.id} />
        </div>
      </div>

      {showRoleModal && (
        <RoleSelectionModal
          sessionId={currentSession.id}
          takenRoles={sessionMembers.map((m) => m.role)}
          members={sessionMembers}
          onRoleSelected={(role, name) => {
            setPlayerRole(role)
            setPlayerName(name)
            setShowRoleModal(false)
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