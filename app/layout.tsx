import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ElectronMenuHandler } from "@/components/electron-menu-handler"
import { SessionSync } from "@/components/SessionSync";

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
  // Add storage event listener to sync user session across tabs
  // This useEffect is now only for the SessionSync component
  // The main layout component does not need it.
  // The SessionSync component will handle its own useEffect.

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ElectronMenuHandler />
        <SessionSync />
        {children}
      </body>
    </html>
  )
}
