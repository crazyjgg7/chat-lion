import React, { useState, useEffect } from 'react';

export default function QuickPhrases() {
    const [phrases, setPhrases] = useState([]);

    // Restore Dynamic Logic
    useEffect(() => {
        if (window.electronAPI) {
            // 1. Listen for updates
            window.electronAPI.onPhrasesUpdate((data) => {
                setPhrases(data || []);
            });

            // 2. Request initial data
            window.electronAPI.getPhrases();

            return () => {
                window.electronAPI.removePhraseListener();
            };
        }
    }, []);

    const handlePhraseClick = (content) => {
        if (window.electronAPI) {
            window.electronAPI.pastePhrase(content); // Use pastePhrase for instant visual feedback + paste
        }
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        if (window.electronAPI?.showContextMenu) {
            // Correct type for deletion logic in main.js
            window.electronAPI.showContextMenu('quick-phrase', item);
        }
    };

    return (
        <div className="absolute inset-0 flex flex-col w-full h-full font-sans bg-transparent">
            {/* Header */}
            <div className="h-8 px-4 flex items-center shrink-0">
                <span className="text-[10px] font-bold text-white tracking-widest uppercase opacity-80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    My Shortcuts
                </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
                {/* Empty State */}
                {phrases.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-2 text-center px-4">
                        <span className="text-2xl opacity-60">⚡️</span>
                        <span className="text-xs">No phrases yet.</span>
                        <span className="text-[10px] opacity-70">Right-click items in "History" to save them here.</span>
                    </div>
                )}

                {/* Grid of Phrases */}
                <div className="grid grid-cols-2 gap-2">
                    {phrases.map((item, i) => (
                        <button
                            key={item.id || i}
                            onClick={() => handlePhraseClick(item.content)}
                            onContextMenu={(e) => handleContextMenu(e, item)}
                            // FORCE DARK BACKGROUND AND WHITE TEXT
                            className="text-left px-3 py-3 rounded-xl transition-all active:scale-95 group focus:outline-none flex flex-col backdrop-blur-md relative overflow-hidden"
                            style={{
                                backgroundColor: 'rgba(30, 30, 30, 0.75)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white'
                            }}
                        >
                            <div className="text-xs font-bold text-white truncate w-full flex items-center gap-1.5" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>
                                <span className="text-yellow-400">⚡️</span> {item.label || 'Phrase'}
                            </div>
                            <div className="text-[10px] text-gray-300 mt-1 truncate w-full opacity-90 font-medium">
                                {item.content}
                            </div>

                            {/* Hover Highlight Overlay */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
