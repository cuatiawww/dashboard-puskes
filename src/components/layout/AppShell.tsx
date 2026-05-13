'use client'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen">{children}</main>
  )
}
