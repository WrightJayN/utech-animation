import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'UTech Animation — Student Portfolio Gallery',
  description: 'Browse animation portfolios from University of Technology, Jamaica students.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ paddingTop: 64 }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid var(--border)',
          padding: '24px',
          textAlign: 'center',
          display: 'flex', justifyContent: 'center',
          alignItems: 'center', gap: 24, flexWrap: 'wrap'
        }}>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            © {new Date().getFullYear()} UTech Animation Portfolio Gallery
          </p>
          <Link href="/terms" style={{
            fontSize: 13, color: 'var(--muted)',
            textDecoration: 'underline'
          }}>
            Terms & Conditions
          </Link>
        </footer>
      </body>
    </html>
  )
}