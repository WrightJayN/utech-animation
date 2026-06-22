'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function AnimatedCard({ portfolio }: { portfolio: any }) {
  const owner = portfolio.profiles
  const tags = portfolio.portfolio_tags?.map((pt: any) => pt.tags.name) ?? []

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } }
      }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Link
        href={`/portfolio/${portfolio.slug}`}
        style={{
          display: 'block',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden',
          height: '100%'
        }}
      >
        {/* Cover */}
        <div style={{ height: 220, overflow: 'hidden', background: 'var(--surface-2)', position: 'relative' }}>
          {portfolio.cover_image_url ? (
            <motion.img
              src={portfolio.cover_image_url}
              alt={portfolio.title}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 40
            }}>🎨</div>
          )}

          {/* Tag overlay on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
              display: 'flex', alignItems: 'flex-end',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((tag: string) => (
                <span key={tag} style={{
                  padding: '4px 10px', borderRadius: 100,
                  fontSize: 11, fontWeight: 600,
                  background: 'var(--accent)',
                  color: '#fff'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Card body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 17, fontWeight: 700,
            marginBottom: 6, lineHeight: 1.3
          }}>
            {portfolio.title}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            {owner?.full_name}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}