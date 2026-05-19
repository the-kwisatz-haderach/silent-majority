'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'

export function Navbar() {
  const { user, logout, loading } = useAuth()

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          Silent Majority
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/posts" className="hover:underline">
            Posts
          </Link>
          <Link href="/polls" className="hover:underline">
            Polls
          </Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <span className="text-muted-foreground">{user.name}</span>
                  <button onClick={logout} className="hover:underline">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
