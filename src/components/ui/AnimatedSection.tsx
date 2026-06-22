'use client'

import { motion } from 'framer-motion'

export function FadeUp({ children, delay = 0, style = {} }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function FadeIn({ children, delay = 0, style = {} }: {
  children: React.ReactNode
  delay?: number
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function ScrollReveal({ children, style = {} }: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function StaggerGrid({ children, style = {} }: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } }
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, style = {} }: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } }
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}