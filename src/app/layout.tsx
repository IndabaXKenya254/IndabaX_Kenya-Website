import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IndabaX Kenya — Coming Soon',
  description: 'IndabaX Kenya website is currently under renovation. We will be back soon.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
