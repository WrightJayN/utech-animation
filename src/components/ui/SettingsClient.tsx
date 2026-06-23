'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Avatar from './Avatar'

const inputStyle = {
  width: '100%', padding: '12px 14px',
  background: 'var(--surface-2)', border: '1.5px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 15,
  outline: 'none', fontFamily: 'var(--font-body)'
}

export default function SettingsClient({ profile, userId }: { profile: any, userId: string }) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: fullName.trim(),
      bio: bio.trim(),
      year_of_study: yearOfStudy.trim(),
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Profile Photo</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar
            url={avatarUrl}
            name={fullName}
            size={80}
            editable
            userId={userId}
            onUpdate={url => setAvatarUrl(url)}
          />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Click photo to upload
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              JPG, PNG or WEBP · Recommended 400×400px
            </p>
          </div>
        </div>
      </div>

      {/* Full name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Full Name</label>
        <input
          style={inputStyle}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Your full name"
        />
      </div>

      {/* Year of study */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Year of Study</label>
        <select
          value={yearOfStudy}
          onChange={e => setYearOfStudy(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Select year</option>
          <option value="Year 1">Year 1</option>
          <option value="Year 2">Year 2</option>
          <option value="Year 3">Year 3</option>
          <option value="Year 4">Year 4</option>
          <option value="Graduate">Graduate</option>
        </select>
      </div>

      {/* Bio */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 500 }}>Bio</label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell people about yourself and your work..."
          maxLength={300}
        />
        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
          {bio.length}/300
        </p>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          background: saved ? '#10b981' : 'var(--accent)',
          color: '#fff', padding: '13px', borderRadius: 8,
          fontSize: 15, fontWeight: 600,
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          transition: 'background 0.2s'
        }}
      >
        {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  )
}