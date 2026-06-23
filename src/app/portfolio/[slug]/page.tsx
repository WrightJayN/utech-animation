import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Lightbox from '@/components/ui/Lightbox'
import LikesAndComments from '@/components/ui/LikesAndComments'
import ReportButton from '@/components/ui/ReportButton'
import Avatar from '@/components/ui/Avatar'

export default async function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select(`
      *,
      profiles (id, full_name, username, bio, avatar_url, year_of_study),
      portfolio_tags (tags (name)),
      portfolio_items (id, type, url, caption, display_order),
      takedowns (id, reason, appeal_status, appeal_message, appeal_denied_at, scheduled_wipe_at),
      warnings (id, reason, duration_days, expires_at, created_at)
    `)
    .eq('slug', slug)
    .neq('visibility', 'private')
    .not('status', 'in', '("taken_down","denied_appeal")')
    .single()

  if (!portfolio) notFound()

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
  const activeWarning = portfolio.warnings?.find((w: any) => new Date(w.expires_at) > new Date())

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>

      {/* Active warning banner (visible to owner via direct link) */}
      {activeWarning && (
        <div style={{
          background: '#78350f', border: '1px solid #92400e',
          borderRadius: 10, padding: '14px 20px', marginBottom: 24
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fcd34d', marginBottom: 4 }}>
            ⚠ This portfolio has an active warning
          </p>
          <p style={{ fontSize: 13, color: '#fde68a' }}>
            Reason: {activeWarning.reason} · Expires{' '}
            {new Date(activeWarning.expires_at).toLocaleDateString('en-JM', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </p>
        </div>
      )}

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
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>♥ {likeCount ?? 0} likes</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>💬 {commentCount ?? 0} comments</span>
          </div>
        </div>

        {/* Owner card */}
        <Link href={`/profile/${owner?.username}`} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
          minWidth: 200, transition: 'border-color 0.15s'
        }}>
          <Avatar url={owner?.avatar_url} name={owner?.full_name} size={44} />
          <div>
            <p style={{ fontWeight: 600, fontSize: 15 }}>{owner?.full_name}</p>
            <p style={{ color: 'var(--accent)', fontSize: 13 }}>View profile →</p>
          </div>
        </Link>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0' }} />

      {portfolio.description && (
        <p style={{ fontSize: 17, lineHeight: 1.75, color: '#d4d4d8', maxWidth: 680 }}>
          {portfolio.description}
        </p>
      )}

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

      <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 32 }}>
        Published {new Date(portfolio.created_at).toLocaleDateString('en-JM', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </p>

      <ReportButton portfolioId={portfolio.id} />
      <LikesAndComments portfolioId={portfolio.id} />
    </div>
  )
}