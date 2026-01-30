# Lion Pet Assistant - Architecture & Design Document

## 1. Project Overview
A desktop assistant featuring a transparent character ("Pet") that provides quick access to AI interaction phrases, clipboard analysis, and smart automation.

## 2. Core Architecture
- **Framework**: Electron (Main process for window management, Renderer for UI).
- **UI Stack**: React + Tailwind CSS + Framer Motion (animations).
- **Windows**:
  - `PetWindow`: Small, transparent, always-on-top window for the character.
  - `SidebarWindow`: Slidable panel on the screen edge, containing the main functional Tabs.

### 2.1 Visual State Machine (Pet Animations)
- **Idle (Default)**: Lion lying down, dozing off with a "zzZZ" bubble animation.
- **Active (Click/Wake)**: Lion turns around and looks up (Sidebar opens).
- **Action (Copy/Run)**: Lion runs/dashes briefly (Visual feedback for "Action Executed").


---

## 3. Data Flow & Storage

### 3.1 Phrase Storage (Quick Phrases)
- **Format**: JSON-based local storage.
- **Location**: `userData/phrases.json`.
- **Structure**:
```json
{
  "categories": [
    {
      "id": "standard",
      "name": "General",
      "items": [
        {"id": "c1", "label": "Continue", "content": "Please continue."},
        {"id": "c2", "label": "Agree", "content": "I agree with this approach."},
        {"id": "c3", "label": "Chain of Thought", "content": "This seems complex. Let's use COT to analyze step by step."}
      ]
    }
  ],
  "custom": []
}
```

### 3.2 Clipboard Data Flow
1. **Poll/Listen**: Main process monitors the system clipboard (`electron.clipboard`).
2. **IPC Bridge**: When a change is detected, the main process sends the text/image metadata to the `SidebarWindow` via IPC.
3. **Analysis Trigger**: The `Brain` Tab only processes data when active or when "Significantly New" content is detected.

---

## 4. AI Automated Suggestions Logic (Brain Module)

### 4.1 Context Awareness
- When the `Brain` tab is opened or content is copied, the app sends a simplified prompt to the LLM.
- **Prompt Template**: 
  > "Based on this content: [CLIPBOARD_CONTENT], suggest 3 quick response actions or follow-up questions for an AI assistant."

### 4.2 Mode Switching
- **Code Mode**: Suggest: `Explain Code`, `Debug`, `Refactor`.
- **Chat Mode**: Suggest: `Polite Decline`, `Enthusiastic Agreement`, `Follow-up Query`.

### 4.3 Clipboard History Integration
- **History Tab**: Stores last 50 clipboard items.
- **Action**: "Add to Phrases" button on each history item to quickly save useful snippets to `phrases.json`.


---

## 5. Automation Logic (The "C" Choice)
1. **Click Button**: User clicks a phrase card.
2. **Copy**: `clipboard.writeText(content)`.
3. **Hide**: `SidebarWindow.hide()`.
4. **Pre-paste Delay**: Wait ~100ms for system focus return.
5. **Robot Command**: `robot.keyTap('v', 'command')` (on macOS).
6. **Fallback**: If robot fails, show a toast: "Copied to clipboard".
