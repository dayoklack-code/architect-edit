import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vintage Press Image Enhancer',
  description: 'Batch enhance editorial photos with Gemini.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
