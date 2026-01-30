import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import Terminal from './Terminal';
import QuickPhrases from './QuickPhrases';
import ClipboardHistory from './ClipboardHistory';
import Brain from './Brain';

// Tab Definitions
const TABS = [
    { id: 'quick', label: '快速' },
    { id: 'brain', label: '思考' },
    { id: 'history', label: '历史' },
    { id: 'term', label: '命令' },
];

// Theme Configuration: APPLE WIDGET STYLE
const THEME = {
    bg: 'bg-black/40', // Darker to ensuring white text pops
    text: 'text-white',
    textSecondary: 'text-gray-300',
    border: 'border-white/10', // Subtler border
    hover: 'hover:bg-white/5',
};

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState('quick');

    // ... (Effect logic is fine)

    return (
        // Main Container: Apple Widget Style (Rounded + Glass)
        <div
            className={`w-full h-screen text-white flex flex-col overflow-hidden border ${THEME.border} shadow-2xl relative ${THEME.bg} backdrop-blur-md antialiased rounded-2xl`}
            style={{
                WebkitAppRegion: 'no-drag',
                color: 'white', // FORCE white text
                textShadow: '0 1px 2px rgba(0,0,0,0.5)' // Enhance contrast
            }}
        >
            {/* Window Drag Handle & Title */}
            <div
                className={`h-6 w-full shrink-0 flex items-center justify-center cursor-move z-50 border-b ${THEME.border} bg-black/10`}
                style={{ WebkitAppRegion: 'drag' }}
            >
                {/* Handle Bar UI */}
                <div className="w-12 h-1 rounded-full bg-white/20 transform translate-y-0.5"></div>
            </div>

            {/* Tab Header */}
            <div
                className={`flex border-b ${THEME.border} shrink-0 select-none bg-black/10`}
                style={{ WebkitAppRegion: 'no-drag' }}
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "flex-1 py-3 text-xs font-bold tracking-wider transition-all duration-200 relative overflow-hidden group uppercase focus:outline-none flex flex-col items-center gap-1",
                            activeTab === tab.id
                                ? "text-white bg-white/5 shadow-inner" // Active: Dark Glass Highlight
                                : "text-gray-400 hover:text-white hover:bg-white/5" // Inactive
                        )}
                    >
                        <span className="text-[11px] opacity-90">
                            {tab.id === 'quick' && '⚡️'}
                            {tab.id === 'brain' && '🧠'}
                            {tab.id === 'history' && '📋'}
                            {tab.id === 'term' && '⌨️'}
                        </span>
                        <span className="text-[9px] font-semibold">{tab.label}</span>

                        {/* Active Indicator Line */}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content - Transparent Background */}
            <div className="flex-1 overflow-hidden flex flex-col relative bg-transparent">
                {activeTab === 'quick' && <QuickPhrases />}

                {activeTab === 'brain' && <Brain />}

                {activeTab === 'history' && <ClipboardHistory />}

                {activeTab === 'term' && <Terminal />}
            </div>

            {/* Status Bar - Footer - Increased Height & Padding */}
            <div
                className={`h-8 flex items-center justify-center pt-1 pb-2 text-[10px] text-gray-400 font-mono tracking-wide border-t ${THEME.border} bg-black/20 backdrop-blur-sm`}
            >
                LION OS • {activeTab.toUpperCase()}
            </div>
        </div>
    );
}
