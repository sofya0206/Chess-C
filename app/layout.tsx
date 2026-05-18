import './globals.css'

export const metadata = {
  title: 'Premium Chess Platform',
  description: 'Luxury Chess Interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
