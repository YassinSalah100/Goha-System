// This file runs in the renderer process and can access DOM
// It communicates with the main process via the preload script

class ElectronIntegration {
  constructor() {
    this.init()
  }

  init() {
    // Check if we're running in Electron
    if (window.electronAPI) {
      this.setupMenuListeners()
      this.setupNotifications()
      this.addElectronStyles()
    }
  }

  setupMenuListeners() {
    window.electronAPI.onMenuAction((event, data) => {
      switch (event.type) {
        case "menu-new-order":
          this.handleNewOrder()
          break
        case "menu-print-report":
          this.handlePrintReport()
          break
        case "menu-navigate":
          this.handleNavigation(data)
          break
      }
    })
  }

  setupNotifications() {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  addElectronStyles() {
    // Add Electron-specific styles
    document.body.classList.add("electron-app")

    // Add platform-specific styles
    if (window.electronAPI.platform === "darwin") {
      document.body.classList.add("platform-mac")
    } else if (window.electronAPI.platform === "win32") {
      document.body.classList.add("platform-windows")
    } else {
      document.body.classList.add("platform-linux")
    }
  }

  handleNewOrder() {
    // Navigate to new order page or trigger new order modal
    const event = new CustomEvent("electron-new-order")
    window.dispatchEvent(event)
  }

  handlePrintReport() {
    // Trigger print functionality
    window.print()
  }

  handleNavigation(route) {
    // Handle navigation based on menu selection
    const event = new CustomEvent("electron-navigate", { detail: route })
    window.dispatchEvent(event)
  }

  showNotification(title, message, type = "info") {
    if (window.electronAPI && "Notification" in window && Notification.permission === "granted") {
      window.electronAPI.showNotification(title, message)
    }
  }

  async saveFile(data, filename) {
    if (window.electronAPI) {
      const result = await window.electronAPI.showSaveDialog()
      if (!result.canceled) {
        // Handle file saving logic here
        console.log("Save file to:", result.filePath)
        return result.filePath
      }
    }
    return null
  }

  async openFile() {
    if (window.electronAPI) {
      const result = await window.electronAPI.showOpenDialog()
      if (!result.canceled && result.filePaths.length > 0) {
        console.log("Open file from:", result.filePaths[0])
        return result.filePaths[0]
      }
    }
    return null
  }
}

// Initialize Electron integration when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.electronIntegration = new ElectronIntegration()
  })
} else {
  window.electronIntegration = new ElectronIntegration()
}

// Export for use in React components
window.ElectronIntegration = ElectronIntegration
