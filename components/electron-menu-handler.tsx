"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useElectron } from "@/hooks/use-electron"

export function ElectronMenuHandler() {
  const router = useRouter()
  const { isElectron } = useElectron()

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return

    const handleMenuAction = (event: any, data?: any) => {
      switch (event) {
        case "menu-new-order":
          router.push("/cashier/sales")
          break
        case "menu-print-report":
          window.print()
          break
        case "menu-navigate":
          handleNavigation(data)
          break
      }
    }

    const handleNavigation = (route: string) => {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
      const role = currentUser.role || "cashier"

      switch (route) {
        case "dashboard":
          router.push(`/${role}`)
          break
        case "sales":
          router.push(`/${role}/sales`)
          break
        case "inventory":
          router.push(`/${role}/inventory`)
          break
      }
    }

    // Listen for custom events from renderer
    const handleElectronNewOrder = () => {
      router.push("/cashier/sales")
    }

    const handleElectronNavigate = (event: CustomEvent) => {
      handleNavigation(event.detail)
    }

    window.addEventListener("electron-new-order", handleElectronNewOrder)
    window.addEventListener("electron-navigate", handleElectronNavigate as EventListener)

    window.electronAPI.onMenuAction(handleMenuAction)

    return () => {
      window.removeEventListener("electron-new-order", handleElectronNewOrder)
      window.removeEventListener("electron-navigate", handleElectronNavigate as EventListener)
      window.electronAPI?.removeAllListeners("menu-new-order")
      window.electronAPI?.removeAllListeners("menu-print-report")
      window.electronAPI?.removeAllListeners("menu-navigate")
    }
  }, [isElectron, router])

  return null
}
