'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChatFeedEntry } from '@/lib/types'
import {
  getFitDOutcome,
  getKeptDie,
  getResistanceStressCost,
  getRollDescription,
  normalizeRollContent,
} from '@/lib/rollHelpers'

interface ChatFeedProps {
  sessionId: string
}

export default function ChatFeed({ sessionId }: ChatFeedProps) {
  const [entries, setEntries] = useState<ChatFeedEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchEntries = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}/chat-feed`)
        if (response.ok) {
          const data = await response.json()
          if (mounted) setEntries(data)
        }
      } catch (error) {
        console.error('Failed to fetch chat feed:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchEntries()

    return () => {
      mounted = false
    }
  }, [sessionId])

  useEffect(() => {
    const channel = supabase
      .channel('chat_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_feed', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEntry = payload.new as ChatFeedEntry
            if (newEntry) {
              setEntries((prev) => [...prev, newEntry])
            }
          }
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

  const renderRollEntry = (entry: ChatFeedEntry) => {
    const roll = normalizeRollContent(entry.content)
    const keptDie = getKeptDie(roll.results, roll.dice_pool)
    const outcome = getFitDOutcome(roll.results, roll.dice_pool)
    const resistanceCost = getResistanceStressCost(roll.results, roll.dice_pool)
    const description = getRollDescription(roll.roll_type, outcome)
    const timestamp = new Date(entry.created_at).toLocaleTimeString()

    return (
      <div className={`rounded-lg border-2 p-3 ${getOutcomeColor(outcome)}`}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-sm capitalize">{roll.roll_type} roll</p>
            <p className="text-xs opacity-75">
              {roll.actor.name}
              {roll.actor.role ? ` • ${roll.actor.role}` : ''}
            </p>
            {roll.roll_type === 'action' && (
              <p className="text-xs opacity-75">
                {roll.action ?? 'Action'} • {roll.position} • {roll.effect}
              </p>
            )}
            {roll.roll_type === 'resistance' && (
              <p className="text-xs opacity-75">{roll.attribute} resistance</p>
            )}
            {roll.roll_type === 'fortune' && roll.context && (
              <p className="text-xs opacity-75">{roll.context}</p>
            )}
            {roll.roll_type === 'engagement' && roll.mission_id && (
              <p className="text-xs opacity-75">Mission {roll.mission_id}</p>
            )}
            {roll.roll_type === 'campaign' && roll.campaign_roll_type && (
              <p className="text-xs opacity-75">{roll.campaign_roll_type}</p>
            )}
          </div>
          <span className="text-xs font-mono">{timestamp}</span>
        </div>

        <div className="flex gap-1 mb-2">
          {roll.results.map((result, index) => (
            <span
              key={index}
              className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                result === keptDie
                  ? 'bg-white border-2 border-current'
                  : 'bg-white bg-opacity-50 border border-current'
              }`}>
              {result}
            </span>
          ))}
        </div>

        <div className="mb-2">
          {roll.roll_type === 'resistance' ? (
            <p className="text-sm font-semibold">
              Stress cost: {resistanceCost === -1 ? 'Critical (-1)' : resistanceCost}
            </p>
          ) : (
            <p className="text-sm font-semibold">
              Kept: {keptDie}
              <span className="capitalize"> - {outcome}</span>
            </p>
          )}
        </div>

        {description && roll.roll_type !== 'resistance' && (
          <p className="text-xs leading-tight">{description}</p>
        )}
        {roll.note && (
          <p className="text-xs leading-tight text-gray-600">{roll.note}</p>
        )}
      </div>
    )
  }

  const renderMessageEntry = (entry: ChatFeedEntry) => {
    const content = entry.content as { text?: string; player_name?: string; player_role?: string }
    if (typeof content?.text === 'string') {
      return (
        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-sm">{content.player_name || 'Message'}</p>
              {content.player_role && (
                <p className="text-xs opacity-75">{content.player_role}</p>
              )}
            </div>
            <span className="text-xs font-mono">{new Date(entry.created_at).toLocaleTimeString()}</span>
          </div>
          <p className="text-sm text-gray-700">{content.text}</p>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-gray-200 p-3 bg-gray-50 text-xs text-gray-600">
        <pre>{JSON.stringify(entry.content, null, 2)}</pre>
      </div>
    )
  }

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
              {(entry.type === 'roll' || entry.type === 'dice' || typeof (entry.content as any)?.roll_type === 'string')
                ? renderRollEntry(entry)
                : renderMessageEntry(entry)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-8">No entries yet</p>
      )}
    </div>
  )
}
