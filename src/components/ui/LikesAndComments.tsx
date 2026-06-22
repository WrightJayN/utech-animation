'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function LikesAndComments({ portfolioId }: { portfolioId: string }) {
  const [user, setUser] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [posting, setPosting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('portfolio_id', portfolioId)
      setLikeCount(count ?? 0)

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('portfolio_id', portfolioId)
          .eq('user_id', user.id)
          .single()
        setLiked(!!data)
      }

      const { data: commentData } = await supabase
        .from('comments')
        .select('*, profiles(full_name, username)')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: true })
      setComments(commentData ?? [])
    }
    load()
  }, [portfolioId])

  const toggleLike = async () => {
    if (!user) return
    if (liked) {
      await supabase.from('likes').delete()
        .eq('portfolio_id', portfolioId).eq('user_id', user.id)
      setLiked(false)
      setLikeCount(c => c - 1)
    } else {
      await supabase.from('likes').insert({ portfolio_id: portfolioId, user_id: user.id })
      setLiked(true)
      setLikeCount(c => c + 1)
    }
  }

  const postComment = async () => {
    if (!newComment.trim() || !user) return
    setPosting(true)
    const { data } = await supabase
      .from('comments')
      .insert({ portfolio_id: portfolioId, user_id: user.id, content: newComment.trim() })
      .select('*, profiles(full_name, username)')
      .single()
    if (data) setComments(prev => [...prev, data])
    setNewComment('')
    setPosting(false)
  }

  const deleteComment = async (id: string) => {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 32 }} />

      {/* Likes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <button
          onClick={toggleLike}
          disabled={!user}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 100,
            border: `1.5px solid ${liked ? 'var(--accent)' : 'var(--border)'}`,
            background: liked ? 'var(--accent)' : 'transparent',
            color: liked ? '#fff' : 'var(--muted)',
            fontSize: 14, fontWeight: 600, cursor: user ? 'pointer' : 'default',
            transition: 'all 0.15s'
          }}
        >
          <span>{liked ? '♥' : '♡'}</span>
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
        </button>
        {!user && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a> to like this portfolio
          </p>
        )}
      </div>

      {/* Comments */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20, fontWeight: 700, marginBottom: 24
      }}>
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        {comments.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            No comments yet. {user ? 'Be the first!' : 'Sign in to comment.'}
          </p>
        )}
        {comments.map(comment => (
          <div key={comment.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 18px',
            display: 'flex', justifyContent: 'space-between', gap: 12
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>
                  {comment.profiles?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {comment.profiles?.full_name}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                  {new Date(comment.created_at).toLocaleDateString('en-JM', {
                    month: 'short', day: 'numeric'
                  })}
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#d4d4d8' }}>
                {comment.content}
              </p>
            </div>
            {user?.id === comment.user_id && (
              <button
                onClick={() => deleteComment(comment.id)}
                style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--muted)', cursor: 'pointer',
                  fontSize: 16, flexShrink: 0, alignSelf: 'flex-start'
                }}
              >×</button>
            )}
          </div>
        ))}
      </div>

      {/* Comment input */}
      {user ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && postComment()}
            placeholder="Write a comment..."
            style={{
              flex: 1, padding: '12px 16px',
              background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 8, color: 'var(--text)', fontSize: 15,
              outline: 'none', fontFamily: 'var(--font-body)'
            }}
          />
          <button
            onClick={postComment}
            disabled={posting || !newComment.trim()}
            style={{
              background: 'var(--accent)', color: '#fff',
              padding: '12px 20px', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              opacity: posting || !newComment.trim() ? 0.5 : 1
            }}
          >
            Post
          </button>
        </div>
      ) : (
        <div style={{
          padding: '16px 20px', borderRadius: 8,
          border: '1.5px dashed var(--border)',
          textAlign: 'center', color: 'var(--muted)', fontSize: 14
        }}>
          <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</a> to leave a comment
        </div>
      )}
    </div>
  )
}