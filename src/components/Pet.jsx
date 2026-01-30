import React, { useState, useEffect } from 'react';

// Import processed assets
import lionMaster from '../assets/lion_master.png';
import lionSleep from '../assets/lion_sleep.png';
import lionStand from '../assets/lion_stand.png';
import lionRun from '../assets/lion_run.png';

export default function Pet() {
    const [petState, setPetState] = useState('idle'); // idle, sleep, interact, run
    const [imageSrc, setImageSrc] = useState(lionMaster);

    // Auto-sleep logic
    useEffect(() => {
        let sleepTimer;
        if (petState === 'idle') {
            sleepTimer = setTimeout(() => {
                setPetState('sleep');
            }, 5000); // Sleep after 5s inactivity
        }
        return () => clearTimeout(sleepTimer);
    }, [petState]);

    // Update Image based on State
    useEffect(() => {
        switch (petState) {
            case 'idle': setImageSrc(lionMaster); break;
            case 'sleep': setImageSrc(lionSleep); break;
            case 'interact': setImageSrc(lionStand); break; // Click/Hover
            case 'run': setImageSrc(lionRun); break; // Success action
            default: setImageSrc(lionMaster);
        }
    }, [petState]);

    const toggleSidebar = () => {
        setPetState('interact');
        window.electronAPI?.toggleSidebar();
        if (petState !== 'run') { // Don't interrupt run
            setTimeout(() => setPetState('idle'), 3000);
        }
    };

    // Listen for copy success event
    useEffect(() => {
        const handlePasteSuccess = () => {
            setPetState('run');
            setTimeout(() => setPetState('idle'), 3000);
        };

        window.electronAPI?.onPasteSuccess(handlePasteSuccess);
    }, []);

    // Custom Drag & Click Logic
    const dragStartRef = React.useRef({ x: 0, y: 0, time: 0 });

    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        window.electronAPI?.startDrag(Math.round(e.clientX), Math.round(e.clientY));
    };

    const handleMouseUp = (e) => {
        window.electronAPI?.endDrag();

        // Calculate Delta
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const dt = Date.now() - dragStartRef.current.time;

        // If moved less than 5px and faster than 500ms, treat as Click
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5 && dt < 500) {
            console.log("Pet: Detected Click");
            toggleSidebar();
        }
    };
    // Removed onClick to prevent conflict
    // onContextMenu remains
    const handleContextMenu = (e) => {
        e.preventDefault();
        window.electronAPI?.showContextMenu('pet', {});
    };

    return (
        // Maximize container usage within the 250px window
        <div className="group relative w-full h-full flex items-center justify-center overflow-visible">

            {/* Clickable Area & Wrapper - Now Handles Drag too */}
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => {
                    if (petState === 'sleep') setPetState('idle');
                }}
                className="
            relative z-10 
            flex items-center justify-center
            cursor-move
            transition-all duration-300
            hover:scale-105
            animate-float
        "
            >
                {/* 3D Lion Image */}
                <img
                    key={imageSrc} // Force re-mount on src change to prevent ghosting
                    src={imageSrc}
                    alt="Lion Pet"
                    className="w-52 h-52 object-contain filter drop-shadow-2xl transition-all duration-300 transform-gpu"
                    draggable="false"
                    style={{
                        transform: petState === 'run' ? 'translateX(10px)' : 'none',
                        imageRendering: 'high-quality'
                    }}
                />

                {/* Sleep Bubble */}
                {petState === 'sleep' && (
                    <div className="absolute top-10 right-4 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-bold animate-bounce shadow-lg z-30 pointer-events-none">
                        zzZZ...
                    </div>
                )}
            </div>

        </div>
    );
}
