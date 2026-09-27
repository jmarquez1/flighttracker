import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Flight Control — Travel Biuro',
  description: 'Real-time flight monitoring for Travel Biuro operations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="bg-zinc-950 text-zinc-100 font-mono min-h-screen">{children}</body>
    </html>
  );
}
