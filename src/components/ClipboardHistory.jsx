import React, { useState, useEffect } from 'react';

export default function ClipboardHistory() {
    // Functional state
    const [history, setHistory] = useState([]);

    // Restore Electron Listener Logic
    useEffect(() => {
        if (window.electronAPI) {
            // 1. Setup Listener FIRST
            window.electronAPI.onClipboardUpdate((newItem) => {
                // If newItem is an array, it's the full history update (from getHistory)
                if (Array.isArray(newItem)) {
                    setHistory(newItem);
                }
                // If it's a single item, prepend it
                else if (newItem && newItem.content) {
                    setHistory(prev => {
                        if (prev.length > 0 && prev[0].content === newItem.content) return prev;
                        const unique = prev.filter(item => item.content !== newItem.content);
                        return [newItem, ...unique].slice(0, 50);
                    });
                }
            });

            // 2. Request Data
            window.electronAPI.getHistory();

            return () => {
                window.electronAPI.removeClipboardListener();
            };
        }
    }, []);

    const handleCopy = (content) => {
        if (window.electronAPI) {
            window.electronAPI.writeClipboard(content);
        }
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        // Safety check: ensure item and content exist
        if (!item || !item.content) return;

        if (window.electronAPI?.showContextMenu) {
            window.electronAPI.showContextMenu('history', { text: item.content });
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col w-full h-full font-sans bg-transparent">
            {/* Header */}
            <div className="h-8 px-4 flex items-center justify-between shrink-0">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase opacity-80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    Recent Clips
                </span>
                <span className="text-[9px] text-gray-300 opacity-70">{history.length} items</span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 select-none">
                        <span className="text-2xl opacity-60">📋</span>
                        <span className="text-xs">Clipboard is empty</span>
                    </div>
                )}

                {history.map((item, index) => (
                    <div
                        key={item.id || index}
                        onClick={() => handleCopy(item.content)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        // FORCE DARK STYLING INLINE
                        className="group flex flex-col p-3 rounded-xl cursor-pointer transition-all active:scale-95 relative overflow-hidden"
                        style={{
                            backgroundColor: 'rgba(30,30,30, 0.75)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'white'
                        }}
                        title="Click to Copy"
                    >
                        {/* Type Indicator */}
                        <div className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none"
                            style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {item.type ? item.type.toUpperCase() : 'TEXT'}
                        </div>

                        {/* Content Preview */}
                        <div className="text-xs font-medium line-clamp-3 pr-8 text-gray-100 break-all transition-colors leading-relaxed"
                            style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)', minHeight: '1.2em' }}>
                            {item.content || <span className="italic opacity-50">Empty Content</span>}
                        </div>

                        {/* Metadata Footer */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                            <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'Just now'}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-300 font-bold">Copy</span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    );
}
