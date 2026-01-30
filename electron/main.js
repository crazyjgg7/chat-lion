const { app, BrowserWindow, screen, ipcMain, clipboard, Menu, MenuItem } = require('electron');
const path = require('path');
const fs = require('fs');

let petWindow;
let sidebarWindow;
let promptManagerWindow;
let clipboardHistory = [];
let lastClipboardText = '';

// Data Persistence
const userDataPath = app.getPath('userData');
const customPhrasesPath = path.join(app.getPath('userData'), 'customPhrases.json');
const promptsPath = path.join(app.getPath('userData'), 'prompts.json');

// Default Prompts (Seed)
const DEFAULT_PROMPTS = [
    { id: 'translate', type: 'TEXT', label: '🔤 地道翻译', content: "请将以下内容翻译成地道、自然的英文（口语化风格）：\n\n" },
    { id: 'translate_cn', type: 'TEXT', label: '🀄️ 翻译成中文', content: "请将以下内容翻译成流畅、准确的中文：\n\n" },
    { id: 'summarize', type: 'TEXT', label: '📝 总结内容', content: "请简要总结以下文本的主要内容，列出核心要点：\n\n" },
    { id: 'todo', type: 'TEXT', label: '✅ 待办提取', content: "请阅读以下内容，并整理出一个清晰的待办事项清单 (To-Do List)：\n\n" },
    { id: 'sum_page', type: 'LINK', label: '📄 网页总结', content: "请访问这个链接，并总结其核心内容和关键结论：\n\n" },
    { id: 'deploy', type: 'LINK', label: '🚀 部署帮助', content: "请详细阅读这个 GitHub 仓库的文档，并一步步教我如何部署它：\n\n", condition: 'github.com' },
    { id: 'analyze_repo', type: 'LINK', label: '📊 项目分析', content: "请分析这个 GitHub 项目的架构、主要功能和技术栈：\n\n", condition: 'github.com' },
    { id: 'explain', type: 'CODE', label: '🧐 代码解释', content: "请详细解释这段代码的逻辑和功能，逐行分析：\n\n" },
    { id: 'refactor', type: 'CODE', label: '⚡️ 优化重构', content: "请作为资深工程师，优化这段代码的性能和可读性，并给出修改后的代码：\n\n" },
    { id: 'find_bugs', type: 'CODE', label: '🐛 查找 Bug', content: "请帮我找出这段代码中潜在的 Bug 或安全隐患，并提供修复建议：\n\n" },
    { id: 'reply_polite', type: 'EMAIL', label: '✉️ 礼貌回复', content: "请帮我起草一封礼貌、专业的回复邮件，回应以下内容：\n\n" },
    { id: 'reply_refusal', type: 'EMAIL', label: '😡 委婉拒绝', content: "请帮我写一封语气坚定但得体的拒绝邮件给对方：\n\n" }
];

let customPhrases = [];
let customPrompts = [];
const defaultPhrases = [
    { id: '1', label: '继续', content: '请继续。' },
    { id: '2', label: '同意', content: '我同意这个观点。' },
    { id: '3', label: '思维链', content: '看来这个问题比较复杂，我们调用顺序思维工具来分析一下吧。' },
    { id: '4', label: 'Obsidian', content: '帮我创建一个obsidian风格的文档记录。' },
    { id: '5', label: '调试', content: '这段代码报错了，请帮我调试。' },
    { id: '6', label: '解释', content: '请解释这段代码的原理。' },
];

