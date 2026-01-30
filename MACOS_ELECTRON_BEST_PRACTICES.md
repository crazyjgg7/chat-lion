# 🦁 macOS Electron Development: Best Practices & Pitfalls

This guide summarizes critical lessons learned while building the Lion OS, specifically focusing on macOS UI rendering, window management, and glassmorphism effects.

## 1. The "Invisible Text" & Vibrancy Trap

### The Issue
macOS `vibrancy` (glass effect) is context-aware. If the system is in Light Mode, `vibrancy: 'under-window'` or `vibrancy: 'light'` will produce a light glass background. If your app assumes Dark Mode and sets white text, the text becomes invisible (White on Light Glass).

### The "Nuclear" Fix (Guaranteed Dark Glass)
To achieve a "Cyberpunk/Sci-Fi" dark glass look that persists even in Light Mode:

1.  **Electron (`main.js`)**:
    *   **Use `vibrancy: 'hud'`**: This material is designed for Heads-Up Displays and is *always* dark and translucent, ignoring system theme concepts.
    *   Alternative: `backgroundColor: '#00000000'` (transparent) combined with CSS blurring, but `hud` is more performant and native-looking.

2.  **CSS/React (The Safety Net)**:
    *   **Force Root Colors**: Don't rely on Tailwind classes alone. Add inline styles to the root container to force inheritance override.
    *   **Text Shadow**: Essential for readability on variable backgrounds.
    ```jsx
    <div style={{
       color: '#FFFFFF',
       textShadow: '0 1px 2px rgba(0,0,0,0.9)', // Strong shadow
       fontSmoothing: 'antialiased'
    }}>
    ```

## 2. Window Dragging: The "Non-Draggable" Pet

### The Issue
Making a window `transparent: true` and `frame: false` often breaks standard title bar dragging. Standard `-webkit-app-region: drag` can be flaky on complex shapes or interact poorly with click events (making buttons unclickable).

### The Fix: IPC-Based Dragging
For "Mascot" or irregular windows, use manual cursor tracking via IPC.

1.  **Renderer**: Detect `mousedown` and send `ipcRenderer.send('start-drag')`.
2.  **Main Process**:
    *   Get cursor position `screen.getCursorScreenPoint()`.
    *   Calculate delta and update `win.setPosition(x, y)` in a `setInterval` (approx 60fps).
    *   Clear interval on `mouseup`.

This provides 100% reliable dragging for any shape without blocking click events on child elements.

## 3. The "Blank Window" in Production vs Dev

### The Issue
A window works in dev (`npm run dev`) but shows a white/blank screen in production builds or changing environments.

### The Fix: Explicit URL Handling
Never assume `process.env` is available or correct without fallbacks.

```javascript
const isDev = !app.isPackaged; // Reliable check
const startUrl = isDev
    ? 'http://localhost:5173?window=my-window'  // Dev Server
    : `file://${path.join(__dirname, '../dist/index.html')}?window=my-window`; // Prod File

win.loadURL(startUrl);
```
**Critical**: In Dev, *do not* try to load `file://` paths, as modern browsers block them for security. Always force `http://localhost`.

## 4. Window Positioning & Snapping

### The Lesson
When creating multi-window apps (e.g., Pet + Sidebar), rely on one "Master" window's bounds.

*   **Logic**: `sidebarParams.x = petBounds.x + offset`.
*   **Trigger**: Recalculate *every time* the user interacts (clicks/drags), not just once on startup.
*   **VisibleOnAllWorkspaces**: If building an "always on top" tools, ensure you set `win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })` so it doesn't vanish when user switches desktops.

## 5. Round Corners & Clipping

### The Issue
`rounded-2xl` or similar CSS classes will clip content hard.

### The Fix
*   **Padding is your friend**: Ensure text containers have sufficient `pl` (padding-left) and `pb` (padding-bottom) to clear the corner radius.
*   **Center Alignment**: For status bars/footers, `justify-center` is safer than `justify-start` as it avoids corner collision entirely.

---
*Created for the Lion OS Project 🦁*
