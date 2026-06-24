'use client'

import Link from 'next/link'

export default function PortfolioCard({ portfolio }: { portfolio: any }) {
  const owner = portfolio.profiles
  const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []

  return (
    <Link
      href={`/portfolio/${portfolio.slug}`}
      style={{
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
      }}
    >
      <div style={{ height: 200, overflow: 'hidden', background: 'var(--surface-2)' }}>
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
            justifyContent: 'center', fontSize: 40
          }}>🎨</div>
        )}
      </div>

      <div style={{ padding: '16px 20px 20px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 17, fontWeight: 700,
          marginBottom: 6, lineHeight: 1.3
        }}>
          {portfolio.title}
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
          {owner?.full_name}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {tags.slice(0, 2).map((tag: string) => (
            <span key={tag} style={{
              padding: '4px 10px', borderRadius: 100,
              fontSize: 11, fontWeight: 500,
              background: 'var(--surface-2)',
              color: 'var(--muted)',
              border: '1px solid var(--border)'
            }}>
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{
              padding: '4px 10px', borderRadius: 100,
              fontSize: 11, color: 'var(--muted)',
              border: '1px solid var(--border)'
            }}>
              +{tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}