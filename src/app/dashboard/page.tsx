import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardClient from '@/components/ui/DashboardClient'

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Check if admin
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  const isAdmin = !!adminRole

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select(`*, portfolio_tags (tags (name)), takedowns(id, reason, appeal_status, appeal_message)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 96px' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 48, flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 4 }}>
            Welcome back
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32, fontWeight: 800
          }}>
            {profile?.full_name ?? 'Student'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAdmin && (
            <Link href="/admin" style={{
              background: '#7c3aed', color: '#fff',
              padding: '12px 24px', borderRadius: 8,
              fontSize: 14, fontWeight: 600
            }}>
              Admin Panel
            </Link>
          )}
          <Link href="/upload" style={{
            background: 'var(--accent)', color: '#fff',
            padding: '12px 24px', borderRadius: 8,
            fontSize: 14, fontWeight: 600
          }}>
            + New Portfolio
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 16, marginBottom: 48
      }}>
        {[
          { label: 'Total Portfolios', value: portfolios?.length ?? 0 },
          { label: 'Public', value: portfolios?.filter(p => p.visibility === 'public' && p.status === 'active').length ?? 0 },
          { label: 'Unlisted', value: portfolios?.filter(p => p.visibility === 'unlisted').length ?? 0 },
          { label: 'Private', value: portfolios?.filter(p => p.visibility === 'private').length ?? 0 },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '20px 24px'
          }}>
            <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Portfolio List */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20, fontWeight: 700, marginBottom: 20
      }}>
        Your Portfolios
      </h2>

      {portfolios && portfolios.length > 0 ? (
        <DashboardClient portfolios={portfolios} />
      ) : (
        <div style={{
          textAlign: 'center', padding: '64px 24px',
          border: '2px dashed var(--border)', borderRadius: 12
        }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🎨</p>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>No portfolios yet</p>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Upload your first portfolio to get started
          </p>
          <Link href="/upload" style={{
            background: 'var(--accent)', color: '#fff',
            padding: '10px 24px', borderRadius: 8,
            fontSize: 14, fontWeight: 600
          }}>
            Create Portfolio
          </Link>
        </div>
      )}
    </div>
  )
}