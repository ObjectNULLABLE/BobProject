'use client'

import { useState } from 'react'
import type { DiceRollType, Position, Effect, BobDiceRoll } from '@/lib/types'

interface BobDiceRollerProps {
  sessionId: string
  playerName: string
  playerRole?: string
  isGM?: boolean
  onRoll?: (roll: BobDiceRoll) => void
}

export default function BobDiceRoller({ sessionId, playerName, playerRole, isGM, onRoll }: BobDiceRollerProps) {
  const [rollType, setRollType] = useState<DiceRollType>('action')
  const [diceCount, setDiceCount] = useState(1)
  const [position, setPosition] = useState<Position>('risky')
  const [effect, setEffect] = useState<Effect>('standard')
  const [rolling, setRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<BobDiceRoll | null>(null)

  const getOutcome = (highest: number, totalSixes: number) => {
    if (totalSixes > 1) return 'critical'
    if (highest >= 6) return 'success'
    if (highest >= 4) return 'partial'
    return 'failure'
  }

  const getStressFromResistance = (highest: number): number => {
    // Stress taken is 6 - highest die
    return Math.max(0, 6 - highest)
  }

  const getOutcomeDescription = (rollType: DiceRollType, outcome: string, highest: number, position: Position, effect: Effect, totalSixes: number) => {
    if (rollType === 'action') {
      const descriptions: Record<string, string> = {
        critical: `Critical Success! You accomplish your goal with significant advantage. (Multiple 6s rolled)`,
        success: `Full Success. Things go well. You achieve your goal as intended.`,
        partial: `Partial Success. You do what you're trying to do, but there are consequences: trouble, harm, reduced effect, etc.`,
        failure: `Bad Outcome. Things go poorly. You don't achieve your goal and you suffer complications.`,
      }
      return descriptions[outcome] || ''
    } else if (rollType === 'resistance') {
      const stress = getStressFromResistance(highest)
      const descriptions: Record<string, string> = {
        critical: `Critical Resistance! You resist the consequence with minimal cost. Your character toughs it out (${stress} stress).`,
        success: `Successful Resistance. You resist the consequence effectively. (${stress} stress taken)`,
        partial: `Partial Resistance. You resist but at a cost. (${stress} stress taken)`,
        failure: `Resistance Failed. You cannot resist the consequence and suffer full effect. (${stress} stress taken)`,
      }
      return descriptions[outcome] || ''
    } else if (rollType === 'fortune') {
      const descriptions: Record<string, string> = {
        critical: `Critical Fortune! An amazing coincidence. The situation swings dramatically in your favor.`,
        success: `Good Fortune. The odds break in your favor. Things go better than expected.`,
        partial: `Mixed Fortune. Some luck, but complications remain. The outcome is uncertain.`,
        failure: `Bad Fortune. Luck is not on your side. The situation worsens or remains dire.`,
      }
      return descriptions[outcome] || ''
    }
    return ''
  }

  const rollDice = async () => {
    setRolling(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    let results: number[]
    let highest: number

    // Special case: 0 dice = roll 2d6, take lowest
    if (diceCount === 0) {
      results = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
      highest = Math.min(...results)
    } else {
      results = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1)
      highest = Math.max(...results)
    }

    const totalSixes = results.filter(r => r === 6).length
    const outcome = getOutcome(highest, totalSixes)
    const description = getOutcomeDescription(rollType, outcome, highest, position, effect, totalSixes)
    const stress = rollType === 'resistance' ? getStressFromResistance(highest) : undefined

    const roll: BobDiceRoll = {
      id: Date.now().toString(),
      player_name: playerName,
      player_role: playerRole,
      type: rollType,
      dice_count: diceCount,
      results,
      total: results.reduce((sum, die) => sum + die, 0),
      timestamp: new Date().toISOString(),
      position: rollType === 'action' ? position : undefined,
      effect: rollType === 'action' ? effect : undefined,
      highest_die: highest,
      outcome: outcome as any,
      description,
      stress_taken: stress,
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/chat-feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dice',
          content: roll,
        }),
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
        <div className={`rounded-lg border-2 p-3 ${getOutcomeColor(lastRoll.outcome)}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold capitalize">{lastRoll.type}</p>
              {lastRoll.position && (
                <p className="text-xs opacity-75">{lastRoll.position} • {lastRoll.effect}</p>
              )}
            </div>
            <span className="text-xs font-mono">{new Date(lastRoll.timestamp).toLocaleTimeString()}</span>
          </div>

          <div className="flex gap-1 mb-2">
            {lastRoll.results.map((result, index) => (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                  result === lastRoll.highest_die
                    ? 'bg-white border-2 border-current'
                    : 'bg-white bg-opacity-50 border border-current'
                }`}
              >
                {result}
              </span>
            ))}
          </div>

          <p className="text-sm font-semibold mb-2">
            Highest: {lastRoll.highest_die} - <span className="capitalize">{lastRoll.outcome}</span>
          </p>
          <p className="text-xs leading-tight">{lastRoll.description}</p>
        </div>
      )}
    </div>
  )
}
