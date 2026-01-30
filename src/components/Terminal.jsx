import React, { useState, useEffect, useRef } from 'react';

export default function Terminal() {
    // Basic State
    const [outputLog, setOutputLog] = useState(['🦁 Lion Terminal Ready', 'Type command...']);
    const [input, setInput] = useState('');
    const [cwd, setCwd] = useState('~');
    const [fullCwd, setFullCwd] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Process Tracking
    const activeProcessRef = useRef(false);

    // Initial Listeners
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onTerminalData((data) => {
                setOutputLog(prev => [...prev, data]);
            });

            window.electronAPI.onTerminalExit((code) => {
                setIsRunning(false);
                setOutputLog(prev => [...prev, `Process exited (${code})`]);
            });

            if (window.electronAPI.onTerminalReset) {
                window.electronAPI.onTerminalReset(() => {
                    handleStop();
                    setOutputLog(['Reset Complete.', 'Ready.']);
                    setInput('');
                    setIsRunning(false);
                });
            }

            return () => {
                window.electronAPI.removeTerminalListeners();
            };
        }
    }, [fullCwd]);

    useEffect(() => { activeProcessRef.current = isRunning; }, [isRunning]);

    const handleCommand = (cmd) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;
        if (trimmed === 'clear') { setOutputLog([]); return; }

        // Add command to log
        setOutputLog(prev => [...prev, `> ${trimmed}`]);
        setIsRunning(true);
        if (window.electronAPI) window.electronAPI.spawnCommand(trimmed, fullCwd || null);
    };

    const handleStop = () => { if (window.electronAPI) { window.electronAPI.killCommand(); setIsRunning(false); } };

    const handleSelectDir = async () => {
        if (window.electronAPI?.selectDirectory) {
            const path = await window.electronAPI.selectDirectory();
            if (path) {
                setFullCwd(path);
                setCwd(path.split('/').pop() || path);
                setOutputLog(prev => [...prev, `📂 Switched: ${path}`]);
            }
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isRunning) { handleCommand(input); setInput(''); } }
    };

    // Global Ctrl+C
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'c') {
                if (activeProcessRef.current) {
                    handleStop();
                    setOutputLog(prev => [...prev, `^C`]);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleContextMenu = (e) => { e.preventDefault(); if (window.electronAPI?.showContextMenu) window.electronAPI.showContextMenu('terminal', {}); };

    // The Magic: Get only the last 5 relevant lines
    const visibleLogs = outputLog
        .filter(line => line.trim() !== '')
        .slice(-5);

    return (
        // Reverting to Transparent Background for Dark Glass Effect
        <div
            className="absolute inset-0 flex flex-col w-full h-full font-mono text-xs overflow-hidden bg-transparent"
            onContextMenu={handleContextMenu}
        >
            {/* 1. Header Area - Dark Mode */}
            <div className="h-8 px-4 flex items-center justify-between shrink-0 select-none opacity-80" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-2 text-white">
                    <span>{isRunning ? '⏳' : '🦁'}</span>
                    <span className="truncate max-w-[150px] font-semibold text-gray-200" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{cwd}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Folder Button - Standard */}
                    <button
                        onClick={handleSelectDir}
                        className="p-1 rounded transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                        title="Change Directory"
                    >
                        📂
                    </button>

                    {isRunning && (
                        <button onClick={handleStop} className="text-[9px] bg-red-500/20 hover:bg-red-500/40 text-red-300 px-1.5 py-0.5 rounded font-bold uppercase transition-colors border border-red-500/30">
                            STOP
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Top Spacer */}
            <div className="flex-1" />

            {/* 3. Log Output Area - White Text */}
            <div className="flex flex-col justify-end px-4 pb-2 pt-4">
                {visibleLogs.map((line, i) => (
                    <div key={i} className="mb-1 break-all leading-relaxed border-l-2 border-transparent hover:border-blue-400/50 pl-2 transition-colors">
                        {line.startsWith('>') ? (
                            <span className="text-blue-400 font-bold">{line}</span>
                        ) : (
                            <span className="text-gray-200" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.8)' }}>{line}</span>
                        )}
                    </div>
                ))}
            </div>

            {/* 4. Input Footer - Dark Background + White Text */}
            <div className="h-12 flex items-center gap-2 px-3 shrink-0 z-10 transition-none"
                style={{
                    backgroundColor: 'rgba(30,30,30,0.6)',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                <span className="text-green-400 font-bold">➜</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    disabled={isRunning}
                    className={`flex-1 bg-transparent border-none outline-none font-bold placeholder-gray-500 text-sm ${isRunning ? 'text-gray-500 cursor-not-allowed' : 'text-white'}`}
                    placeholder={isRunning ? "Processing..." : "Command..."}
                    style={{
                        color: isRunning ? '#888' : '#ffffff', // Force White
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}
                    autoFocus
                />
            </div>
        </div>
    );
}
