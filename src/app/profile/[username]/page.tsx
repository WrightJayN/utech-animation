import { createServerSupabaseClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { StaggerGrid } from '@/components/ui/AnimatedSection'
import AnimatedCard from '@/components/ui/AnimatedCard'

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { username } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select(`
      id, title, slug, cover_image_url, created_at,
      profiles (full_name, username),
      portfolio_tags (tags (name))
    `)
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const { count: totalLikes } = await supabase
    .from('likes')
    .select('*, portfolios!inner(user_id)', { count: 'exact', head: true })
    .eq('portfolios.user_id', profile.id)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>

      {/* Profile Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 28,
        marginBottom: 64, flexWrap: 'wrap'
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'var(--accent)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 800, color: '#fff'
        }}>
          {profile.full_name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 800,
            letterSpacing: '-0.02em', marginBottom: 4
          }}>
            {profile.full_name}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 12 }}>
            @{profile.username}
            {profile.year_of_study && ` · ${profile.year_of_study}`}
            {' · UTech Animation'}
          </p>
          {profile.bio && (
            <p style={{ fontSize: 15, color: '#d4d4d8', maxWidth: 520 }}>
              {profile.bio}
            </p>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            { value: portfolios?.length ?? 0, label: 'Portfolios' },
            { value: totalLikes ?? 0, label: 'Total Likes' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28, fontWeight: 800, lineHeight: 1
              }}>
                {stat.value}
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 40 }} />

      {/* Portfolios */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20, fontWeight: 700, marginBottom: 24
      }}>
        Work
      </h2>

      {portfolios && portfolios.length > 0 ? (
        <StaggerGrid style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 24
        }}>
          {portfolios.map((portfolio: any) => (
            <AnimatedCard key={portfolio.id} portfolio={portfolio} />
          ))}
        </StaggerGrid>
      ) : (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          border: '2px dashed var(--border)', borderRadius: 12,
          color: 'var(--muted)'
        }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🎨</p>
          <p>No public portfolios yet.</p>
        </div>
      )}
    </div>
  )
}