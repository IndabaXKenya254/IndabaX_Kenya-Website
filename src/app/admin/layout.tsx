// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN LAYOUT
// ═══════════════════════════════════════════════════════════════════════
// Root layout for admin panel
// Created: Admin UI Phase 1 - Foundation

import '@/styles/admin.css'
import '@/styles/admin-mobile.css'

export const metadata = {
  title: 'Admin Panel - IndabaX Kenya',
  description: 'Admin panel for IndabaX Kenya website',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // AuthProvider is now in root layout, so we don't need it here
  return <>{children}</>
}
