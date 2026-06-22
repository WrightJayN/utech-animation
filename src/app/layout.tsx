import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import PageTransition from '@/components/layout/PageTransition'

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
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </body>
    </html>
  )
}