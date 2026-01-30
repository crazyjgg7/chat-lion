const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleSidebar: () => ipcRenderer.send('pet-clicked'),
    pastePhrase: (text) => ipcRenderer.send('paste-phrase', text),
    onClipboardUpdate: (callback) => ipcRenderer.on('clipboard-update', (event, history) => callback(history)),
    onPasteSuccess: (callback) => ipcRenderer.on('paste-success', () => callback()),
    removeClipboardListener: () => ipcRenderer.removeAllListeners('clipboard-update'),
    getHistory: () => ipcRenderer.send('get-history'),
    openExternal: (url) => require('electron').shell.openExternal(url),
    runTerminalCommand: (type, command) => ipcRenderer.send('run-terminal-command', type, command),
    startDrag: (x, y) => ipcRenderer.send('start-drag', x, y),
    writeClipboard: (text) => ipcRenderer.send('write-clipboard', text),
    endDrag: () => ipcRenderer.send('end-drag'),

    // Phrase Management
    getPhrases: () => ipcRenderer.send('get-phrases'),
    onPhrasesUpdate: (callback) => ipcRenderer.on('phrases-update', (event, phrases) => callback(phrases)),
    removePhraseListener: () => ipcRenderer.removeAllListeners('phrases-update'),

    // Context Menu
    showContextMenu: (type, data) => ipcRenderer.send('show-context-menu', { type, data }),

    // Navigation (Pet Menu -> Sidebar Tab)
    onNavigateTab: (callback) => ipcRenderer.on('navigate-tab', (event, tabId) => callback(tabId)),

    // Live Terminal (Spawn & Stream)
    spawnCommand: (command, cwd) => ipcRenderer.send('spawn-command', { command, cwd }),
    killCommand: () => ipcRenderer.send('kill-command'),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    onTerminalData: (callback) => ipcRenderer.on('terminal-data', (event, data) => callback(data)),
    onTerminalExit: (callback) => ipcRenderer.on('terminal-exit', (event, code) => callback(code)),
    onTerminalReset: (callback) => ipcRenderer.on('terminal-reset', () => callback()),
    removeTerminalListeners: () => {
        ipcRenderer.removeAllListeners('terminal-data');
        ipcRenderer.removeAllListeners('terminal-exit');
    }
});
