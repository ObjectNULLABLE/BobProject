'use client'

import { useState } from 'react'

interface DiceRoll {
  id: string
  player_name: string
  player_role?: string
  dice_count: number
  results: number[]
  total: number
  timestamp: string
}

interface DiceRollerProps {
  sessionId: string
  playerName: string
  playerRole?: string
  isGM?: boolean
  onRoll?: (roll: DiceRoll) => void
}

export default function DiceRoller({ sessionId, playerName, playerRole, isGM, onRoll }: DiceRollerProps) {
  const [diceCount, setDiceCount] = useState(1)
  const [rolling, setRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)

  const rollDice = async () => {
    setRolling(true)

    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1000))

    const results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)
    const total = results.reduce((sum, die) => sum + die, 0)

    const roll: DiceRoll = {
      id: Date.now().toString(),
      player_name: playerName,
      player_role: playerRole,
      dice_count: diceCount,
      results,
      total,
      timestamp: new Date().toISOString(),
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/dice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roll),
      })

      if (response.ok) {
        setLastRoll(roll)
        onRoll?.(roll)
      }
    } catch (error) {
      console.error('Failed to save dice roll:', error)
    }

    setRolling(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Dice Roller</h2>

      <div className="flex items-center gap-4 mb-4">
        <div>
          <label htmlFor="diceCount" className="block text-sm font-medium text-gray-700 mb-1">
            Number of d6 dice:
          </label>
          <select
            id="diceCount"
            value={diceCount}
            onChange={(e) => setDiceCount(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={rolling}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <button
          onClick={rollDice}
          disabled={rolling}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {rolling ? 'Rolling...' : 'Roll Dice'}
        </button>
      </div>

      {lastRoll && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium">{lastRoll.player_name}</span>
            <span className="text-sm text-gray-500">
              {new Date(lastRoll.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Rolled {lastRoll.dice_count} d6:
            </span>
            <div className="flex gap-1">
              {lastRoll.results.map((result, index) => (
                <span
                  key={index}
                  className="inline-flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded text-sm font-medium"
                >
                  {result}
                </span>
              ))}
            </div>
            <span className="font-semibold ml-2">Total: {lastRoll.total}</span>
          </div>
        </div>
      )}
    </div>
  )
}