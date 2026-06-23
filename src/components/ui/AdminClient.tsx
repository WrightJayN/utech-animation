'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const TABS = ['All', 'Active', 'Taken Down', 'Pending Appeals', 'Denied Appeals', 'Reports']

const REPORT_CATEGORY_LABELS: Record<string, string> = {
  inappropriate_content: 'Inappropriate Content',
  copyright: 'Copyright'
}

const REPORT_STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  reviewed:  '#6366f1',
  actioned:  '#10b981',
  dismissed: '#71717a'
}

const WARNING_DURATIONS = [
  { days: 3,  label: '3 Days' },
  { days: 7,  label: '1 Week' },
  { days: 14, label: '2 Weeks' },
]

export default function AdminClient({ portfolios, adminId, pendingAppeals, pendingReports }: {
  portfolios: any[]
  adminId: string
  pendingAppeals: number
  pendingReports: number
}) {
  const [list, setList] = useState(portfolios)
  const [activeTab, setActiveTab] = useState('All')
  const [reasonText, setReasonText] = useState<Record<string, string>>({})
  const [warningReason, setWarningReason] = useState<Record<string, string>>({})
  const [warningDays, setWarningDays] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeYear, setActiveYear] = useState<number | null>(null)
  const [reportFilter, setReportFilter] = useState('all')
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  const years = [...new Set(list.map(p => p.upload_year).filter(Boolean))].sort((a, b) => b - a) as number[]

  const filtered = list.filter(p => {
    if (activeTab === 'Active' && p.status !== 'active') return false
    if (activeTab === 'Taken Down' && p.status !== 'taken_down') return false
    if (activeTab === 'Pending Appeals' && p.status !== 'pending_appeal') return false
    if (activeTab === 'Denied Appeals' && p.status !== 'denied_appeal') return false
    if (activeTab === 'Reports') {
      if (!p.reports?.length) return false
      if (reportFilter !== 'all' && !p.reports?.some((r: any) => r.status === reportFilter)) return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!p.title?.toLowerCase().includes(q) && !p.profiles?.full_name?.toLowerCase().includes(q)) return false
    }
    if (activeYear && p.upload_year !== activeYear) return false
    return true
  })

  const issueWarning = async (portfolioId: string) => {
    const reason = warningReason[portfolioId]?.trim()
    const days = warningDays[portfolioId] ?? 3
    if (!reason) { alert('Please provide a reason for the warning.'); return }
    setLoading(portfolioId)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    await supabase.from('warnings').insert({
      portfolio_id: portfolioId,
      admin_id: adminId,
      reason,
      duration_days: days,
      expires_at: expiresAt.toISOString()
    })

    // Portfolio status stays active — warning does NOT change status or visibility
    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      warnings: [...(p.warnings ?? []), {
        id: crypto.randomUUID(),
        reason, duration_days: days,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        reviewed: false,
        counter_statement: null
      }]
    } : p))
    setWarningReason(prev => ({ ...prev, [portfolioId]: '' }))
    setLoading(null)
    router.refresh()
  }

  const clearWarning = async (warningId: string, portfolioId: string) => {
    await supabase.from('warnings').update({
      reviewed: true,
      review_outcome: 'cleared'
    }).eq('id', warningId)

    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      warnings: p.warnings.map((w: any) =>
        w.id === warningId ? { ...w, reviewed: true, review_outcome: 'cleared' } : w
      )
    } : p))
  }

  const takeDown = async (portfolioId: string) => {
    const reason = reasonText[portfolioId]?.trim()
    if (!reason) { alert('Please provide a reason for the takedown.'); return }
    setLoading(portfolioId)

    await supabase.from('portfolios').update({ status: 'taken_down' }).eq('id', portfolioId)
    await supabase.from('takedowns').insert({
      portfolio_id: portfolioId,
      admin_id: adminId,
      reason,
      appeal_status: 'none'
    })

    setList(list.map(p => p.id === portfolioId ? {
      ...p, status: 'taken_down',
      takedowns: [{ id: crypto.randomUUID(), reason, appeal_status: 'none', created_at: new Date().toISOString() }]
    } : p))
    setReasonText(prev => ({ ...prev, [portfolioId]: '' }))
    setLoading(null)
    router.refresh()
  }

  const approveAppeal = async (portfolioId: string, takedownId: string) => {
    setLoading(portfolioId)
    await supabase.from('portfolios').update({ status: 'active' }).eq('id', portfolioId)
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
    router.refresh()
  }

  const denyAppeal = async (portfolioId: string, takedownId: string) => {
    setLoading(portfolioId)
    await supabase.from('takedowns')
      .update({ appeal_status: 'denied' })
      .eq('id', takedownId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p, status: 'denied_appeal',
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId ? { ...t, appeal_status: 'denied' } : t
      )
    } : p))
    setLoading(null)
    router.refresh()
  }

  const resetDeniedAppeal = async (portfolioId: string, takedownId: string) => {
    if (!confirm('Reset this denied appeal to active? Only do this if a mistake was made.')) return
    setLoading(portfolioId)
    await supabase.from('portfolios').update({ status: 'active' }).eq('id', portfolioId)
    await supabase.from('takedowns')
      .update({
        appeal_status: 'approved',
        appeal_denied_at: null,
        scheduled_wipe_at: null,
        resolved_at: new Date().toISOString()
      })
      .eq('id', takedownId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p, status: 'active',
      takedowns: p.takedowns.map((t: any) =>
        t.id === takedownId ? {
          ...t, appeal_status: 'approved',
          appeal_denied_at: null, scheduled_wipe_at: null
        } : t
      )
    } : p))
    setLoading(null)
    router.refresh()
  }

  const updateReportStatus = async (reportId: string, portfolioId: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', reportId)
    setList(list.map(p => p.id === portfolioId ? {
      ...p,
      reports: p.reports.map((r: any) => r.id === reportId ? { ...r, status } : r)
    } : p))
  }

  const toggleReports = (portfolioId: string) => {
    setExpandedReports(prev => {
      const next = new Set(prev)
      next.has(portfolioId) ? next.delete(portfolioId) : next.add(portfolioId)
      return next
    })
  }

  return (
    <div>
      {/* Search + Year */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or student name..."
            style={{
              width: '100%', padding: '10px 40px 10px 14px',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 14,
              outline: 'none', fontFamily: 'var(--font-body)'
            }}
          />
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        </div>
        <select
          value={activeYear ?? ''}
          onChange={e => setActiveYear(e.target.value ? parseInt(e.target.value) : null)}
          style={{
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            color: activeYear ? 'var(--text)' : 'var(--muted)', fontSize: 14, cursor: 'pointer'
          }}
        >
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
            background: activeTab === tab ? '#7c3aed' : 'var(--surface)',
            color: activeTab === tab ? '#fff' : 'var(--muted)'
          }}>
            {tab}
            {tab === 'Pending Appeals' && pendingAppeals > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 11 }}>
                {pendingAppeals}
              </span>
            )}
            {tab === 'Reports' && pendingReports > 0 && (
              <span style={{ marginLeft: 6, background: '#f59e0b', color: '#fff', borderRadius: 100, padding: '1px 6px', fontSize: 11 }}>
                {pendingReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report sub-filter */}
      {activeTab === 'Reports' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'pending', 'reviewed', 'actioned', 'dismissed'].map(s => (
            <button key={s} onClick={() => setReportFilter(s)} style={{
              padding: '6px 12px', borderRadius: 100,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${reportFilter === s ? 'var(--accent)' : 'var(--border)'}`,
              background: reportFilter === s ? 'var(--accent)' : 'transparent',
              color: reportFilter === s ? '#fff' : 'var(--muted)',
              textTransform: 'capitalize'
            }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
        {filtered.length} result{filtered.length !== 1 ? 's' : ''}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filtered.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14, padding: '32px 0' }}>
            No portfolios in this category.
          </p>
        )}

        {filtered.map(portfolio => {
          const owner = portfolio.profiles
          const takedown = portfolio.takedowns?.[0] ?? null
          const status = portfolio.status ?? 'active'
          const isTakenDown = status === 'taken_down'
          const isPendingAppeal = status === 'pending_appeal'
          const isDeniedAppeal = status === 'denied_appeal'
          const reports = (portfolio.reports ?? []).sort((a: any, b: any) => {
            const order = ['pending', 'reviewed', 'actioned', 'dismissed']
            return order.indexOf(a.status) - order.indexOf(b.status)
          })
          const pendingReportCount = reports.filter((r: any) => r.status === 'pending').length
          const reportsExpanded = expandedReports.has(portfolio.id)
          const wipeDate = takedown?.scheduled_wipe_at
            ? new Date(takedown.scheduled_wipe_at).toLocaleDateString('en-JM', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
            : null

          // Warnings that need review: expired or have counter statement, not yet reviewed
          const warningsNeedingReview = (portfolio.warnings ?? []).filter((w: any) =>
            !w.reviewed && (
              new Date(w.expires_at) < new Date() ||
              w.counter_statement
            )
          )

          return (
            <div key={portfolio.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${
                isDeniedAppeal ? '#831843'
                : isPendingAppeal ? '#1e3a5f'
                : isTakenDown ? '#7f1d1d'
                : warningsNeedingReview.length > 0 ? '#78350f'
                : pendingReportCount > 0 ? '#78350f'
                : 'var(--border)'
              }`,
              borderRadius: 12, overflow: 'hidden'
            }}>

              {/* Warning review cards */}
              {warningsNeedingReview.map((w: any) => (
                <div key={w.id} style={{
                  background: '#422006', padding: '14px 20px',
                  borderBottom: '1px solid #92400e'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fcd34d', marginBottom: 4 }}>
                    🟡 Warning Review Required
                  </p>
                  <p style={{ fontSize: 13, color: '#fde68a', marginBottom: 8 }}>
                    Warning issued: {w.reason}
                  </p>
                  {w.counter_statement ? (
                    <div style={{
                      background: 'rgba(0,0,0,0.2)', borderRadius: 6,
                      padding: '10px 14px', marginBottom: 10
                    }}>
                      <p style={{ fontSize: 12, color: '#fcd34d', fontWeight: 600, marginBottom: 4 }}>
                        Student's counter statement:
                      </p>
                      <p style={{ fontSize: 13, color: '#fde68a', fontStyle: 'italic' }}>
                        "{w.counter_statement}"
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: '#d97706', marginBottom: 10 }}>
                      Warning duration has expired. No counter statement was submitted.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => clearWarning(w.id, portfolio.id)}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#14532d', color: '#86efac',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      ✓ Green Light — Acceptable
                    </button>
                    <button
                      onClick={() => setReasonText(prev => ({ ...prev, [portfolio.id]: w.reason }))}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#7f1d1d', color: '#fca5a5',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      Fill Takedown from Warning
                    </button>
                  </div>
                </div>
              ))}

              {/* Pending appeal banner */}
              {isPendingAppeal && takedown && (
                <div style={{
                  background: '#1e3a5f', padding: '14px 20px',
                  borderBottom: '1px solid #1e40af'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 6 }}>
                    ⚡ Student has submitted an appeal
                  </p>
                  <div style={{
                    background: 'rgba(0,0,0,0.2)', borderRadius: 6,
                    padding: '10px 14px', marginBottom: 10
                  }}>
                    <p style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>
                      Original takedown reason:
                    </p>
                    <p style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 8 }}>{takedown.reason}</p>
                    <p style={{ fontSize: 12, color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>
                      Student's appeal statement:
                    </p>
                    <p style={{ fontSize: 13, color: '#bfdbfe', fontStyle: 'italic' }}>
                      "{takedown.appeal_message}"
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => approveAppeal(portfolio.id, takedown.id)}
                      disabled={loading === portfolio.id}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#10b981', color: '#fff',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      ✓ Approve — Restore
                    </button>
                    <button
                      onClick={() => denyAppeal(portfolio.id, takedown.id)}
                      disabled={loading === portfolio.id}
                      style={{
                        padding: '7px 14px', borderRadius: 6,
                        fontSize: 13, fontWeight: 600,
                        background: '#831843', color: '#fff',
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      ✗ Deny — Final Decision
                    </button>
                  </div>
                </div>
              )}

              {/* Denied appeal banner */}
              {isDeniedAppeal && takedown && (
                <div style={{
                  background: '#831843', padding: '14px 20px',
                  borderBottom: '1px solid #9d174d'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#f9a8d4', marginBottom: 4 }}>
                    ✗ Appeal denied
                  </p>
                  {wipeDate && (
                    <p style={{ fontSize: 12, color: '#fbcfe8', marginBottom: 10 }}>
                      Scheduled for permanent deletion on {wipeDate}
                    </p>
                  )}
                  <button
                    onClick={() => resetDeniedAppeal(portfolio.id, takedown.id)}
                    disabled={loading === portfolio.id}
                    style={{
                      padding: '7px 14px', borderRadius: 6,
                      fontSize: 13, fontWeight: 500,
                      background: 'rgba(0,0,0,0.3)', color: '#f9a8d4',
                      border: '1px solid #9d174d', cursor: 'pointer'
                    }}
                  >
                    Reset to Active (Admin Override)
                  </button>
                </div>
              )}

              {/* Reports card spread */}
              {reports.length > 0 && reportsExpanded && (
                <div style={{
                  background: '#1c1008', padding: '14px 20px',
                  borderBottom: '1px solid #92400e'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 12 }}>
                    Reports ({reports.length})
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 10
                  }}>
                    {reports.map((report: any) => (
                      <div key={report.id} style={{
                        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                        padding: '12px 14px',
                        border: `1px solid ${REPORT_STATUS_COLORS[report.status]}30`,
                        opacity: ['actioned', 'dismissed'].includes(report.status) ? 0.6 : 1
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: REPORT_STATUS_COLORS[report.status],
                            textTransform: 'capitalize'
                          }}>
                            {report.status}
                          </span>
                          <span style={{ fontSize: 11, color: '#d97706' }}>
                            {new Date(report.created_at).toLocaleDateString('en-JM', {
                              month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>
                          {REPORT_CATEGORY_LABELS[report.category]}
                        </p>
                        {report.details && (
                          <p style={{ fontSize: 12, color: '#d97706', marginBottom: 8 }}>
                            {report.details}
                          </p>
                        )}
                        <select
                          value={report.status}
                          onChange={e => updateReportStatus(report.id, portfolio.id, e.target.value)}
                          style={{
                            width: '100%', padding: '5px 8px', borderRadius: 6,
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            color: 'var(--text)', fontSize: 12, cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="actioned">Actioned</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                    ))}
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
                    <img src={portfolio.cover_image_url} alt={portfolio.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: 8, marginBottom: 4, flexWrap: 'wrap'
                  }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
                      {portfolio.title}
                    </h3>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      fontSize: 11, fontWeight: 600,
                      background: isDeniedAppeal ? '#831843'
                        : isPendingAppeal ? '#1e3a5f'
                        : isTakenDown ? '#7f1d1d'
                        : '#14532d',
                      color: isDeniedAppeal ? '#f9a8d4'
                        : isPendingAppeal ? '#93c5fd'
                        : isTakenDown ? '#fca5a5'
                        : '#86efac'
                    }}>
                      {status.replace(/_/g, ' ')}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: 100,
                      fontSize: 11, color: 'var(--muted)',
                      border: '1px solid var(--border)'
                    }}>
                      {portfolio.visibility}
                    </span>
                    {portfolio.upload_year && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 100,
                        fontSize: 11, color: 'var(--muted)',
                        border: '1px solid var(--border)'
                      }}>
                        {portfolio.upload_year}
                      </span>
                    )}
                    {warningsNeedingReview.length > 0 && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 100,
                        fontSize: 11, fontWeight: 600,
                        background: '#422006', color: '#fcd34d'
                      }}>
                        🟡 {warningsNeedingReview.length} review{warningsNeedingReview.length > 1 ? 's' : ''} needed
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    By{' '}
                    <Link href={`/profile/${owner?.username}`} style={{ color: 'var(--accent)' }}>
                      {owner?.full_name}
                    </Link>
                  </p>
                  {takedown && (isTakenDown || isDeniedAppeal) && (
                    <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
                      Takedown reason: {takedown.reason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 210 }}>
                  <Link href={`/portfolio/${portfolio.slug}`} target="_blank" style={{
                    padding: '8px 14px', borderRadius: 8, textAlign: 'center',
                    fontSize: 13, fontWeight: 500,
                    border: '1px solid var(--border)', color: 'var(--muted)'
                  }}>
                    View Portfolio ↗
                  </Link>

                  {reports.length > 0 && (
                    <button onClick={() => toggleReports(portfolio.id)} style={{
                      padding: '8px 14px', borderRadius: 8,
                      fontSize: 13, fontWeight: 500,
                      border: `1px solid ${pendingReportCount > 0 ? '#92400e' : 'var(--border)'}`,
                      background: 'transparent',
                      color: pendingReportCount > 0 ? '#fbbf24' : 'var(--muted)',
                      cursor: 'pointer'
                    }}>
                      {reportsExpanded ? 'Hide Reports' : `See Reports (${reports.length})`}
                      {pendingReportCount > 0 && (
                        <span style={{
                          marginLeft: 6, background: '#f59e0b', color: '#fff',
                          borderRadius: 100, padding: '1px 6px', fontSize: 11
                        }}>{pendingReportCount}</span>
                      )}
                    </button>
                  )}

                  {/* Warning — only for active portfolios */}
                  {status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {WARNING_DURATIONS.map(d => (
                          <button key={d.days}
                            onClick={() => setWarningDays(prev => ({ ...prev, [portfolio.id]: d.days }))}
                            style={{
                              flex: 1, padding: '5px', borderRadius: 6,
                              fontSize: 11, fontWeight: 500, cursor: 'pointer',
                              border: `1px solid ${(warningDays[portfolio.id] ?? 3) === d.days ? '#f59e0b' : 'var(--border)'}`,
                              background: (warningDays[portfolio.id] ?? 3) === d.days ? 'rgba(245,158,11,0.15)' : 'transparent',
                              color: (warningDays[portfolio.id] ?? 3) === d.days ? '#f59e0b' : 'var(--muted)'
                            }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Warning reason (required)..."
                        value={warningReason[portfolio.id] ?? ''}
                        onChange={e => setWarningReason(prev => ({ ...prev, [portfolio.id]: e.target.value }))}
                        rows={2}
                        style={{
                          padding: '8px 12px', borderRadius: 6,
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 12,
                          resize: 'none', fontFamily: 'var(--font-body)'
                        }}
                      />
                      <button
                        onClick={() => issueWarning(portfolio.id)}
                        disabled={loading === portfolio.id || !warningReason[portfolio.id]?.trim()}
                        style={{
                          padding: '7px 14px', borderRadius: 8,
                          fontSize: 13, fontWeight: 500,
                          background: 'transparent', border: '1px solid #92400e',
                          color: '#f59e0b', cursor: 'pointer',
                          opacity: !warningReason[portfolio.id]?.trim() ? 0.5 : 1
                        }}
                      >
                        Issue Warning
                      </button>
                    </div>
                  )}

                  {/* Takedown — for active portfolios */}
                  {status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <textarea
                        placeholder="Reason for takedown (required)..."
                        value={reasonText[portfolio.id] ?? ''}
                        onChange={e => setReasonText(prev => ({ ...prev, [portfolio.id]: e.target.value }))}
                        rows={2}
                        style={{
                          padding: '8px 12px', borderRadius: 6,
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
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
                          background: 'transparent', border: '1px solid #7f1d1d',
                          color: '#ef4444', cursor: 'pointer',
                          opacity: !reasonText[portfolio.id]?.trim() ? 0.5 : 1
                        }}
                      >
                        {loading === portfolio.id ? '...' : 'Take Down'}
                      </button>
                    </div>
                  )}

                  {/* Restore — for taken down without pending appeal */}
                  {isTakenDown && !isPendingAppeal && takedown && (
                    <button
                      onClick={() => approveAppeal(portfolio.id, takedown.id)}
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
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}