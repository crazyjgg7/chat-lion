# Lion Pet Assistant - Project Structure Analysis

## Overview
This document outlines the current architecture of the Lion Pet Assistant application to facilitate future iterations and updates.

## Directory Structure

```
/Users/apple/dev/chat-lion/
├── electron/               # Electron Main Process Logic
│   ├── main.js             # Entry point, window management, IPC handlers
│   └── preload.js          # Context Bridge, secure API exposure to Renderer
├── src/                    # React Renderer Process
│   ├── components/         # UI Components
│   │   ├── Pet.jsx         # The floating 3D Lion character
│   │   ├── Sidebar.jsx     # Main functional panel (Tabs container)
│   │   ├── Brain.jsx       # "Thinking" tab - Heuristic Clipboard Analysis
│   │   ├── Terminal.jsx    # "Command" tab - Simulated/System Terminal
│   │   ├── QuickPhrases.jsx# "Quick" tab - Preset prompt buttons
│   │   └── ClipboardHistory.jsx # "History" tab - Clipboard logs
│   ├── data/
│   │   └── initialPhrases.js # Static data for QuickPhrases
│   ├── index.css           # Global styles & Tailwind directives
│   └── main.jsx            # React entry point
├── assets/                 # Static assets (3D renders, icons)
├── scripts/                # Utility scripts (e.g., asset processing)
├── Lion_Assets/            # Raw blender/source assets
├── start.sh                # Startup script (Kill processes -> Vite -> Electron)
└── ...config files         # Vite, Tailwind, PostCSS configs
```

## Key Modules & Responsibilities

### 1. Window Management (`electron/main.js`)
- **Dual Window System**:
  - `PetWindow`: Transparent, click-through (mostly), displays the character. Handles drag via IPC.
  - `SidebarWindow`: Overlay window for interactions. Hidden by default, toggled via `PetWindow` click.
- **IPC Bridge**: Handles communication between Renderer and Main (e.g., `paste-phrase`, `get-history`).

### 2. State & Data Flow
- **Clipboard Monitoring**:
  - Main process polls system clipboard (`setInterval`).
  - Updates push to Sidebar via `clipboard-update` channel.
- **Quick Action Logic**:
  - User clicks phrase -> IPC `paste-phrase` sent to Main -> Main writes to clipboard -> Main hides Sidebar.

### 3. Feature Modules
### 3. Feature Modules Update (Jan 30, 2026)

#### 🦁 Visual State Machine (Pet.jsx)
- **States**: `Idle` (Sleep bubble), `Active/Interact` (Look up), `Run` (Success feedback).
- **Optimization**: Added `key={src}` to images to prevent ghosting during state transitions.

#### 🧠 Brain Module (Heuristic & Prompt Wrapper)
- **Logic**: "Context Awareness" -> "AI Wrapper".
- **Workflow**:
  1. Detects content type (Text, Code, Link, Email).
  2. Offers context-aware actions (e.g., "Refactor", "Summarize").
  3. **Wraps** original content into a structured AI Prompt (Chinese).
  4. Copies to clipboard & triggers Pet 'Run' animation.
- **UI**: fully localized (Chinese), modern card design with hover animations.

#### 🐚 Terminal Tab
- **Visuals**: Enforced opaque white background + high-contrast text for visibility.
- **Layout**: Fixed `z-index` layering to ensure input and content are measurable.

#### 🎨 Sidebar UI
- **Drag & Drop**: Added dedicated top drag handle to resolve conflict with tab interactivity.
- **Glassmorphism**: Refined styling for a cleaner look while maintaining readability.

## Extension Points for Future Iteration
- **AI Integration**: Replace heuristics in `Brain.jsx` with real API calls (Gemini/OpenAI) via a new Main Process handler.
- **Data Persistence**: Replace in-memory `clipboardHistory` array in `main.js` with `electron-store` or SQLite.
- **System Control**: Enhance `Terminal.jsx` to execute real shell commands (requires strict security consideration).
- **Custom Prompts**: Allow users to edit/add their own Prompt Templates in `Brain.jsx` (currently hardcoded constants).

## UI & CSS Architecture Notes
### 🪟 Transparent Windows (Electron Pitfall)
- The windows are created with `transparent: true` to allow rounded corners and non-rectangular shapes.
- **CRITICAL**: The Root React Component (Sidebar/Pet) **MUST** have a hard-coded, opaque background color (e.g., `#ffffff` or `rgba(255,255,255,1)`).
- If you rely solely on Tailwind `bg-white`, Electron sometimes renders it as semi-transparent on macOS. Always use inline styles or explicit opaque colors for the main container to prevent "ghosting" or clicking through to the desktop.
- **Theming**: When implementing themes, update this root background color dynamically. Do not leave it transparent.

