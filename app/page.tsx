'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import type { SessionItem } from '@/lib/types'

type UserMetadata = {
  name?: string
}

type SupabaseUser = {
  id: string
  email?: string
  user_metadata?: UserMetadata
}

export default function Home() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        setUser(data.user as SupabaseUser)
        setOwnerName(data.user.user_metadata?.name || data.user.email || '')
      }
    }

    loadUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user as SupabaseUser | null
      setUser(currentUser)
      if (currentUser) {
        setOwnerName(currentUser.user_metadata?.name || currentUser.email || '')
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setSessions([])
      return
    }

    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const response = await fetch('/api/sessions')
        const data = await response.json()
        const createdByUser = (data || []).filter(
          (session: SessionItem) =>
            session.owner === user.user_metadata?.name || session.owner === user.email,
        )
        setSessions(createdByUser)
      } catch (error) {
        console.error('Could not load sessions', error)
      } finally {
        setLoadingSessions(false)
      }
    }

    loadSessions()
  }, [user])

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName, owner: ownerName }),
      })
      const session = await response.json()
      router.push(`/session/${session.id}`)
    } catch (error) {
      alert('Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  const joinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)
    try {
      const response = await fetch(`/api/sessions/${joinId}`)
      if (response.ok) {
        router.push(`/session/${joinId}`)
      } else {
        alert('Session not found')
      }
    } catch (error) {
      alert('Failed to join session')
    } finally {
      setJoining(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
    setUser(null)
    setSessions([])
    setSigningOut(false)
    router.push('/')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inset-10% lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Band of Blades Game Tool
        </p>
      </div>

      <div className="relative flex place-items-center flex-col w-full max-w-5xl">
        <div className="flex w-full items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold">Welcome to Band of Blades Tool</h1>
            {user ? (
              <p className="mt-2 text-sm text-gray-600">
                Logged in as <strong>{user.user_metadata?.name || user.email}</strong>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Sign in at <a href="/auth" className="text-indigo-600 hover:underline">/auth</a> to see your created sessions.
              </p>
            )}
          </div>

          {user && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          )}
        </div>

        {user && (
          <section className="w-full mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Created Sessions</h2>
              <button
                onClick={() => router.push('/auth')}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Manage account
              </button>
            </div>

            {loadingSessions ? (
              <p className="text-sm text-gray-500">Loading sessions...</p>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => router.push(`/session/${session.id}`)}
                    className="w-full text-left rounded-xl border border-gray-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <p className="font-semibold text-lg">{session.name}</p>
                    <p className="text-sm text-gray-600">ID: {session.id}</p>
                    <p className="text-sm text-gray-500">Owner: {session.owner}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No sessions created yet. Create one above to get started.</p>
            )}
          </section>
        )}

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl">
          {user && (
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-4">Create New Session (Game Master)</h2>
              <form onSubmit={createSession} className="space-y-4">
                <div>
                  <label htmlFor="sessionName" className="block text-sm font-medium">Session Name</label>
                  <input
                    id="sessionName"
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="e.g., Legion"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="ownerName" className="block text-sm font-medium">Your Name (Game Master)</label>
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Session'}
                </button>
              </form>
            </div>
          )}

          <div className={user ? "flex-1" : "w-full max-w-md mx-auto"}>
            <h2 className="text-2xl font-semibold mb-4">Join Existing Session</h2>
            <form onSubmit={joinSession} className="space-y-4">
              <div>
                <label htmlFor="joinId" className="block text-sm font-medium">Session ID</label>
                <input
                  id="joinId"
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder="Enter session ID"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={joining}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join Session'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="/characters"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Characters{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Create and manage commanders, soldiers, and specialists.
          </p>
        </a>

        <a
          href="/guidelines"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Guidelines{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Learn about Band of Blades mechanics and phases.
          </p>
        </a>

        <a
          href="/canvas"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Canvas{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Upload maps and place tokens for your games.
          </p>
        </a>

        <a
          href="/rooms"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Rooms{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Create collaborative game sessions.
          </p>
        </a>

        <a
          href="/dice"
          className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
        >
          <h2 className="mb-3 text-2xl font-semibold">
            Dice Roller{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Roll dice for Band of Blades mechanics.
          </p>
        </a>
      </div>
    </main>
  )
}