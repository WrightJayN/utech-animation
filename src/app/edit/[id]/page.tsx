import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import EditClient from '@/components/ui/EditClient'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select(`*, portfolio_items(*), portfolio_tags(tags(name))`)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!portfolio) notFound()

  const { data: tags } = await supabase.from('tags').select('*').order('name')

  return <EditClient portfolio={portfolio} allTags={tags ?? []} />
}