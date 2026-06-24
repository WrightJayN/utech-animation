'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Item = { id: string; type: string; url: string; caption?: string }

export default function Lightbox({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const posStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft') navigate(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active])

  const close = () => { setActive(null); setScale(1); setPosition({ x: 0, y: 0 }) }

  const navigate = (dir: number) => {
    if (!active) return
    const index = items.findIndex(i => i.id === active.id)
    const next = items[index + dir]
    if (next) { setActive(next); setScale(1); setPosition({ x: 0, y: 0 }) }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    posStart.current = { ...position }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPosition({
      x: posStart.current.x + (e.clientX - panStart.current.x),
      y: posStart.current.y + (e.clientY - panStart.current.y)
    })
  }

  const handleMouseUp = () => setIsPanning(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    setScale(s => Math.min(4, Math.max(1, s + delta)))
    if (scale + delta <= 1) setPosition({ x: 0, y: 0 })
  }

  const toggleZoom = () => {
    if (scale > 1) { setScale(1); setPosition({ x: 0, y: 0 }) }
    else setScale(2.5)
  }

  return (
    <>
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16
      }}>
        {items.map(item => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => { setActive(item); setScale(1); setPosition({ x: 0, y: 0 }) }}
            style={{
              borderRadius: 10, overflow: 'hidden',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'zoom-in'
            }}
          >
            {item.type === 'video' ? (
              <video src={item.url}
                style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }} />
            ) : (
              <img src={item.url} alt={item.caption ?? ''}
                style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            {item.caption && (
              <p style={{ padding: '10px 14px', fontSize: 13, color: 'var(--muted)' }}>
                {item.caption}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Image container */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                position: 'relative',
                cursor: scale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                userSelect: 'none'
              }}
            >
              {active.type === 'video' ? (
                <video
                  src={active.url} controls autoPlay
                  style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 10 }}
                />
              ) : (
                <motion.img
                  src={active.url}
                  alt={active.caption ?? ''}
                  onClick={toggleZoom}
                  animate={{ scale, x: position.x, y: position.y }}
                  transition={isPanning ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    maxWidth: '90vw', maxHeight: '80vh',
                    borderRadius: 10, display: 'block',
                    transformOrigin: 'center center'
                  }}
                  draggable={false}
                />
              )}

              {active.caption && (
                <p style={{
                  textAlign: 'center', marginTop: 12,
                  fontSize: 14, color: 'rgba(255,255,255,0.5)'
                }}>
                  {active.caption}
                </p>
              )}
            </motion.div>

            {/* Zoom indicator */}
            {scale > 1 && (
              <div style={{
                position: 'fixed', bottom: 48, left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255,255,255,0.1)',
                padding: '6px 14px', borderRadius: 100,
                fontSize: 12, color: 'rgba(255,255,255,0.6)'
              }}>
                {Math.round(scale * 100)}% · scroll to zoom · drag to pan
              </div>
            )}

            {/* Prev */}
            {items.findIndex(i => i.id === active.id) > 0 && (
              <button
                onClick={e => { e.stopPropagation(); navigate(-1) }}
                style={{
                  position: 'fixed', left: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontSize: 24, width: 48, height: 48,
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >←</button>
            )}

            {/* Next */}
            {items.findIndex(i => i.id === active.id) < items.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); navigate(1) }}
                style={{
                  position: 'fixed', right: 16, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: '#fff', fontSize: 24, width: 48, height: 48,
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >→</button>
            )}

            {/* Close */}
            <button
              onClick={close}
              style={{
                position: 'fixed', top: 16, right: 16,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', fontSize: 20, width: 40, height: 40,
                borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >×</button>

            {/* Counter */}
            <p style={{
              position: 'fixed', bottom: 16, left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 13, color: 'rgba(255,255,255,0.3)'
            }}>
              {items.findIndex(i => i.id === active.id) + 1} / {items.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}