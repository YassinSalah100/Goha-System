import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ElectronMenuHandler } from "@/components/electron-menu-handler"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Restaurant Management System",
  description: "A comprehensive restaurant management solution",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ElectronMenuHandler />
        {children}
        <script src="/electron/renderer.js" defer />
      </body>
    </html>
  )
}
