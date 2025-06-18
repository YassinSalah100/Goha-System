import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ElectronMenuHandler } from "@/components/electron-menu-handler"

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
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <style>{`
          body {
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
        `}</style>
      </head>
      <body>
        <ElectronMenuHandler />
        {children}
        <script src="/electron/renderer.js" defer />
      </body>
    </html>
  )
}
