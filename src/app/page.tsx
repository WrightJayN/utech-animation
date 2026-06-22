import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { FadeUp, StaggerGrid } from '@/components/ui/AnimatedSection'
import AnimatedCard from '@/components/ui/AnimatedCard'

export default async function Home({
  searchParams
}: {
  searchParams: { tag?: string; q?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams        // ← await it
  const activeTag = params.tag ?? null
  const query = params.q ?? null

  // Fetch tags for filter bar
  const { data: tags } = await supabase.from('tags').select('*').order('name')

  // Build portfolio query
  let portfolioQuery = supabase
    .from('portfolios')
    .select(`
      id, title, slug, cover_image_url, created_at,
      profiles (full_name, username),
      portfolio_tags (tags (name))
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (query) {
    portfolioQuery = portfolioQuery.ilike('title', `%${query}%`)
  }

  const { data: portfolios } = await portfolioQuery

  // Filter by tag client-side (simpler than a join filter for now)
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

      {/* Search */}
      <form method="GET" style={{ marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
        <div style={{ position: 'relative' }}>
          <input
            name="q"
            defaultValue={query ?? ''}
            placeholder="Search portfolios..."
            style={{
              width: '100%', padding: '13px 48px 13px 18px',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 10, color: 'var(--text)', fontSize: 15,
              outline: 'none', fontFamily: 'var(--font-body)'
            }}
          />
          <button type="submit" style={{
            position: 'absolute', right: 14, top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent', border: 'none',
            cursor: 'pointer', fontSize: 18
          }}>🔍</button>
        </div>
      </form>

      {/* Tag Filter */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8,
        justifyContent: 'center', marginBottom: 48
      }}>
        <Link href="/" style={{
          padding: '8px 18px', borderRadius: 100,
          fontSize: 13, fontWeight: 500,
          border: `1.5px solid ${!activeTag ? 'var(--accent)' : 'var(--border)'}`,
          background: !activeTag ? 'var(--accent)' : 'transparent',
          color: !activeTag ? '#fff' : 'var(--muted)'
        }}>
          All
        </Link>
        {tags?.map((tag: any) => {
          const active = activeTag === tag.name
          return (
            <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`} style={{
              padding: '8px 18px', borderRadius: 100,
              fontSize: 13, fontWeight: 500,
              border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? '#fff' : 'var(--muted)'
            }}>
              {tag.name}
            </Link>
          )
        })}
      </div>

      {/* Results count */}
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        {filtered?.length ?? 0} portfolio{filtered?.length !== 1 ? 's' : ''}
        {activeTag ? ` in ${activeTag}` : ''}
        {query ? ` matching "${query}"` : ''}
      </p>

      {/* Portfolio Grid */}
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
            {activeTag ? `No portfolios tagged with "${activeTag}" yet.` : 'Be the first to upload your work.'}
          </p>
        </div>
      )}
    </div>
  )
}