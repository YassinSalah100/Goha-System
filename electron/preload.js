const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getVersion: () => ipcRenderer.invoke("app-version"),

  // File operations
  showSaveDialog: () => ipcRenderer.invoke("show-save-dialog"),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),

  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on("menu-new-order", callback)
    ipcRenderer.on("menu-print-report", callback)
    ipcRenderer.on("menu-navigate", callback)
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // Platform info
  platform: process.platform,

  // Notifications
  showNotification: (title, body) => {
    new Notification(title, { body })
  },
})

// DOM ready
window.addEventListener("DOMContentLoaded", () => {
  console.log("Restaurant Management System - Desktop App Ready")
})
