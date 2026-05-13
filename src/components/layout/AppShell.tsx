'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
