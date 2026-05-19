'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type { Poll } from '@/types'

export default function PollsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [options, setOptions] = useState(['', ''])
  const [error, setError] = useState('')

  const { data: polls, isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => api.get<Poll[]>('/api/polls'),
  })

  const createPoll = useMutation({
    mutationFn: (data: { question: string; options: string[] }) =>
      api.post<Poll>('/api/polls', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] })
      setShowForm(false)
      setOptions(['', ''])
      setError('')
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create poll'),
  })

  const vote = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      api.post(`/api/polls/${pollId}/vote`, { optionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    createPoll.mutate({
      question: form.get('question') as string,
      options: options.filter((o) => o.trim() !== ''),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Polls</h1>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            {showForm ? 'Cancel' : 'New poll'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div className="space-y-1">
            <label htmlFor="question" className="text-sm font-medium">Question</label>
            <input
              id="question"
              name="question"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Options</p>
            {options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...options]
                  next[i] = e.target.value
                  setOptions(next)
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={() => setOptions([...options, ''])}
                className="text-sm text-muted-foreground hover:underline"
              >
                + Add option
              </button>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={createPoll.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createPoll.isPending ? 'Creating…' : 'Create poll'}
          </button>
        </form>
      )}

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="space-y-6">
        {polls?.map((poll) => {
          const totalVotes = poll.options.reduce((sum, o) => sum + o._count.votes, 0)
          const userVote = poll.votes?.find((v) => v.userId === user?.id)

          return (
            <div key={poll.id} className="rounded-md border p-4 space-y-3">
              <h2 className="font-semibold">{poll.question}</h2>
              <div className="space-y-2">
                {poll.options.map((option) => {
                  const pct = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0
                  const isVoted = userVote?.pollOptionId === option.id

                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <button
                          onClick={() => user && vote.mutate({ pollId: poll.id, optionId: option.id })}
                          disabled={!user || vote.isPending}
                          className={`text-left hover:underline disabled:cursor-default ${isVoted ? 'font-semibold' : ''}`}
                        >
                          {isVoted ? '✓ ' : ''}{option.text}
                        </button>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{poll.author.name}</span>
                <span>·</span>
                <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )
        })}
        {polls?.length === 0 && (
          <p className="text-muted-foreground">No polls yet. Create one!</p>
        )}
      </div>
    </div>
  )
}
