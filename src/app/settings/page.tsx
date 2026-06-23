import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import SettingsClient from '@/components/ui/SettingsClient'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px 96px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 32, fontWeight: 800, marginBottom: 8
      }}>
        Profile Settings
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>
        Update your public profile information
      </p>
      <SettingsClient profile={profile} userId={user.id} />
    </div>
  )
}