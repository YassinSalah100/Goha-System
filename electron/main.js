const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require("electron")
const path = require("path")
const isDev = process.env.NODE_ENV === "development"

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets", "icon.png"),
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
  })

  // Load the app
  const startUrl = isDev ? "http://localhost:3000" : `file://${path.join(__dirname, "../.next/server/app/index.html")}`

  mainWindow.loadURL(startUrl)

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show()

    // Focus on window
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: "deny" }
  })
}

// App event listeners
app.whenReady().then(() => {
  createWindow()
  createMenu()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// Create application menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Order",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-new-order")
          },
        },
        {
          label: "Print Report",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            mainWindow.webContents.send("menu-print-report")
          },
        },
        { type: "separator" },
        {
          label: "Exit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Dashboard",
          accelerator: "CmdOrCtrl+1",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "dashboard")
          },
        },
        {
          label: "Sales",
          accelerator: "CmdOrCtrl+2",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "sales")
          },
        },
        {
          label: "Inventory",
          accelerator: "CmdOrCtrl+3",
          click: () => {
            mainWindow.webContents.send("menu-navigate", "inventory")
          },
        },
        { type: "separator" },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            mainWindow.reload()
          },
        },
        {
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => {
            mainWindow.webContents.reloadIgnoringCache()
          },
        },
        {
          label: "Toggle Developer Tools",
          accelerator: process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
          click: () => {
            mainWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "CmdOrCtrl+M",
          click: () => {
            mainWindow.minimize()
          },
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          click: () => {
            mainWindow.close()
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Restaurant Management System",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "About",
              message: "Restaurant Management System",
              detail:
                "Version 1.0.0\nBuilt with Electron and Next.js\n\nA comprehensive restaurant management solution.",
            })
          },
        },
        {
          label: "Learn More",
          click: () => {
            shell.openExternal("https://github.com/yourusername/restaurant-management-system")
          },
        },
      ],
    },
  ]

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: "About " + app.getName(),
          role: "about",
        },
        { type: "separator" },
        {
          label: "Services",
          role: "services",
          submenu: [],
        },
        { type: "separator" },
        {
          label: "Hide " + app.getName(),
          accelerator: "Command+H",
          role: "hide",
        },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          role: "hideothers",
        },
        {
          label: "Show All",
          role: "unhide",
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: () => {
            app.quit()
          },
        },
      ],
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// IPC handlers
ipcMain.handle("app-version", () => {
  return app.getVersion()
})

ipcMain.handle("show-save-dialog", async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "CSV Files", extensions: ["csv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })
  return result
})

ipcMain.handle("show-open-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "CSV Files", extensions: ["csv"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })
  return result
})
