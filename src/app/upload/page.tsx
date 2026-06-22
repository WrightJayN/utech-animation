'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const TAGS = ['Character Design', 'Illustration', '3D Modelling', 'Video Editing', 'Graphic Design']

export default function Upload() {
  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Redirect if not logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUserId(data.user.id)
    })
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const slugify = (text: string) =>
    text.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-') +
    '-' + Date.now().toString(36)

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!coverFile) { setError('Cover image is required'); return }
    if (selectedTags.length === 0) { setError('Select at least one tag'); return }
    if (!userId) return

    setLoading(true)
    setError('')

    try {
      // 1. Upload cover image to Supabase Storage
      const ext = coverFile.name.split('.').pop()
      const filePath = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('portfolios')
        .upload(filePath, coverFile)

      if (uploadError) throw uploadError

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolios')
        .getPublicUrl(filePath)

      // 3. Create portfolio record
      const slug = slugify(title)
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          cover_image_url: publicUrl,
          slug,
          is_public: true
        })
        .select()
        .single()

      if (portfolioError) throw portfolioError

      // 4. Get tag IDs and link them
      const { data: tagData } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', selectedTags)

      if (tagData && tagData.length > 0) {
        await supabase.from('portfolio_tags').insert(
          tagData.map(tag => ({ portfolio_id: portfolio.id, tag_id: tag.id }))
        )
      }

      // 5. Done — go to the public portfolio page
      router.push(`/portfolio/${slug}`)

    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px',
    background: 'var(--surface-2)', border: '1.5px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: 15,
    outline: 'none', fontFamily: 'var(--font-body)'
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 36,
        fontWeight: 800, marginBottom: 8
      }}>
        New Portfolio
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 40 }}>
        Share your work with the UTech Animation community
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Portfolio Title *</label>
          <input
            style={inputStyle} value={title}
            placeholder="e.g. Year 2 Character Design Collection"
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={description}
            placeholder="Tell people about this portfolio — your process, tools, inspiration..."
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Cover Image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Cover Image *</label>
          {coverPreview ? (
            <div style={{ position: 'relative' }}>
              <img
                src={coverPreview} alt="Cover preview"
                style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 8 }}
              />
              <button
                onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.7)', color: '#fff',
                  border: 'none', borderRadius: 6,
                  padding: '6px 12px', cursor: 'pointer', fontSize: 13
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: 200, border: '2px dashed var(--border)',
              borderRadius: 8, cursor: 'pointer',
              color: 'var(--muted)', fontSize: 14, gap: 8,
              transition: 'border-color 0.15s'
            }}>
              <span style={{ fontSize: 32 }}>🖼️</span>
              <span>Click to upload cover image</span>
              <span style={{ fontSize: 12 }}>PNG, JPG, WEBP — max 10MB</span>
              <input
                type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
              />
            </label>
          )}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Tags * (select all that apply)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map(tag => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '8px 16px', borderRadius: 100,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? '#fff' : 'var(--muted)',
                    transition: 'all 0.15s'
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          style={{
            background: 'var(--accent)', color: '#fff',
            padding: '14px', borderRadius: 8,
            fontSize: 16, fontWeight: 600,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Publishing...' : 'Publish Portfolio'}
        </button>

      </div>
    </div>
  )
}