import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminClient from '@/components/ui/AdminClient'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminRole) redirect('/dashboard')

  const { data: portfolios } = await supabase
    .from('portfolios')
    .select(`
      *,
      profiles (full_name, username),
      portfolio_tags (tags (name)),
      takedowns (id, reason, appeal_status, appeal_message, created_at)
    `)
    .order('created_at', { ascending: false })

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px 96px' }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
          color: '#7c3aed', textTransform: 'uppercase', marginBottom: 8
        }}>
          Admin Panel
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32, fontWeight: 800
        }}>
          Portfolio Moderation
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>
          {portfolios?.length ?? 0} total portfolios ·{' '}
          {portfolios?.filter(p => p.status === 'taken_down').length ?? 0} taken down ·{' '}
          {portfolios?.filter(p => p.takedowns?.some((t: any) => t.appeal_status === 'pending')).length ?? 0} pending appeals
        </p>
      </div>

      <AdminClient portfolios={portfolios ?? []} adminId={user.id} />
    </div>
  )
}