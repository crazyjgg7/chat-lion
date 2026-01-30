# 🦁 Lion OS (Chat Lion)

An intelligent desktop assistant that lives on your screen. Not just a chatbot, but a futuristic HUD-style OS for your productivity.

![Lion OS](src/assets/Lionmainpic.jpg)

[中文文档 (Chinese)](README_CN.md) | [Download Installer](https://github.com/crazyjgg7/chat-lion/releases)

## ✨ Features

### 🦁 Desktop Pet (The Core)
- **Always on Top**: A cute 3D-style lion that sits on your desktop.
- **Interactive**: Click to wake up the HUD sidebar.
- **Draggable**: Drag the lion anywhere; the HUD snaps to it intelligently.

### 🔮 HUD Sidebar (Glassmorphism)
- **Dark Glass Aesthetic**: Native macOS "Vibrancy" (HUD) effect.
- **Sidebar Tabs**:
    - **⚡️ QUICK (Shortcuts)**: One-click access to your most used phrases.
    - **🧠 BRAIN (AI Prompts)**: Manage and use powerful AI prompts (Translation, Code Analysis, etc.).
    - **📋 HISTORY (Clipboard)**: Auto-records your clipboard history.
    - **💻 COMMAND (Terminal)**: A mini-terminal for system tasks.

### 🧠 Prompt Manager (New!)
- **Manage Your AI**: Add, edit, and delete custom AI prompts.
- **Categories**: Organize by Text, Link, Code, or Email.
- **Visual Editor**: dedicated window with dark glass UI.

## 📥 Installation

1.  Go to the [Releases Page](https://github.com/crazyjgg7/chat-lion/releases).
2.  Download the latest `.dmg` file (macOS).
3.  Drag to Applications and run!

## 🛠 Tech Stack
- **Core**: Electron
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS + PostCSS
- **Visuals**: Framer Motion + Native macOS Vibrancy

## ⌨️ Development

```bash
# Install dependencies
npm install

# Run in Dev Mode (Hot Reload)
npm run dev

# Build for macOS
npm run build
```

## 📄 License
MIT
