const { app, BrowserWindow, ipcMain, screen, Menu, MenuItem, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// ... (Existing Imports)

// --- PROMPT MANAGEMENT ---
const promptsPath = path.join(app.getPath('userData'), 'prompts.json');

// Default Seed Prompts
const DEFAULT_PROMPTS = [
    // TEXT
    { id: 'translate',  type: 'TEXT', label: '🔤 地道翻译', content: "请将以下内容翻译成地道、自然的英文（口语化风格）：\n\n" },
    { id: 'translate_cn', type: 'TEXT', label: '🀄️ 翻译成中文', content: "请将以下内容翻译成流畅、准确的中文：\n\n" },
    { id: 'summarize',  type: 'TEXT', label: '📝 总结内容', content: "请简要总结以下文本的主要内容，列出核心要点：\n\n" },
    
    // LINK
    { id: 'sum_page',   type: 'LINK', label: '📄 网页总结', content: "请访问这个链接，并总结其核心内容和关键结论：\n\n" },
    { id: 'deploy',     type: 'LINK', label: '🚀 部署帮助', content: "请详细阅读这个 GitHub 仓库的文档，并一步步教我如何部署它：\n\n", condition: 'github.com' },

    // CODE
    { id: 'explain',    type: 'CODE', label: '🧐 代码解释', content: "请详细解释这段代码的逻辑和功能，逐行分析：\n\n" },
    { id: 'refactor',   type: 'CODE', label: '⚡️ 优化重构', content: "请作为资深工程师，优化这段代码的性能和可读性，并给出修改后的代码：\n\n" },
];

let customPrompts = [];

function loadPrompts() {
    try {
        if (fs.existsSync(promptsPath)) {
            customPrompts = JSON.parse(fs.readFileSync(promptsPath));
        } else {
            customPrompts = DEFAULT_PROMPTS;
            savePrompts();
        }
    } catch (e) {
        console.error("Failed to load prompts", e);
        customPrompts = DEFAULT_PROMPTS;
    }
}

function savePrompts() {
    fs.writeFileSync(promptsPath, JSON.stringify(customPrompts, null, 2));
}

// Load on start
loadPrompts();

// ... (Existing Variables: petWindow, sidebarWindow...)
let promptManagerWindow = null;

// ... (createWindow function - Needs modification) ...
// We will modify existing createWindow to handle 'prompt-manager'

// IPC handlers for Prompts
ipcMain.on('get-prompts', (event) => {
    event.sender.send('prompts-update', customPrompts);
});

ipcMain.on('save-prompt', (event, prompt) => {
    // If ID exists, update; else push
    const index = customPrompts.findIndex(p => p.id === prompt.id);
    if (index >= 0) {
        customPrompts[index] = prompt;
    } else {
        customPrompts.push(prompt);
    }
    savePrompts();
    
    // Notify all windows
    if (promptManagerWindow) promptManagerWindow.webContents.send('prompts-update', customPrompts);
    if (sidebarWindow) sidebarWindow.webContents.send('prompts-update', customPrompts);
});

ipcMain.on('delete-prompt', (event, id) => {
    customPrompts = customPrompts.filter(p => p.id !== id);
    savePrompts();
    
    // Notify all windows
    if (promptManagerWindow) promptManagerWindow.webContents.send('prompts-update', customPrompts);
    if (sidebarWindow) sidebarWindow.webContents.send('prompts-update', customPrompts);
});


// Context Menu Modification
ipcMain.on('show-context-menu', (event, { type, data }) => {
    const menu = new Menu();

    if (type === 'pet') {
        menu.append(new MenuItem({
            label: '🦁 管理常用语 (Manage Phrases)',
            click: () => {
                if (sidebarWindow) {
                    sidebarWindow.show();
                    sidebarWindow.webContents.send('navigate-tab', 'quick');
                }
            }
        }));
        
        // NEW: Prompt Manager Item
        menu.append(new MenuItem({
            label: '🧠 管理 AI 指令 (Manage Prompts)',
            click: () => {
                createPromptManagerWindow();
            }
        }));

        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: '退出 Lion', role: 'quit' }));
    }
    // ... history logic ...
    menu.popup();
});

function createPromptManagerWindow() {
    if (promptManagerWindow && !promptManagerWindow.isDestroyed()) {
        promptManagerWindow.show();
        promptManagerWindow.focus();
        return;
    }

    promptManagerWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false, // Frameless for glass style
        transparent: true,
        vibrancy: 'hud', // Dark Glass
        visualEffectState: 'active',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // contextIsolation: true, // Inherited from main config logic usually
        }
    });

    const startUrl = process.env.VITE_DEV_SERVER_URL 
        ? `${process.env.VITE_DEV_SERVER_URL}?type=prompt-manager`
        : `file://${path.join(__dirname, '../dist/index.html')}?type=prompt-manager`;

    promptManagerWindow.loadURL(startUrl);

    promptManagerWindow.on('closed', () => {
        promptManagerWindow = null;
    });
}
