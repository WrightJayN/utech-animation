import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Lightbox from '@/components/ui/Lightbox'
import LikesAndComments from '@/components/ui/LikesAndComments'

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params

  const { data: portfolio } = await supabase
  .from('portfolios')
  .select(`...`)
  .eq('slug', slug)
  .eq('status', 'active')        // ← replaces is_public check
  .neq('visibility', 'private')  // ← blocks private from public view
  .single()

  if (!portfolio) notFound()

  // Fetch like + comment counts for display without auth
  const { count: likeCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('portfolio_id', portfolio.id)

  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('portfolio_id', portfolio.id)

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
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
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              ♥ {likeCount ?? 0} likes
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              💬 {commentCount ?? 0} comments
            </span>
          </div>
        </div>

        {/* Owner card — now a clickable link */}
        <Link href={`/profile/${owner?.username}`} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          minWidth: 200, transition: 'border-color 0.15s'
        }}
          onMouseEnter={undefined}
        >
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
            <p style={{ color: 'var(--accent)', fontSize: 13 }}>
              View profile →
            </p>
          </div>
        </Link>
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

      {/* Media */}
      {portfolio.portfolio_items && portfolio.portfolio_items.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 700, marginBottom: 24
          }}>
            Work
          </h2>
          <Lightbox items={portfolio.portfolio_items.sort((a: any, b: any) => a.display_order - b.display_order)} />
        </div>
      )}

      {/* Posted date */}
      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 32 }}>
        Published {new Date(portfolio.created_at).toLocaleDateString('en-JM', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </p>

      {/* Likes + Comments */}
      <LikesAndComments portfolioId={portfolio.id} />
    </div>
  )
}