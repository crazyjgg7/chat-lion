# Lion Pet Assistant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build "Lion", a desktop pet assistant with quick phrases, clipboard history, and AI context analysis.

**Architecture:** Electron (Main + Renderer). React based UI. `electron-store` for data. `robotjs` for automation.
**Tech Stack:** Electron 30+, React 18, TailwindCSS, Framer Motion, RobotJS.

---

### Task 1: Project Initialization & Electron Boilerplate

**Files:**
- Create: `package.json`
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Create: `src/App.jsx`
- Create: `vite.config.js`

**Step 1: Initialize Project & Install Dependencies**
Run:
```bash
npm init -y
npm install electron react react-dom @vitejs/plugin-react vite tailwindcss autoprefixer postcss robotjs electron-store framer-motion clsx tailwind-merge
npm install -D electron-builder concurrently cross-env
npx tailwindcss init -p
```

**Step 2: Modify `package.json` scripts**
Modify `package.json` to include:
```json
"scripts": {
  "dev": "concurrently \"vite\" \"wait-on tcp:5173 && electron .\"",
  "build": "vite build && electron-builder"
}
```
And set `"main": "electron/main.js"`.

**Step 3: Setup Basic Electron Main Process**
Create `electron/main.js` with a simple ready event creating a standard window to verify setup.

**Step 4: Verify Setup**
Run: `npm run dev`
Expected: Electron window opens displaying Vite default app.

---

### Task 2: Window Management (Pet & Sidebar)

**Files:**
- Modify: `electron/main.js`

**Step 1: Configure Pet Window**
Modify `createWindow` in `electron/main.js` to create `petWindow`:
- `width: 150`, `height: 150`
- `frame: false`, `transparent: true`, `alwaysOnTop: true`
- `hasShadow: false`

**Step 2: Configure Sidebar Window**
Add `createSidebarWindow` function:
- `width: 300`, `height: 600`
- `frame: false`, `show: false`
- `x`: Screen width - 300, `y`: 100

**Step 3: Run & Verify**
Run: `npm run dev`
Expected: A small transparent window (Pet) and a hidden Sidebar (verify via console logs or devtools).

---

### Task 3: Pet UI & Interaction (Draggable & Click)

**Files:**
- Create: `src/components/Pet.jsx`
- Modify: `src/App.jsx`
- Modify: `electron/preload.js`
- Modify: `electron/main.js`

**Step 1: Create Pet Component**
Create `src/components/Pet.jsx`:
- Simply returns a `div` with a Lion emoji 🦁 for now.
- Add class `select-none` and style `{-webkit-app-region: drag}` for dragging.

**Step 2: Handle Click (IPC)**
- In `Pet.jsx`, add `onClick` handler sending `ipcRenderer.send('pet-clicked')`.
- In `electron/main.js`, listen for `pet-clicked`:
  - Toggle `sidebarWindow` visibility.

**Step 3: Run & Verify**
Run: `npm run dev`
Expected: Clicking the Lion toggles the Sidebar visibility. Dragging the Lion works.

---

### Task 4: Sidebar Tabs & Quick Phrases UI

**Files:**
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/QuickPhrases.jsx`
- Create: `src/data/initialPhrases.js`

**Step 1: Create Sidebar Layout**
Create `src/components/Sidebar.jsx` using Tailwind:
- Fixed width/height.
- Dark mode background.
- Top Tab Bar: `[Quick] [Brain] [History] [Terminal]`.

**Step 2: Implement Quick Phrases Tab**
Create `src/components/QuickPhrases.jsx`:
- Map through a list of phrases.
- Render "Cards" (Buttons).

**Step 3: Run & Verify**
Run: `npm run dev`
Expected: Sidebar shows Tabs and a list of dummy buttons.

---

### Task 5: Automation (Paste Functionality)

**Files:**
- Modify: `electron/main.js`
- Modify: `src/components/QuickPhrases.jsx`

**Step 1: Implement Paste Logic in Main**
In `electron/main.js`:
- Import `robotjs` (or `nut.js`).
- Listen for `ipcMain.on('paste-phrase', (event, text) => { ... })`.
- Action:
  1. `clipboard.writeText(text)`
  2. `sidebarWindow.hide()`
  3. `setTimeout(() => robot.keyTap('v', 'command'), 100)`

**Step 2: Connect UI**
In `QuickPhrases.jsx`:
- On button click: `window.electronAPI.pastePhrase(text)`.

**Step 3: Run & Verify**
Run: `npm run dev`
Expected: Clicking a phrase button hides the sidebar and pastes text into the underlying editor.

---

### Task 6: Clipboard History & Persistence

**Files:**
- Modify: `electron/main.js`
- Create: `src/components/ClipboardHistory.jsx`

**Step 1: Clipboard Monitor**
In `electron/main.js`:
- `setInterval` check `clipboard.readText()`.
- If new, push to history array (limit 50).
- `win.webContents.send('clipboard-update', history)`

**Step 2: History UI**
Create `src/components/ClipboardHistory.jsx`:
- Listen for `clipboard-update`.
- Render list.
- Add "Save to Phrases" button.

**Step 3: Run & Verify**
Run: `npm run dev`
Expected: Copying text elsewhere updates the History list in the app.

---
