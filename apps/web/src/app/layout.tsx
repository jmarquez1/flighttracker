import './globals.css'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'SKY-TRACK // Intelligent Flight Monitoring',
  description: 'Automated flight tracking and real-time notifications for professional travel groups.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#050505] text-[#e0e0e0] antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  )
}
