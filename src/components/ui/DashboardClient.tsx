'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', desc: 'Visible to everyone', color: '#10b981' },
  { value: 'unlisted', label: 'Unlisted', desc: 'Only via direct link', color: '#f59e0b' },
  { value: 'private', label: 'Private', desc: 'Only you can see it', color: '#71717a' },
]

export default function DashboardClient({ portfolios }: { portfolios: any[] }) {
  const [list, setList] = useState(portfolios)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [appealText, setAppealText] = useState<Record<string, string>>({})
  const [appealingId, setAppealingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const setVisibility = async (id: string, visibility: string) => {
    await supabase.from('portfolios').update({ visibility }).eq('id', id)
    setList(list.map(p => p.id === id ? { ...p, visibility } : p))
  }

  const deletePortfolio = async (id: string) => {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('portfolios').delete().eq('id', id)
    setList(list.filter(p => p.id !== id))
    setDeleting(null)
    router.refresh()
  }

  const submitAppeal = async (portfolioId: string, takedownId: string) => {
    const message = appealText[portfolioId]?.trim()
    if (!message) return
    setAppealingId(portfolioId)
    await supabase
      .from('takedowns')
      .update({ appeal_message: message, appeal_status: 'pending' })
      .eq('id', takedownId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId
          ? { ...t, appeal_message: message, appeal_status: 'pending' }
          : t
      )
    } : p))
    setAppealingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {list.map(portfolio => {
        const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []
        const takedown = portfolio.takedowns?.[0] ?? null
        const isTakenDown = portfolio.status === 'taken_down'
        const visConfig = VISIBILITY_OPTIONS.find(v => v.value === portfolio.visibility)
          ?? VISIBILITY_OPTIONS[0]

        return (
          <div key={portfolio.id} style={{
            background: 'var(--surface)',
            border: `1px solid ${isTakenDown ? '#7f1d1d' : 'var(--border)'}`,
            borderRadius: 12, overflow: 'hidden'
          }}>

            {/* Takedown banner */}
            {isTakenDown && takedown && (
              <div style={{
                background: '#7f1d1d', padding: '12px 20px',
                borderBottom: '1px solid #991b1b'
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>
                  ⚠ Portfolio taken down by admin
                </p>
                <p style={{ fontSize: 13, color: '#fca5a5' }}>
                  Reason: {takedown.reason}
                </p>
                {takedown.appeal_status === 'none' && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      placeholder="Write your appeal message..."
                      value={appealText[portfolio.id] ?? ''}
                      onChange={e => setAppealText(prev => ({ ...prev, [portfolio.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #991b1b',
                        borderRadius: 6, color: '#fff',
                        fontSize: 13, resize: 'vertical',
                        minHeight: 72, fontFamily: 'var(--font-body)'
                      }}
                    />
                    <button
                      onClick={() => submitAppeal(portfolio.id, takedown.id)}
                      disabled={appealingId === portfolio.id}
                      style={{
                        marginTop: 8, padding: '8px 16px',
                        background: '#991b1b', color: '#fff',
                        border: 'none', borderRadius: 6,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {appealingId === portfolio.id ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </div>
                )}
                {takedown.appeal_status === 'pending' && (
                  <p style={{ marginTop: 8, fontSize: 13, color: '#fcd34d' }}>
                    ⏳ Appeal submitted — awaiting admin review
                  </p>
                )}
                {takedown.appeal_status === 'rejected' && (
                  <p style={{ marginTop: 8, fontSize: 13, color: '#fca5a5' }}>
                    ✗ Appeal rejected
                  </p>
                )}
              </div>
            )}

            <div style={{
              padding: '20px 24px',
              display: 'flex', gap: 20,
              alignItems: 'center', flexWrap: 'wrap'
            }}>
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
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 16, fontWeight: 700, marginBottom: 4
                }}>
                  {portfolio.title}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {tags.map((tag: string) => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: 100,
                      fontSize: 11, fontWeight: 500,
                      background: 'var(--surface-2)',
                      color: 'var(--muted)',
                      border: '1px solid var(--border)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Visibility badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 100,
                  fontSize: 11, fontWeight: 600,
                  border: `1px solid ${visConfig.color}`,
                  color: visConfig.color
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: visConfig.color, display: 'inline-block'
                  }} />
                  {visConfig.label}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <Link
                  href={`/portfolio/${portfolio.slug}`}
                  target="_blank"
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    fontSize: 13, fontWeight: 500,
                    border: '1px solid var(--border)',
                    color: 'var(--muted)'
                  }}
                >
                  View ↗
                </Link>

                {!isTakenDown && (
                  <Link
                    href={`/edit/${portfolio.id}`}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      fontSize: 13, fontWeight: 500,
                      border: '1px solid var(--border)',
                      color: 'var(--muted)'
                    }}
                  >
                    Edit
                  </Link>
                )}

                {/* Visibility selector */}
                {!isTakenDown && (
                  <select
                    value={portfolio.visibility}
                    onChange={e => setVisibility(portfolio.id, e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      fontSize: 13, fontWeight: 500,
                      border: '1px solid var(--border)',
                      background: 'var(--surface-2)',
                      color: 'var(--text)', cursor: 'pointer'
                    }}
                  >
                    {VISIBILITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => deletePortfolio(portfolio.id)}
                  disabled={deleting === portfolio.id}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    fontSize: 13, fontWeight: 500,
                    border: '1px solid #3f1212',
                    background: 'transparent', color: '#ef4444',
                    cursor: 'pointer',
                    opacity: deleting === portfolio.id ? 0.5 : 1
                  }}
                >
                  {deleting === portfolio.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}