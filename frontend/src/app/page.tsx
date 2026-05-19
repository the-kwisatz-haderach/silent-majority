import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Silent Majority</h1>
      <p className="text-muted-foreground">
        A place to share your thoughts, vote on polls, and join the conversation.
      </p>
      <div className="flex gap-4">
        <Link
          href="/posts"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Browse Posts
        </Link>
        <Link
          href="/polls"
          className="rounded-md border px-4 py-2 hover:bg-accent"
        >
          Browse Polls
        </Link>
      </div>
    </div>
  )
}
