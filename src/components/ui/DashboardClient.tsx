'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardClient({ portfolios }: { portfolios: any[] }) {
  const [list, setList] = useState(portfolios)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const toggleVisibility = async (id: string, current: boolean) => {
    await supabase
      .from('portfolios')
      .update({ is_public: !current })
      .eq('id', id)

    setList(list.map(p => p.id === id ? { ...p, is_public: !current } : p))
  }

  const deletePortfolio = async (id: string) => {
    if (!confirm('Delete this portfolio? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('portfolios').delete().eq('id', id)
    setList(list.filter(p => p.id !== id))
    setDeleting(null)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map(portfolio => {
        const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []
        return (
          <div key={portfolio.id} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px',
            display: 'flex', gap: 20,
            alignItems: 'center', flexWrap: 'wrap'
          }}>
            {/* Cover thumbnail */}
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
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(portfolio.created_at).toLocaleDateString('en-JM', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </p>
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

              <button
                onClick={() => toggleVisibility(portfolio.id, portfolio.is_public)}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  border: `1px solid ${portfolio.is_public ? 'var(--border)' : 'var(--accent)'}`,
                  background: 'transparent',
                  color: portfolio.is_public ? 'var(--muted)' : 'var(--accent)',
                  cursor: 'pointer'
                }}
              >
                {portfolio.is_public ? 'Hide' : 'Publish'}
              </button>

              <button
                onClick={() => deletePortfolio(portfolio.id)}
                disabled={deleting === portfolio.id}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  border: '1px solid #3f1212',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  opacity: deleting === portfolio.id ? 0.5 : 1
                }}
              >
                {deleting === portfolio.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}