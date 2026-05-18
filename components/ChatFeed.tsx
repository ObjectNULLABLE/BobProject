'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatFeedEntry, BobDiceRoll } from '@/lib/types'

interface ChatFeedProps {
  sessionId: string
}

export default function ChatFeed({ sessionId }: ChatFeedProps) {
  const [entries, setEntries] = useState<ChatFeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/chat-feed`)
        if (response.ok) {
          const data = await response.json()
          setEntries(data)
        }
      } catch (error) {
        console.error('Failed to fetch chat feed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [sessionId])

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat_feed:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_feed',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newEntry = payload.new as ChatFeedEntry
          setEntries((prev) => [...prev, newEntry])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'critical':
        return 'bg-green-100 border-green-300 text-green-900'
      case 'success':
        return 'bg-blue-100 border-blue-300 text-blue-900'
      case 'partial':
        return 'bg-yellow-100 border-yellow-300 text-yellow-900'
      case 'failure':
        return 'bg-red-100 border-red-300 text-red-900'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  const renderDiceEntry = (roll: BobDiceRoll) => (
    <div className={`rounded-lg border-2 p-3 ${getOutcomeColor(roll.outcome)}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-sm capitalize">{roll.type}</p>
          <p className="text-xs opacity-75">
            {roll.player_name}
            {roll.player_role && ` • ${roll.player_role}`}
          </p>
          {roll.position && (
            <p className="text-xs opacity-75">{roll.position} • {roll.effect}</p>
          )}
        </div>
        <span className="text-xs font-mono">
          {new Date(roll.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="flex gap-1 mb-2">
        {roll.results.map((result, index) => (
          <span
            key={index}
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
              result === roll.highest_die
                ? 'bg-white border-2 border-current'
                : 'bg-white bg-opacity-50 border border-current'
            }`}
          >
            {result}
          </span>
        ))}
      </div>

      <div className="mb-2">
        <p className="text-sm font-semibold">
          Highest: {roll.highest_die} - <span className="capitalize">{roll.outcome}</span>
        </p>
        {roll.stress_taken !== undefined && (
          <p className="text-sm font-semibold text-red-700">
            Stress Taken: {roll.stress_taken}
          </p>
        )}
      </div>

      {roll.description && (
        <p className="text-xs leading-tight">{roll.description}</p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Chat Feed</h3>
        <p className="text-gray-500 text-sm text-center py-8">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4">Chat Feed</h3>
      {entries.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.slice().reverse().map((entry) => (
            <div key={entry.id}>
              {entry.type === 'dice' && renderDiceEntry(entry.content as BobDiceRoll)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">No entries yet</p>
      )}
    </div>
  )
}
