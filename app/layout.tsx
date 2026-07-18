import type { Metadata, Viewport } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SkillHub | Professional LMS',
  description: 'Accelerate your supply chain career with industry-leading courses in Logistics, Procurement, Lean Six Sigma, and more.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/images/Logo.png',
        type: 'image/png',
      },
    ],
    apple: '/images/Logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#060d18',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
