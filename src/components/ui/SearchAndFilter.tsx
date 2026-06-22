'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchAndFilter({ tags, activeTag, query }: {
  tags: any[]
  activeTag: string | null
  query: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (tag: string | null, q: string | null) => {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (q) params.set('q', q)
    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <div>
      {/* Search */}
      <div style={{ maxWidth: 480, margin: '0 auto 32px', position: 'relative' }}>
        <input
          defaultValue={query ?? ''}
          placeholder="Search portfolios..."
          onChange={e => navigate(activeTag, e.target.value || null)}
          style={{
            width: '100%', padding: '13px 48px 13px 18px',
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 10, color: 'var(--text)', fontSize: 15,
            outline: 'none', fontFamily: 'var(--font-body)',
            opacity: isPending ? 0.6 : 1
          }}
        />
        <span style={{
          position: 'absolute', right: 14, top: '50%',
          transform: 'translateY(-50%)', fontSize: 18
        }}>🔍</span>
      </div>

      {/* Tag Filter */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        justifyContent: 'center', marginBottom: 48
      }}>
        {[{ name: 'All', value: null }, ...tags.map(t => ({ name: t.name, value: t.name }))].map(tag => {
          const active = tag.value === activeTag
          return (
            <button
              key={tag.name}
              onClick={() => navigate(tag.value, query)}
              style={{
                padding: '8px 18px', borderRadius: 100,
                fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--muted)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}