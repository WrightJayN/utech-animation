'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'

export default function SearchAndFilter({ tags, activeTag, query, years, activeYear }: {
  tags: any[]
  activeTag: string | null
  query: string | null
  years: number[]
  activeYear: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchMode, setSearchMode] = useState<'portfolios' | 'profiles'>('portfolios')

  const navigate = (tag: string | null, q: string | null, year: number | null, mode = searchMode) => {
    const params = new URLSearchParams()
    if (tag) params.set('tag', tag)
    if (q) params.set('q', q)
    if (year) params.set('year', year.toString())
    if (mode === 'profiles') params.set('mode', 'profiles')
    startTransition(() => router.push(`/?${params.toString()}`))
  }

  return (
    <div>
      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: 4, justifyContent: 'center',
        marginBottom: 16
      }}>
        {(['portfolios', 'profiles'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => {
              setSearchMode(mode)
              navigate(activeTag, query, activeYear, mode)
            }}
            style={{
              padding: '6px 16px', borderRadius: 100,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              border: `1.5px solid ${searchMode === mode ? 'var(--accent)' : 'var(--border)'}`,
              background: searchMode === mode ? 'var(--accent)' : 'transparent',
              color: searchMode === mode ? '#fff' : 'var(--muted)',
              textTransform: 'capitalize'
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ maxWidth: 480, margin: '0 auto 24px', position: 'relative' }}>
        <input
          defaultValue={query ?? ''}
          placeholder={searchMode === 'profiles' ? 'Search students...' : 'Search portfolios...'}
          onChange={e => navigate(activeTag, e.target.value || null, activeYear)}
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

      {/* Only show year + tag filters in portfolio mode */}
      {searchMode === 'portfolios' && (
        <>
          {years.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              justifyContent: 'center', marginBottom: 16
            }}>
              <button
                onClick={() => navigate(activeTag, query, null)}
                style={{
                  padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${!activeYear ? 'var(--accent)' : 'var(--border)'}`,
                  background: !activeYear ? 'var(--accent)' : 'transparent',
                  color: !activeYear ? '#fff' : 'var(--muted)', cursor: 'pointer'
                }}
              >
                All Years
              </button>
              {years.map(year => {
                const active = activeYear === year
                return (
                  <button
                    key={year}
                    onClick={() => navigate(activeTag, query, year)}
                    style={{
                      padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--muted)', cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            justifyContent: 'center', marginBottom: 48
          }}>
            {[{ name: 'All', value: null }, ...tags.map(t => ({ name: t.name, value: t.name }))].map(tag => {
              const active = tag.value === activeTag
              return (
                <button
                  key={tag.name}
                  onClick={() => navigate(tag.value, query, activeYear)}
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
        </>
      )}

      {searchMode === 'profiles' && <div style={{ marginBottom: 48 }} />}
    </div>
  )
}