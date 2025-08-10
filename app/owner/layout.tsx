"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in and is an owner
    console.log("OwnerLayout: Starting authorization check")
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
    console.log("OwnerLayout: Found user data:", currentUser)

    if (!currentUser.username || currentUser.role !== "owner") {
      console.log("OwnerLayout: User not authorized, redirecting to login")
      router.push("/")
      return
    }

    console.log("OwnerLayout: User authorized, setting loading to false")
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="owner" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Owner Dashboard" />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
