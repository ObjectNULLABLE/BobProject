import DiceRoller from '@/components/DiceRoller'

export default function Dice() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Dice Roller</h1>
      <p className="mb-6 text-gray-600">
        Roll dice for Band of Blades mechanics. Rolls are saved to your current session if you&apos;re in one.
      </p>

      <DiceRoller
        sessionId="standalone" // This won&apos;t save to a session, just for testing
        playerName="Test Player"
        playerRole="Player"
      />

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Note</h2>
        <p className="text-blue-700">
          For session-specific dice rolling, use the dice roller within your game session.
          Rolls made here are for testing purposes only and won&apos;t be saved to any session.
        </p>
      </div>
    </div>
  )
}