// Load Phrases and Prompts
function loadData() {
    try {
        if (fs.existsSync(customPhrasesPath)) {
            customPhrases = JSON.parse(fs.readFileSync(customPhrasesPath));
        } else {
            customPhrases = [...defaultPhrases];
            savePhrases();
        }

        // Load Prompts
        if (fs.existsSync(promptsPath)) {
            customPrompts = JSON.parse(fs.readFileSync(promptsPath));
        } else {
            customPrompts = DEFAULT_PROMPTS;
            savePrompts();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        customPhrases = [...defaultPhrases];
        customPrompts = DEFAULT_PROMPTS;
    }
}

// Initialize Data
loadData();

// Save Phrases Helper
function savePhrases() {
    try {
        fs.writeFileSync(customPhrasesPath, JSON.stringify(customPhrases, null, 2));
        // Push update to renderer
        if (sidebarWindow && !sidebarWindow.isDestroyed()) {
            sidebarWindow.webContents.send('phrases-update', customPhrases);
        }
    } catch (e) {
        console.error('Failed to save phrases:', e);
    }
}

function savePrompts() {
    try {
        fs.writeFileSync(promptsPath, JSON.stringify(customPrompts, null, 2));
        // Push update to renderer
        if (sidebarWindow && !sidebarWindow.isDestroyed()) {
            sidebarWindow.webContents.send('prompts-update', customPrompts);
        }
        if (promptManagerWindow && !promptManagerWindow.isDestroyed()) {
            promptManagerWindow.webContents.send('prompts-update', customPrompts);
        }
    } catch (e) {
        console.error('Failed to save prompts:', e);
    }
}

function createWindows() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // 1. Create Pet Window (Bottom Right)
    const petSize = 150;
    const petX = screenWidth - petSize - 50; // 50px from right
    const petY = screenHeight - petSize - 50; // 50px from bottom

    petWindow = new BrowserWindow({
        width: petSize,
        height: petSize,
        x: petX,
        y: petY,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        hasShadow: false,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Ensure it's shown
    petWindow.show();

    // 2. Create Sidebar Window (Just Above Pet)
    const sidebarWidth = 300;
    const sidebarHeight = 400; // Shorter height
    const sidebarX = petX + (petSize - sidebarWidth) / 2; // Centered relative to Pet
    // Moved sidebar LOWER (increased + value) to overlap more with the transparent part of Pet window
    // Closing the gap significantly. 
    const sidebarY = petY - sidebarHeight + 70;

    sidebarWindow = new BrowserWindow({
        width: sidebarWidth,
        height: sidebarHeight,
        x: sidebarX,
        y: sidebarY,
        frame: false,
        transparent: true,
        hasShadow: true,
        vibrancy: 'hud', // Guaranteed Dark Glass (HUD style)
        visualEffectState: 'active', // Always active state
        backgroundColor: '#00000000', // Explicitly transparent
        show: false,
        alwaysOnTop: true,
        resizable: true,
        minWidth: 300,
        minHeight: 200,
        type: 'panel',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Ensure logic follows spaces
    sidebarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    const isDev = !app.isPackaged;
    const devUrl = 'http://localhost:5173';
    const prodUrl = path.join(__dirname, '../dist/index.html');

    if (isDev) {
        petWindow.loadURL(`${devUrl}?window=pet`);
        sidebarWindow.loadURL(`${devUrl}?window=sidebar`);
    } else {
        petWindow.loadFile(prodUrl, { search: 'window=pet' });
        sidebarWindow.loadFile(prodUrl, { search: 'window=sidebar' });
    }

    // Handle Close
    petWindow.on('closed', () => (petWindow = null));
    sidebarWindow.on('closed', () => (sidebarWindow = null));

    // Window Sync: Move Sidebar when Pet moves
    // ... (unchanged)

    // IPC Handlers
    // IPC Handlers
    ipcMain.on('pet-clicked', () => {
        console.log('IPC: pet-clicked received');
        if (sidebarWindow && petWindow && !petWindow.isDestroyed()) {
            // Force calculation every time
            const petBounds = petWindow.getBounds();

            // Sidebar Dimensions
            const sbWidth = 300;
            const sbHeight = 400;
            const petSize = 150;

            // Center X
            const showX = Math.round(petBounds.x + (petSize - sbWidth) / 2);
            // Position ABOVE (gap 10px)
            const showY = Math.round(petBounds.y - sbHeight - 10);

            if (sidebarWindow.isVisible()) {
                sidebarWindow.hide();
            } else {
                // Correct Position
                sidebarWindow.setBounds({ x: showX, y: showY, width: sbWidth, height: sbHeight });

                // Aggressive Show
                sidebarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                sidebarWindow.restore(); // Un-minimize
                sidebarWindow.show();
                sidebarWindow.moveTop(); // Z-Index top
                sidebarWindow.focus();   // Input focus

                console.log('Sidebar Force SNAP to:', { x: showX, y: showY });
            }
        }
    });

    // Paste Phrase Handler
    ipcMain.on('paste-phrase', (event, text) => {
        // 1. Copy to clipboard
        clipboard.writeText(text);

        // 2. Hide window
        if (sidebarWindow) sidebarWindow.hide();

        // 3. Notify Renderer for Animation
        if (petWindow) {
            petWindow.webContents.send('paste-success');
        }

        // 4. Simulate Cmd+V (Disabled for now)
        setTimeout(() => { }, 150);
    });

    // Get History
    ipcMain.on('get-history', (event) => {
        event.sender.send('clipboard-update', clipboardHistory);
    });

    // Write to Clipboard (Silent)
    ipcMain.on('write-clipboard', (event, text) => {
        clipboard.writeText(text);

        // Notify Pet to RUN
        if (petWindow) {
            petWindow.webContents.send('paste-success');
        }
    });

    // --- NEW: Context Menu & Phrase Management ---

    ipcMain.on('get-phrases', (event) => {
        event.sender.send('phrases-update', customPhrases);
    });

    ipcMain.on('save-phrase', (event, newPhrase) => {
        customPhrases.push(newPhrase);
        savePhrases();
    });

    ipcMain.on('delete-phrase', (event, id) => {
        customPhrases = customPhrases.filter(p => p.id !== id);
        savePhrases();
    });

    // --- PROMPT MANAGER IPC ---
    ipcMain.on('get-prompts', (event) => {
        event.sender.send('prompts-update', customPrompts);
    });

    ipcMain.on('save-prompt', (event, prompt) => {
        const index = customPrompts.findIndex(p => p.id === prompt.id);
        if (index >= 0) {
            customPrompts[index] = prompt;
        } else {
            customPrompts.push(prompt);
        }
        savePrompts();
        // Notify all
        if (promptManagerWindow) promptManagerWindow.webContents.send('prompts-update', customPrompts);
        if (sidebarWindow) sidebarWindow.webContents.send('prompts-update', customPrompts);
    });

    ipcMain.on('delete-prompt', (event, id) => {
        customPrompts = customPrompts.filter(p => p.id !== id);
        savePrompts();
        // Notify all
        if (promptManagerWindow) promptManagerWindow.webContents.send('prompts-update', customPrompts);
        if (sidebarWindow) sidebarWindow.webContents.send('prompts-update', customPrompts);
    });

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

            menu.append(new MenuItem({
                label: '🧠 管理 AI 指令 (Manage Prompts)',
                click: () => {
                    createPromptManagerWindow();
                }
            }));

            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({ label: '退出 Lion', role: 'quit' }));
        }
        else if (type === 'history') {
            const textToSave = data.text || ''; // Default to empty string if undefined
            if (!textToSave) return; // Skip if empty

            // Truncate label for display
            const displayLabel = textToSave.length > 10 ? textToSave.substring(0, 10) + '...' : textToSave;

            menu.append(new MenuItem({
                label: `➕ 添加到常用语: "${displayLabel}"`,
                click: () => {
                    const newPhrase = {
                        id: Date.now().toString(),
                        label: displayLabel,
                        content: textToSave
                    };
                    customPhrases.push(newPhrase);
                    savePhrases();
                }
            }));
            menu.append(new MenuItem({ type: 'separator' }));
            menu.append(new MenuItem({ label: '复制 (Copy)', role: 'copy' }));
        }
        else if (type === 'quick-phrase') {
            menu.append(new MenuItem({
                label: '🗑️ 删除此语录 (Delete)',
                click: () => {
                    customPhrases = customPhrases.filter(p => p.id !== data.id);
                    savePhrases();
                }
            }));
        }
        else if (type === 'terminal') {
            menu.append(new MenuItem({
                label: '🧹 清空并重置 (Reset Terminal)',
                click: () => {
                    // Send signal to renderer
                    event.sender.send('terminal-reset');
                }
            }));
        }

        menu.popup(BrowserWindow.fromWebContents(event.sender));
    });


    // --- TERMINAL SYSTEM (Spawn / Streaming) ---

    // Directory Selector
    ipcMain.handle('select-directory', async () => {
        const { dialog } = require('electron');
        const win = sidebarWindow || BrowserWindow.getFocusedWindow();
        if (win) win.setAlwaysOnTop(false);
        const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
        if (win) win.setAlwaysOnTop(true);
        if (result.canceled) return null;
        return result.filePaths[0];
    });

    let activeTerminalProcess = null;

    ipcMain.on('spawn-command', (event, { command, cwd }) => {
        if (activeTerminalProcess) {
            event.sender.send('terminal-data', '\n⚠️  Error: Process already running. Stop it first.\n');
            return;
        }

        const { spawn } = require('child_process');

        // Use user's default shell
        const shell = process.env.SHELL || '/bin/bash';

        // Use provided CWD or default to Home
        const targetCwd = cwd || app.getPath('home');

        event.sender.send('terminal-data', `\n🚀 Spawning: ${command}\n📂 In: ${targetCwd}\n---\n`);

        try {
            activeTerminalProcess = spawn(shell, ['-c', command], {
                cwd: targetCwd,
                env: process.env, // Inherit PATH
                detached: false
            });

            activeTerminalProcess.stdout.on('data', (data) => {
                if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                    sidebarWindow.webContents.send('terminal-data', data.toString());
                }
            });

            activeTerminalProcess.stderr.on('data', (data) => {
                if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                    sidebarWindow.webContents.send('terminal-data', data.toString());
                }
            });

            activeTerminalProcess.on('close', (code) => {
                activeTerminalProcess = null;
                if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                    sidebarWindow.webContents.send('terminal-exit', code);
                }
            });

            activeTerminalProcess.on('error', (err) => {
                if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                    sidebarWindow.webContents.send('terminal-data', `\n❌ Spawn Error: ${err.message}\n`);
                    sidebarWindow.webContents.send('terminal-exit', 1);
                }
                activeTerminalProcess = null;
            });

        } catch (e) {
            event.sender.send('terminal-data', `\n❌ Execution Error: ${e.message}\n`);
            activeTerminalProcess = null;
        }
    });

    ipcMain.on('kill-command', () => {
        if (activeTerminalProcess) {
            activeTerminalProcess.kill(); // Default SIGTERM
            activeTerminalProcess = null;
            if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                sidebarWindow.webContents.send('terminal-data', '\n🛑 Process terminated by user.\n');
                sidebarWindow.webContents.send('terminal-exit', -1);
            }
        }
    });
} // End createWindows function

