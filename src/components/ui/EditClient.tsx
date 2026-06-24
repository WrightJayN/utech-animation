'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 15,
  outline: 'none', fontFamily: 'var(--font-body)'
}

export default function EditClient({ portfolio, allTags }: { portfolio: any, allTags: any[] }) {
  const [title, setTitle] = useState(portfolio.title)
  const [description, setDescription] = useState(portfolio.description ?? '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []
  )
  const [existingItems, setExistingItems] = useState<any[]>(
    portfolio.portfolio_items?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []
  )
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setNewFiles(prev => [...prev, ...files])
    files.forEach(file => setNewPreviews(prev => [...prev, URL.createObjectURL(file)]))
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
    setNewPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingItem = async (itemId: string) => {
    await supabase.from('portfolio_items').delete().eq('id', itemId)
    setExistingItems(prev => prev.filter(i => i.id !== itemId))
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    try {
      // 1. Update portfolio details
      await supabase
        .from('portfolios')
        .update({ title: title.trim(), description: description.trim() })
        .eq('id', portfolio.id)

      // 2. Update tags — delete all, re-insert
      await supabase.from('portfolio_tags').delete().eq('portfolio_id', portfolio.id)
      const { data: tagData } = await supabase
        .from('tags').select('id, name').in('name', selectedTags)
      if (tagData && tagData.length > 0) {
        await supabase.from('portfolio_tags').insert(
          tagData.map(tag => ({ portfolio_id: portfolio.id, tag_id: tag.id }))
        )
      }

      // 3. Upload new media items
      if (newFiles.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        const uploads = await Promise.all(
          newFiles.map(async (file, index) => {
            const ext = file.name.split('.').pop()
            const filePath = `${user!.id}/items/${Date.now()}-${index}.${ext}`
            await supabase.storage.from('portfolios').upload(filePath, file)
            const { data: { publicUrl } } = supabase.storage
              .from('portfolios').getPublicUrl(filePath)
            const type = file.type.startsWith('video') ? 'video' : 'image'
            return {
              portfolio_id: portfolio.id, type, url: publicUrl,
              display_order: existingItems.length + index
            }
          })
        )
        await supabase.from('portfolio_items').insert(uploads)
      }

      router.push(`/portfolio/${portfolio.slug}`)
      router.refresh()

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 96px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 32,
        fontWeight: 800, marginBottom: 8
      }}>
        Edit Portfolio
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>
        {portfolio.title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Title</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {allTags.map(tag => {
              const active = selectedTags.includes(tag.name)
              return (
                <button key={tag.id} onClick={() => toggleTag(tag.name)} style={{
                  padding: '8px 16px', borderRadius: 100,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                  transition: 'all 0.15s'
                }}>
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Existing Media */}
        {existingItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>
              Current Media ({existingItems.length} items)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10
            }}>
              {existingItems.map(item => (
                <div key={item.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                  {item.type === 'video' ? (
                    <video src={item.url} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <img src={item.url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  )}
                  <button
                    onClick={() => removeExistingItem(item.id)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(239,68,68,0.85)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 26, height: 26, cursor: 'pointer',
                      fontSize: 16, display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Add More Media</label>

          {newPreviews.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10
            }}>
              {newPreviews.map((src, i) => (
                <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                  {newFiles[i]?.type.startsWith('video') ? (
                    <video src={src} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <img src={src} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  )}
                  <button
                    onClick={() => removeNewFile(i)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.7)', color: '#fff',
                      border: 'none', borderRadius: '50%',
                      width: 26, height: 26, cursor: 'pointer',
                      fontSize: 16, display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '14px',
            border: '2px dashed var(--border)', borderRadius: 8,
            cursor: 'pointer', color: 'var(--muted)', fontSize: 14
          }}>
            <span>+ Add Images or Videos</span>
            <input
              type="file" accept="image/*,video/*"
              multiple style={{ display: 'none' }}
              onChange={handleNewFiles}
            />
          </label>
        </div>

        {error && <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              flex: 1, background: 'var(--accent)', color: '#fff',
              padding: '13px', borderRadius: 8,
              fontSize: 15, fontWeight: 600,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.back()}
            style={{
              padding: '13px 24px', borderRadius: 8,
              fontSize: 15, fontWeight: 500,
              border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}