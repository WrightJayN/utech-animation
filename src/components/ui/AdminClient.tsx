'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const TABS = ['All', 'Active', 'Taken Down', 'Pending Appeals']

export default function AdminClient({ portfolios, adminId }: {
  portfolios: any[]
  adminId: string
}) {
  const [list, setList] = useState(portfolios)
  const [activeTab, setActiveTab] = useState('All')
  const [reasonText, setReasonText] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = list.filter(p => {
    if (activeTab === 'Active') return p.status === 'active'
    if (activeTab === 'Taken Down') return p.status === 'taken_down'
    if (activeTab === 'Pending Appeals')
      return p.takedowns?.some((t: any) => t.appeal_status === 'pending')
    return true
  })

  const takeDown = async (portfolioId: string) => {
    const reason = reasonText[portfolioId]?.trim()
    if (!reason) { alert('Please provide a reason for the takedown.'); return }
    setLoading(portfolioId)

    await supabase.from('portfolios')
      .update({ status: 'taken_down' })
      .eq('id', portfolioId)

    await supabase.from('takedowns').insert({
      portfolio_id: portfolioId,
      admin_id: adminId,
      reason,
      appeal_status: 'none'
    })

    setList(list.map(p => p.id === portfolioId ? {
      ...p, status: 'taken_down',
      takedowns: [{ reason, appeal_status: 'none', created_at: new Date().toISOString() }]
    } : p))
    setReasonText(prev => ({ ...prev, [portfolioId]: '' }))
    setLoading(null)
  }

  const restore = async (portfolioId: string, takedownId: string) => {
    setLoading(portfolioId)
    await supabase.from('portfolios')
      .update({ status: 'active' })
      .eq('id', portfolioId)
    await supabase.from('takedowns')
      .update({ appeal_status: 'approved', resolved_at: new Date().toISOString() })
      .eq('id', takedownId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p, status: 'active',
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId ? { ...t, appeal_status: 'approved' } : t
      )
    } : p))
    setLoading(null)
  }

  const rejectAppeal = async (portfolioId: string, takedownId: string) => {
    setLoading(portfolioId)
    await supabase.from('takedowns')
      .update({ appeal_status: 'rejected' })
      .eq('id', takedownId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId ? { ...t, appeal_status: 'rejected' } : t
      )
    } : p))
    setLoading(null)
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#7c3aed' : 'var(--surface)',
              color: activeTab === tab ? '#fff' : 'var(--muted)'
            }}
          >
            {tab}
            {tab === 'Pending Appeals' && (
              <span style={{
                marginLeft: 6, background: '#ef4444',
                color: '#fff', borderRadius: 100,
                padding: '1px 6px', fontSize: 11
              }}>
                {list.filter(p => p.takedowns?.some((t: any) => t.appeal_status === 'pending')).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Portfolio list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14, padding: '32px 0' }}>
            No portfolios in this category.
          </p>
        )}
        {filtered.map(portfolio => {
          const owner = portfolio.profiles
          const takedown = portfolio.takedowns?.[0] ?? null
          const isTakenDown = portfolio.status === 'taken_down'
          const hasPendingAppeal = takedown?.appeal_status === 'pending'

          return (
            <div key={portfolio.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${isTakenDown ? '#7f1d1d' : hasPendingAppeal ? '#78350f' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden'
            }}>

              {/* Pending appeal banner */}
              {hasPendingAppeal && (
                <div style={{
                  background: '#78350f', padding: '12px 20px',
                  borderBottom: '1px solid #92400e'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fcd34d', marginBottom: 4 }}>
                    ⚡ Student has submitted an appeal
                  </p>
                  <p style={{ fontSize: 13, color: '#fde68a' }}>
                    "{takedown.appeal_message}"
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => restore(portfolio.id, takedown.id)}
                      disabled={loading === portfolio.id}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#10b981', color: '#fff',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      ✓ Approve — Restore Portfolio
                    </button>
                    <button
                      onClick={() => rejectAppeal(portfolio.id, takedown.id)}
                      disabled={loading === portfolio.id}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#991b1b', color: '#fff',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      ✗ Reject Appeal
                    </button>
                  </div>
                </div>
              )}

              <div style={{ padding: '20px 24px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {/* Thumbnail */}
                <div style={{
                  width: 72, height: 72, borderRadius: 8,
                  overflow: 'hidden', flexShrink: 0,
                  background: 'var(--surface-2)'
                }}>
                  {portfolio.cover_image_url ? (
                    <img
                      src={portfolio.cover_image_url}
                      alt={portfolio.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 24
                    }}>🎨</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16, fontWeight: 700
                    }}>
                      {portfolio.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      fontSize: 11, fontWeight: 600,
                      background: isTakenDown ? '#7f1d1d' : '#14532d',
                      color: isTakenDown ? '#fca5a5' : '#86efac'
                    }}>
                      {isTakenDown ? 'Taken Down' : 'Active'}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      fontSize: 11, color: 'var(--muted)',
                      border: '1px solid var(--border)'
                    }}>
                      {portfolio.visibility}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>
                    By{' '}
                    <Link
                      href={`/profile/${owner?.username}`}
                      style={{ color: 'var(--accent)' }}
                    >
                      {owner?.full_name}
                    </Link>
                  </p>
                  {takedown && !hasPendingAppeal && (
                    <p style={{ fontSize: 12, color: '#fca5a5' }}>
                      Takedown reason: {takedown.reason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                  <Link
                    href={`/portfolio/${portfolio.slug}`}
                    target="_blank"
                    style={{
                      padding: '8px 14px', borderRadius: 8, textAlign: 'center',
                      fontSize: 13, fontWeight: 500,
                      border: '1px solid var(--border)', color: 'var(--muted)'
                    }}
                  >
                    View Portfolio ↗
                  </Link>

                  {isTakenDown && !hasPendingAppeal && (
                    <button
                      onClick={() => restore(portfolio.id, takedown.id)}
                      disabled={loading === portfolio.id}
                      style={{
                        padding: '8px 14px', borderRadius: 8,
                        fontSize: 13, fontWeight: 500,
                        background: '#14532d', color: '#86efac',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      Restore Portfolio
                    </button>
                  )}

                  {!isTakenDown && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        placeholder="Reason for takedown (required)..."
                        value={reasonText[portfolio.id] ?? ''}
                        onChange={e => setReasonText(prev => ({
                          ...prev, [portfolio.id]: e.target.value
                        }))}
                        rows={2}
                        style={{
                          padding: '8px 12px', borderRadius: 6,
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 12,
                          resize: 'none', fontFamily: 'var(--font-body)'
                        }}
                      />
                      <button
                        onClick={() => takeDown(portfolio.id)}
                        disabled={loading === portfolio.id || !reasonText[portfolio.id]?.trim()}
                        style={{
                          padding: '8px 14px', borderRadius: 8,
                          fontSize: 13, fontWeight: 500,
                          background: 'transparent',
                          border: '1px solid #7f1d1d',
                          color: '#ef4444', cursor: 'pointer',
                          opacity: !reasonText[portfolio.id]?.trim() ? 0.5 : 1
                        }}
                      >
                        {loading === portfolio.id ? '...' : 'Take Down'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}