function createPromptManagerWindow() {
    if (promptManagerWindow && !promptManagerWindow.isDestroyed()) {
        promptManagerWindow.show();
        promptManagerWindow.focus();
        return;
    }

    promptManagerWindow = new BrowserWindow({
        width: 900,
        height: 600,
        title: '🦁 AI Prompt Manager',
        frame: false,
        transparent: true,
        vibrancy: 'hud', // Dark Glass
        visualEffectState: 'active',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    const isDev = !app.isPackaged;
    const devUrl = 'http://localhost:5173';

    const startUrl = isDev
        ? `${devUrl}?window=prompt-manager`
        : `file://${path.join(__dirname, '../dist/index.html')}?window=prompt-manager`;

    promptManagerWindow.loadURL(startUrl);

    promptManagerWindow.on('closed', () => {
        promptManagerWindow = null;
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Focus existing window if someone tries to run it again
        if (petWindow) {
            if (petWindow.isMinimized()) petWindow.restore();
            petWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindows();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindows();
            }
        });

        // Custom Lock for Dragging
        let dragInterval = null;

        ipcMain.on('start-drag', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (!win) return;

            const startPos = screen.getCursorScreenPoint();
            const startWinPos = win.getPosition();

            if (dragInterval) clearInterval(dragInterval);

            dragInterval = setInterval(() => {
                const currentPos = screen.getCursorScreenPoint();
                const deltaX = currentPos.x - startPos.x;
                const deltaY = currentPos.y - startPos.y;

                win.setPosition(startWinPos[0] + deltaX, startWinPos[1] + deltaY);
            }, 16); // ~60fps
        });

        ipcMain.on('end-drag', () => {
            if (dragInterval) {
                clearInterval(dragInterval);
                dragInterval = null;
            }
        });

        // Clipboard Polling (Keep existing logic)
        // Clipboard Polling (Keep existing logic)
        setInterval(() => {
            const text = clipboard.readText();
            if (text && text.trim() !== '') {
                // Check against last captured content (handle object structure)
                const lastContent = clipboardHistory.length > 0 ? clipboardHistory[0].content : '';

                if (text !== lastContent) {
                    const newItem = {
                        id: Date.now().toString(),
                        content: text,
                        type: 'text',
                        timestamp: Date.now()
                    };

                    clipboardHistory.unshift(newItem);
                    if (clipboardHistory.length > 50) clipboardHistory.pop();

                    if (sidebarWindow && !sidebarWindow.isDestroyed()) {
                        // Send the SINGLE new item to match renderer logic (or modify renderer to accept list)
                        // Actually renderer handles both, but let's send the single item for efficiency or full list?
                        // Main logic sends FULL list currently for 'clipboard-update' usually?
                        // Wait, renderer logic: 
                        // window.electronAPI.onClipboardUpdate((newItem) => { if (Array.isArray(newItem)) ... else ... })
                        // So sending the single newItem is cleaner!
                        sidebarWindow.webContents.send('clipboard-update', newItem);
                    }
                }
            }
        }, 1000);
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
