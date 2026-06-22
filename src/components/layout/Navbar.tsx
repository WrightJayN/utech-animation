'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800, fontSize: 18,
          letterSpacing: '-0.02em'
        }}>
          UTECH <span style={{ color: 'var(--accent)' }}>ANIMATION</span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{
                fontSize: 14, fontWeight: 500, color: 'var(--muted)',
                transition: 'color 0.15s'
              }}>
                Dashboard
              </Link>
              <Link href="/upload" style={{
                background: 'var(--accent)', color: '#fff',
                padding: '8px 18px', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                transition: 'background 0.15s'
              }}>
                + New Portfolio
              </Link>
              <button onClick={signOut} style={{
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', padding: '8px 14px',
                borderRadius: 8, fontSize: 14, cursor: 'pointer'
              }}>
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" style={{
              background: 'var(--accent)', color: '#fff',
              padding: '8px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 600
            }}>
              Student Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}