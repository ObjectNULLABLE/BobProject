'use client'

import { useState, useEffect } from 'react'
import { LEGION_ROLES, type LegionRole } from '@/lib/auth'

interface RoleSelectionModalProps {
  sessionId: string
  onRoleSelected: (role: LegionRole, playerName: string) => void
  onClose: () => void
  takenRoles: string[]
}

export default function RoleSelectionModal({
  sessionId,
  onRoleSelected,
  onClose,
  takenRoles,
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<LegionRole | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !playerName) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/sessions/${sessionId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, player_name: playerName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to select role')
      }

      // Save to local storage
      localStorage.setItem(`session_${sessionId}_role`, selectedRole)
      localStorage.setItem(`session_${sessionId}_player_name`, playerName)

      onRoleSelected(selectedRole, playerName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">Select Your Legion Role</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleConfirm} className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose a Role</label>
            <div className="space-y-2">
              {LEGION_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role as LegionRole)}
                  disabled={takenRoles.includes(role)}
                  className={`w-full p-3 rounded-md border-2 transition-colors capitalize font-medium ${
                    selectedRole === role
                      ? 'border-indigo-600 bg-indigo-50'
                      : takenRoles.includes(role)
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {role}
                  {takenRoles.includes(role) && ' (taken)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRole || !playerName}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
