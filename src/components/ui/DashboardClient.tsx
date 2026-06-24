'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', color: '#10b981' },
  { value: 'unlisted', label: 'Unlisted', color: '#f59e0b' },
  { value: 'private', label: 'Private', color: '#71717a' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:        { label: 'Active',         color: '#86efac', bg: '#14532d' },
  reported:      { label: 'Reported',       color: '#fcd34d', bg: '#78350f' },
  taken_down:    { label: 'Taken Down',     color: '#fca5a5', bg: '#7f1d1d' },
  pending_appeal:{ label: 'Pending Appeal', color: '#93c5fd', bg: '#1e3a5f' },
  denied_appeal: { label: 'Appeal Denied',  color: '#f9a8d4', bg: '#831843' },
}

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

    await supabase
      .from('portfolios')
      .update({ status: 'pending_appeal' })
      .eq('id', portfolioId)

    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      status: 'pending_appeal',
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId
          ? { ...t, appeal_message: message, appeal_status: 'pending' }
          : t
      )
    } : p))
    setAppealingId(null)
  }

  const [counterText, setCounterText] = useState<Record<string, string>>({})

  const submitCounter = async (warningId: string) => {
  const statement = counterText[warningId]?.trim()
  if (!statement) return

  await supabase.from('warnings').update({
      counter_statement: statement,
      counter_submitted_at: new Date().toISOString()
  }).eq('id', warningId)

  setList(list.map(p => ({
      ...p,
      warnings: p.warnings?.map((w: any) =>
      w.id === warningId
          ? { ...w, counter_statement: statement, counter_submitted_at: new Date().toISOString() }
          : w
      )
  })))
  setCounterText(prev => ({ ...prev, [warningId]: '' }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {list.map(portfolio => {
        const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []
        const takedown = portfolio.takedowns?.[0] ?? null
        const warnings = portfolio.warnings ?? []
        const activeWarning = warnings.find((w: any) => new Date(w.expires_at) > new Date())
        const status = portfolio.status ?? 'active'
        const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.active
        const visConfig = VISIBILITY_OPTIONS.find(v => v.value === portfolio.visibility) ?? VISIBILITY_OPTIONS[0]
        const isLocked = ['taken_down', 'pending_appeal', 'denied_appeal'].includes(status)
        const canAppeal = status === 'taken_down' && takedown?.appeal_status === 'none'
        const appealPending = status === 'pending_appeal' || takedown?.appeal_status === 'pending'
        const appealDenied = status === 'denied_appeal' || takedown?.appeal_status === 'denied'

        // Scheduled wipe date
        const wipeDate = takedown?.scheduled_wipe_at
          ? new Date(takedown.scheduled_wipe_at).toLocaleDateString('en-JM', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : null

        return (
          <div key={portfolio.id} style={{
            background: 'var(--surface)',
            border: `1px solid ${isLocked ? statusConfig.bg : 'var(--border)'}`,
            borderRadius: 12, overflow: 'hidden'
          }}>

            {/* Warning banner */}
            {activeWarning && (
            <div style={{
                background: '#78350f', padding: '14px 20px',
                borderBottom: '1px solid #92400e'
            }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fcd34d', marginBottom: 4 }}>
                ⚠ Active Warning from Admin
                </p>
                <p style={{ fontSize: 13, color: '#fde68a', marginBottom: 4 }}>
                Reason: {activeWarning.reason}
                </p>
                <p style={{ fontSize: 12, color: '#d97706', marginBottom: 12 }}>
                Expires {new Date(activeWarning.expires_at).toLocaleDateString('en-JM', {
                    month: 'long', day: 'numeric', year: 'numeric'
                })} · Your portfolio remains public during this period.
                </p>

                {/* Counter statement */}
                {!activeWarning.counter_statement ? (
                <div>
                    <p style={{ fontSize: 12, color: '#fcd34d', marginBottom: 8 }}>
                    You may submit a counter statement to let the admin know you've reviewed and addressed the issue.
                    </p>
                    <textarea
                    placeholder="I've reviewed the warning and made the following changes..."
                    value={counterText[activeWarning.id] ?? ''}
                    onChange={e => setCounterText(prev => ({ ...prev, [activeWarning.id]: e.target.value }))}
                    style={{
                        width: '100%', padding: '8px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #92400e',
                        borderRadius: 6, color: '#fff',
                        fontSize: 13, resize: 'vertical',
                        minHeight: 72, fontFamily: 'var(--font-body)'
                    }}
                    />
                    <button
                    onClick={() => submitCounter(activeWarning.id)}
                    disabled={!counterText[activeWarning.id]?.trim()}
                    style={{
                        marginTop: 8, padding: '8px 16px',
                        background: '#92400e', color: '#fde68a',
                        border: 'none', borderRadius: 6,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        opacity: !counterText[activeWarning.id]?.trim() ? 0.5 : 1
                    }}
                    >
                    Submit Counter Statement
                    </button>
                </div>
                ) : (
                <div style={{
                    background: 'rgba(0,0,0,0.2)', borderRadius: 6,
                    padding: '10px 14px'
                }}>
                    <p style={{ fontSize: 12, color: '#fcd34d', fontWeight: 600, marginBottom: 4 }}>
                    ✓ Counter statement submitted
                    </p>
                    <p style={{ fontSize: 13, color: '#fde68a', fontStyle: 'italic' }}>
                    "{activeWarning.counter_statement}"
                    </p>
                </div>
                )}
            </div>
            )}

            {/* Taken down banner */}
            {status === 'taken_down' && takedown && (
              <div style={{
                background: '#7f1d1d', padding: '14px 20px',
                borderBottom: '1px solid #991b1b'
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>
                  ⚠ Portfolio taken down by admin
                </p>
                <p style={{ fontSize: 13, color: '#fca5a5', marginBottom: 10 }}>
                  Reason: {takedown.reason}
                </p>
                {canAppeal && (
                  <>
                    <p style={{ fontSize: 12, color: '#fca5a5', marginBottom: 8 }}>
                      You may submit one appeal. This decision is final once reviewed.
                    </p>
                    <textarea
                      placeholder="Write your appeal statement..."
                      value={appealText[portfolio.id] ?? ''}
                      onChange={e => setAppealText(prev => ({ ...prev, [portfolio.id]: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 12px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid #991b1b',
                        borderRadius: 6, color: '#fff',
                        fontSize: 13, resize: 'vertical',
                        minHeight: 80, fontFamily: 'var(--font-body)'
                      }}
                    />
                    <button
                      onClick={() => submitAppeal(portfolio.id, takedown.id)}
                      disabled={appealingId === portfolio.id || !appealText[portfolio.id]?.trim()}
                      style={{
                        marginTop: 8, padding: '8px 16px',
                        background: '#991b1b', color: '#fff',
                        border: 'none', borderRadius: 6,
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        opacity: !appealText[portfolio.id]?.trim() ? 0.5 : 1
                      }}
                    >
                      {appealingId === portfolio.id ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Pending appeal banner */}
            {appealPending && (
              <div style={{
                background: '#1e3a5f', padding: '12px 20px',
                borderBottom: '1px solid #1e40af'
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 4 }}>
                  ⏳ Appeal under review
                </p>
                <p style={{ fontSize: 13, color: '#bfdbfe' }}>
                  Your appeal has been submitted and is awaiting admin review.
                </p>
                {takedown?.appeal_message && (
                  <p style={{ fontSize: 12, color: '#93c5fd', marginTop: 6, fontStyle: 'italic' }}>
                    Your statement: "{takedown.appeal_message}"
                  </p>
                )}
              </div>
            )}

            {/* Denied appeal banner */}
            {appealDenied && (
              <div style={{
                background: '#831843', padding: '14px 20px',
                borderBottom: '1px solid #9d174d'
              }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#f9a8d4', marginBottom: 4 }}>
                  ✗ Appeal denied — decision is final
                </p>
                <p style={{ fontSize: 13, color: '#fbcfe8' }}>
                  Takedown reason: {takedown?.reason}
                </p>
                {takedown?.appeal_message && (
                  <p style={{ fontSize: 12, color: '#f9a8d4', marginTop: 4, fontStyle: 'italic' }}>
                    Your appeal: "{takedown.appeal_message}"
                  </p>
                )}
                {wipeDate && (
                  <p style={{ fontSize: 12, color: '#f472b6', marginTop: 8, fontWeight: 600 }}>
                    ⚠ This portfolio and all associated data will be permanently deleted on {wipeDate}.
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
                  fontSize: 16, fontWeight: 700, marginBottom: 6
                }}>
                  {portfolio.title}
                </h3>

                {/* Status badge */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 100,
                    fontSize: 11, fontWeight: 600,
                    background: statusConfig.bg,
                    color: statusConfig.color
                  }}>
                    {statusConfig.label}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 100,
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${visConfig.color}`,
                    color: visConfig.color
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: visConfig.color, display: 'inline-block'
                    }} />
                    {visConfig.label}
                  </span>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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

                {status === 'active' && (
                  <>
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
                  </>
                )}

                {/* Only allow delete if not pending appeal or denied */}
                {!['pending_appeal', 'denied_appeal'].includes(status) && (
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
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}