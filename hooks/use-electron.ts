"use client"

import { useEffect, useState } from "react"

interface ElectronAPI {
  getVersion: () => Promise<string>
  showSaveDialog: () => Promise<any>
  showOpenDialog: () => Promise<any>
  onMenuAction: (callback: (event: any, data?: any) => void) => void
  removeAllListeners: (channel: string) => void
  platform: string
  showNotification: (title: string, body: string) => void
} 

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    electronIntegration?: any
  }
}

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false)
  const [version, setVersion] = useState<string>("")
  const [platform, setPlatform] = useState<string>("")

  useEffect(() => {
    const checkElectron = async () => {
      if (window.electronAPI) {
        setIsElectron(true)
        setPlatform(window.electronAPI.platform)

        try {
          const appVersion = await window.electronAPI.getVersion()
          setVersion(appVersion)
        } catch (error) {
          console.error("Failed to get app version:", error)
        }
      }
    }

    checkElectron()
  }, [])

  const showNotification = (title: string, message: string) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(title, message)
    } else {
      // Fallback for web version
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body: message })
      }
    }
  }

  const saveFile = async (data: any, filename: string) => {
    if (window.electronAPI) {
      return await window.electronAPI.showSaveDialog()
    }
    return null
  }

  const openFile = async () => {
    if (window.electronAPI) {
      return await window.electronAPI.showOpenDialog()
    }
    return null
  }

  return {
    isElectron,
    version,
    platform,
    showNotification,
    saveFile,
    openFile,
  }
}
