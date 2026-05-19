'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type { Post } from '@/types'

export default function PostsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get<Post[]>('/api/posts'),
  })

  const createPost = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      api.post<Post>('/api/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setShowForm(false)
      setError('')
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create post'),
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    createPost.mutate({
      title: form.get('title') as string,
      content: form.get('content') as string,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posts</h1>
        {user && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            {showForm ? 'Cancel' : 'New post'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
          <div className="space-y-1">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input
              id="title"
              name="title"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="content" className="text-sm font-medium">Content</label>
            <textarea
              id="content"
              name="content"
              required
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={createPost.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {createPost.isPending ? 'Posting…' : 'Create post'}
          </button>
        </form>
      )}

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <div className="space-y-4">
        {posts?.map((post) => (
          <div key={post.id} className="rounded-md border p-4 space-y-2">
            <h2 className="text-lg font-semibold">{post.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{post.author.name}</span>
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              {post._count && (
                <>
                  <span>·</span>
                  <span>{post._count.comments} comments</span>
                </>
              )}
            </div>
          </div>
        ))}
        {posts?.length === 0 && (
          <p className="text-muted-foreground">No posts yet. Be the first!</p>
        )}
      </div>
    </div>
  )
}
