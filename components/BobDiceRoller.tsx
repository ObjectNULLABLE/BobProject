'use client'

import { useState } from 'react'
import { getFitDOutcome, getKeptDie, getRollDescription } from '@/lib/rollHelpers'
import type { DiceRollType, Position, Effect, RollContent } from '@/lib/types'

interface BobDiceRollerProps {
  sessionId: string
  playerName: string
  playerRole?: string
  isGM?: boolean
  onRoll?: () => void
}

export default function BobDiceRoller({ sessionId, playerName, playerRole, isGM, onRoll }: BobDiceRollerProps) {
  const [rollType, setRollType] = useState<DiceRollType>('action')
  const [diceCount, setDiceCount] = useState(1)
  const [position, setPosition] = useState<Position>('risky')
  const [effect, setEffect] = useState<Effect>('standard')
  const [rolling, setRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<(RollContent & { created_at: string }) | null>(null)

  const getStressFromResistance = (highest: number): number => {
    return Math.max(0, 6 - highest)
  }

  const rollDice = async () => {
    setRolling(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const results = diceCount === 0
      ? [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
      : Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)

    const baseRoll = {
      dice_pool: diceCount,
      results,
      actor: {
        member_id: '',
        name: playerName,
        role: playerRole,
      },
      created_at: new Date().toISOString(),
    }

    const rollContent: RollContent & { created_at: string } =
      rollType === 'action'
        ? {
            ...baseRoll,
            roll_type: 'action',
            action: null,
            position,
            effect,
          }
        : rollType === 'resistance'
        ? {
            ...baseRoll,
            roll_type: 'resistance',
            attribute: 'insight',
          }
        : {
            ...baseRoll,
            roll_type: 'fortune',
          }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/chat-feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'roll',
          content: rollContent,
        }),
      })

      if (response.ok) {
        setLastRoll(rollContent)
        onRoll?.()
      }
    } catch (error) {
      console.error('Failed to save dice roll:', error)
    }

    setRolling(false)
  }

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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">Band of Blades Dice</h3>

      {/* Roll Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Roll Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['action', 'resistance', 'fortune'] as DiceRollType[]).map(type => (
            <button
              key={type}
              onClick={() => setRollType(type)}
              disabled={rolling}
              className={`py-2 px-3 rounded-md text-sm font-medium capitalize transition-colors ${
                rollType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Dice Count */}
      <div>
        <label htmlFor="diceCount" className="block text-sm font-medium text-gray-700 mb-2">
          Dice
        </label>
        <select
          id="diceCount"
          value={diceCount}
          onChange={(e) => setDiceCount(Number(e.target.value))}
          disabled={rolling}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {Array.from({ length: 7 }, (_, i) => i).map(num => (
            <option key={num} value={num}>{num}d</option>
          ))}
        </select>
      </div>

      {/* Action Roll Options */}
      {rollType === 'action' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {(['controlled', 'risky', 'desperate'] as Position[]).map(pos => (
                <button
                  key={pos}
                  onClick={() => setPosition(pos)}
                  disabled={rolling}
                  className={`py-2 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
                    position === pos
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Effect</label>
            <div className="grid grid-cols-3 gap-2">
              {(['limited', 'standard', 'great'] as Effect[]).map(eff => (
                <button
                  key={eff}
                  onClick={() => setEffect(eff)}
                  disabled={rolling}
                  className={`py-2 px-3 rounded-md text-xs font-medium capitalize transition-colors ${
                    effect === eff
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {eff}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Roll Button */}
      <button
        onClick={rollDice}
        disabled={rolling}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium capitalize"
      >
        {rolling ? 'Rolling...' : `Roll ${rollType}`}
      </button>

      {/* Last Roll Result */}
      {lastRoll && (
        <div className={`rounded-lg border-2 p-3 ${getOutcomeColor(getFitDOutcome(lastRoll.results, lastRoll.dice_pool))}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-sm capitalize">{lastRoll.roll_type} roll</p>
              <p className="text-xs opacity-75">
                {lastRoll.actor.name}
                {lastRoll.actor.role ? ` • ${lastRoll.actor.role}` : ''}
              </p>
              {lastRoll.roll_type === 'action' && (
                <p className="text-xs opacity-75">
                  {lastRoll.action ?? 'Action'} • {lastRoll.position} • {lastRoll.effect}
                </p>
              )}
              {lastRoll.roll_type === 'resistance' && (
                <p className="text-xs opacity-75">{lastRoll.attribute} resistance</p>
              )}
              {lastRoll.roll_type === 'fortune' && lastRoll.context && (
                <p className="text-xs opacity-75">{lastRoll.context}</p>
              )}
            </div>
            <span className="text-xs font-mono">{new Date(lastRoll.created_at).toLocaleTimeString()}</span>
          </div>

          <div className="flex gap-1 mb-2">
            {lastRoll.results.map((result, index) => (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                  result === getKeptDie(lastRoll.results, lastRoll.dice_pool)
                    ? 'bg-white border-2 border-current'
                    : 'bg-white bg-opacity-50 border border-current'
                }`}>
                {result}
              </span>
            ))}
          </div>

          <p className="text-sm font-semibold mb-2">
            Kept: {getKeptDie(lastRoll.results, lastRoll.dice_pool)} - <span className="capitalize">{getFitDOutcome(lastRoll.results, lastRoll.dice_pool)}</span>
          </p>
          <p className="text-xs leading-tight">{getRollDescription(lastRoll.roll_type, getFitDOutcome(lastRoll.results, lastRoll.dice_pool))}</p>
        </div>
      )}
    </div>
  )
}
