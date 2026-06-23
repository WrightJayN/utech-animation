import { createServerSupabaseClient } from '@/lib/supabase-server'
import { FadeUp, StaggerGrid } from '@/components/ui/AnimatedSection'
import AnimatedCard from '@/components/ui/AnimatedCard'
import SearchAndFilter from '@/components/ui/SearchAndFilter'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ tag?: string; q?: string; year?: string; mode?: string }>
}) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams
  const activeTag = params.tag ?? null
  const query = params.q ?? null
  const activeYear = params.year ? parseInt(params.year) : null
  const mode = params.mode ?? 'portfolios'

  const { data: tags } = await supabase.from('tags').select('*').order('name')

  const { data: yearData } = await supabase
    .from('portfolios').select('upload_year')
    .eq('visibility', 'public').eq('status', 'active')
    .order('upload_year', { ascending: false })
  const years = [...new Set(yearData?.map(p => p.upload_year).filter(Boolean))] as number[]

  // Profile search
  let profiles: any[] = []
  if (mode === 'profiles' && query) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, bio, year_of_study')
      .ilike('full_name', `%${query}%`)
      .limit(20)
    profiles = data ?? []
  }

  // Portfolio search
  let portfolioQuery = supabase
    .from('portfolios')
    .select(`
      id, title, slug, cover_image_url, created_at, upload_year,
      profiles (full_name, username, avatar_url),
      portfolio_tags (tags (name))
    `)
    .eq('visibility', 'public')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (query && mode === 'portfolios') portfolioQuery = portfolioQuery.ilike('title', `%${query}%`)
  if (activeYear) portfolioQuery = portfolioQuery.eq('upload_year', activeYear)

  const { data: portfolios } = await portfolioQuery

  const filtered = activeTag
    ? portfolios?.filter((p: any) =>
        p.portfolio_tags?.some((pt: any) => pt.tags.name === activeTag)
      )
    : portfolios

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 96px' }}>

      {/* Hero */}
      <FadeUp>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <FadeUp delay={0.1}>
            <p style={{
              fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16
            }}>
              University of Technology, Jamaica
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 72px)',
              fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: 1.05, marginBottom: 20
            }}>
              Animation Student<br />
              <span style={{ color: 'var(--accent)' }}>Portfolio Gallery</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.3}>
            <p style={{ color: 'var(--muted)', fontSize: 18, maxWidth: 480, margin: '0 auto' }}>
              Discover creative work from UTech's animation program.
              Character design, illustration, 3D, and more.
            </p>
          </FadeUp>
        </div>
      </FadeUp>

      <SearchAndFilter
        tags={tags ?? []}
        activeTag={activeTag}
        query={query}
        years={years}
        activeYear={activeYear}
      />

      {/* Profile search results */}
      {mode === 'profiles' && (
        <div style={{ marginBottom: 48 }}>
          {query ? (
            <>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
                {profiles.length} student{profiles.length !== 1 ? 's' : ''} matching "{query}"
              </p>
              {profiles.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16
                }}>
                  {profiles.map(profile => (
                    <Link
                      key={profile.id}
                      href={`/profile/${profile.username}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '16px 20px',
                        transition: 'border-color 0.15s'
                      }}
                    >
                      <Avatar url={profile.avatar_url} name={profile.full_name} size={48} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                          {profile.full_name}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>
                          @{profile.username}
                        </p>
                        {profile.year_of_study && (
                          <p style={{ fontSize: 12, color: 'var(--accent)' }}>
                            {profile.year_of_study}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '64px 24px',
                  color: 'var(--muted)'
                }}>
                  <p style={{ fontSize: 36, marginBottom: 12 }}>👤</p>
                  <p>No students found matching "{query}"</p>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
              Type a name to search for students
            </p>
          )}
        </div>
      )}

      {/* Portfolio results — only shown in portfolios mode */}
      {mode === 'portfolios' && (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            {filtered?.length ?? 0} portfolio{filtered?.length !== 1 ? 's' : ''}
            {activeTag ? ` in ${activeTag}` : ''}
            {activeYear ? ` from ${activeYear}` : ''}
            {query ? ` matching "${query}"` : ''}
          </p>

          {filtered && filtered.length > 0 ? (
            <StaggerGrid style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24
            }}>
              {filtered.map((portfolio: any) => (
                <AnimatedCard key={portfolio.id} portfolio={portfolio} />
              ))}
            </StaggerGrid>
          ) : (
            <div style={{
              textAlign: 'center', padding: '80px 24px',
              color: 'var(--muted)'
            }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>🎨</p>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No portfolios yet</p>
              <p style={{ fontSize: 14 }}>
                {activeTag
                  ? `No portfolios tagged with "${activeTag}" yet.`
                  : 'Be the first to upload your work.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}