import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

export default async function PortfolioPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient()

  // Fetch portfolio + owner profile
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select(`
      *,
      profiles (full_name, username, bio, avatar_url, year_of_study),
      portfolio_tags (
        tags (name)
      )
    `)
    .eq('slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!portfolio) notFound()

  const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []
  const owner = portfolio.profiles as any

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>

      {/* Cover Image */}
      {portfolio.cover_image_url && (
        <div style={{
          width: '100%', height: 480, borderRadius: 16,
          overflow: 'hidden', marginBottom: 40
        }}>
          <img
            src={portfolio.cover_image_url}
            alt={portfolio.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 24, flexWrap: 'wrap',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40, fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 12
          }}>
            {portfolio.title}
          </h1>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((tag: string) => (
              <span key={tag} style={{
                padding: '6px 14px', borderRadius: 100,
                fontSize: 12, fontWeight: 500,
                border: '1.5px solid var(--accent)',
                color: 'var(--accent)'
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Owner card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          minWidth: 200
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, flexShrink: 0
          }}>
            {owner?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{owner?.full_name}</p>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              {owner?.year_of_study ?? 'UTech Animation Student'}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0' }} />

      {/* Description */}
      {portfolio.description && (
        <p style={{
          fontSize: 17, lineHeight: 1.75,
          color: '#d4d4d8', maxWidth: 680
        }}>
          {portfolio.description}
        </p>
      )}

      {/* Posted date */}
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 32 }}>
        Published {new Date(portfolio.created_at).toLocaleDateString('en-JM', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </p>

    </div>
  )
}