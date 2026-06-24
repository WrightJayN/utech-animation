'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ReportButton({ portfolioId }: { portfolioId: string }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<'inappropriate_content' | 'copyright'>('inappropriate_content')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const submit = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be signed in to report.'); setLoading(false); return }

    const { error: err } = await supabase.from('reports').insert({
      portfolio_id: portfolioId,
      reporter_id: user.id,
      category,
      details: details.trim() || null
    })

    if (err) {
      if (err.code === '23505') setError('You have already reported this portfolio.')
      else setError('Something went wrong. Try again.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) return (
    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 16 }}>
      ✓ Report submitted. Our team will review it.
    </p>
  )

  return (
    <div style={{ marginTop: 16 }}>
      {!open ? (
        <button
          onClick={async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setError('Sign in to report this portfolio.'); return }
            setOpen(true)
          }}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--muted)', fontSize: 13,
            cursor: 'pointer', textDecoration: 'underline'
          }}
        >
          Report this portfolio
        </button>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12
        }}>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Report Portfolio</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Category</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'inappropriate_content', label: 'Inappropriate Content' },
                { value: 'copyright', label: 'Copyright' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value as any)}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: `1.5px solid ${category === opt.value ? '#ef4444' : 'var(--border)'}`,
                    background: category === opt.value ? 'rgba(239,68,68,0.1)' : 'transparent',
                    color: category === opt.value ? '#ef4444' : 'var(--muted)',
                    transition: 'all 0.15s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Details (optional)</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe the issue..."
              rows={3}
              style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13,
                resize: 'none', fontFamily: 'var(--font-body)'
              }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: '#ef4444' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={submit} disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: '#ef4444', color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'transparent', color: 'var(--muted)',
                border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}