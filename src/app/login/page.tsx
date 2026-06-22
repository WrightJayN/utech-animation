'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async () => {
    setLoading(true)
    setError('')

    if (isSignUp) {
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, username }
        }
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--surface-2)', border: '1.5px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: 15,
    outline: 'none', fontFamily: 'var(--font-body)'
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28,
          fontWeight: 800, marginBottom: 8
        }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>
          {isSignUp ? 'Join the UTech Animation community' : 'Sign in to manage your portfolios'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignUp && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Full Name</label>
              <input
                style={inputStyle} value={fullName} placeholder="Jane Smith"
                onChange={e => setFullName(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
            <input
              style={inputStyle} type="email" value={email}
              placeholder="you@utech.edu.jm"
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Password</label>
            <input
              style={inputStyle} type="password" value={password}
              placeholder="••••••••"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>
          )}
          {message && (
            <p style={{ fontSize: 13, color: '#10b981' }}>{message}</p>
          )}

          <button
            onClick={handleAuth} disabled={loading}
            style={{
              background: 'var(--accent)', color: '#fff',
              padding: '13px', borderRadius: 8,
              fontSize: 15, fontWeight: 600,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: 8
            }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--muted)', fontSize: 13,
              cursor: 'pointer', textAlign: 'center'
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}