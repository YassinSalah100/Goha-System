# 🍽️ Restaurant Management System - Desktop App

A comprehensive restaurant management solution built with **Next.js** and **Electron**, featuring multi-role dashboards, real-time operations tracking, and Arabic localization.

## 🚀 Features

### 🖥️ Desktop Application
- **Native Desktop App** - Runs on Windows, macOS, and Linux
- **Offline Capability** - Works without internet connection
- **System Integration** - Native menus, shortcuts, and notifications
- **Auto-Updates** - Seamless application updates

### 👥 Multi-Role System
- **Owner Dashboard** - Real-time monitoring and financial reports
- **Admin Panel** - Inventory management and worker scheduling
- **Cashier Portal** - Sales processing and order management

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Desktop**: Electron 28
- **UI**: Tailwind CSS, Shadcn/ui
- **State**: Zustand
- **Build**: Electron Builder

## 📦 Installation & Development

### Prerequisites
\`\`\`bash
Node.js 18+
npm or yarn
\`\`\`

### Development Setup
\`\`\`bash
# Clone repository
git clone https://github.com/yourusername/restaurant-management-system.git
cd restaurant-management-system

# Install dependencies
npm install

# Run in development mode (web + electron)
npm run electron-dev

# Run web only
npm run dev

# Run electron only (after building)
npm run electron
\`\`\`

### Building for Production
\`\`\`bash
# Build web app
npm run build

# Build desktop app for current platform
npm run dist

# Build for all platforms
npm run electron-build
\`\`\`

## 🖥️ Desktop Features

### Native Menu Bar
- **File Menu**: New Order (Ctrl+N), Print Report (Ctrl+P)
- **View Menu**: Dashboard (Ctrl+1), Sales (Ctrl+2), Inventory (Ctrl+3)
- **Window Menu**: Minimize, Close, Developer Tools

### Keyboard Shortcuts
- `Ctrl+N` - New Order
- `Ctrl+P` - Print Report
- `Ctrl+1/2/3` - Navigate to Dashboard/Sales/Inventory
- `Ctrl+R` - Reload Application
- `F12` - Toggle Developer Tools

### System Integration
- **Notifications** - Order alerts and system notifications
- **File Dialogs** - Save/Open reports and data
- **System Tray** - Minimize to system tray (optional)
- **Auto-Start** - Launch on system startup (optional)

## 📱 Cross-Platform Support

### Windows
- **Installer**: NSIS installer with custom options
- **File Association**: Associate with restaurant data files
- **Start Menu**: Integration with Windows Start Menu

### macOS
- **DMG Package**: Drag-and-drop installation
- **App Store Ready**: Prepared for Mac App Store submission
- **Native Look**: macOS-specific UI adaptations

### Linux
- **AppImage**: Portable application format
- **Desktop Integration**: .desktop file for application launchers
- **Package Managers**: Support for various Linux distributions

## 🔧 Configuration

### Electron Settings
\`\`\`javascript
// electron/main.js configuration
{
  width: 1400,
  height: 900,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
}
\`\`\`

### Build Configuration
\`\`\`json
// package.json build settings
{
  "build": {
    "appId": "com.restaurant.management",
    "productName": "Restaurant Management System",
    "directories": {
      "output": "dist"
    }
  }
}
\`\`\`

## 🚀 Deployment

### Development
\`\`\`bash
npm run electron-dev
\`\`\`

### Production Build
\`\`\`bash
npm run dist
\`\`\`

### Distribution
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` disk image and `.app` bundle
- **Linux**: `.AppImage` and `.deb`/`.rpm` packages

## 🔒 Security

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Secure IPC communication
- **Content Security Policy**: Implemented for web content

## 📊 Performance

- **Fast Startup**: Optimized loading time
- **Memory Efficient**: Minimal resource usage
- **Responsive UI**: Smooth interactions
- **Background Processing**: Non-blocking operations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

=
**Built with ❤️ using Electron and Next.js**
