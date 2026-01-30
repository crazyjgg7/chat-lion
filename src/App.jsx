import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Pet from './components/Pet';
import PromptManager from './components/PromptManager';

function App() {
    const [windowType, setWindowType] = useState('pet'); // pet, sidebar, prompt-manager

    useEffect(() => {
        console.log("App: Component Mounted");
        console.log("App: Window Location Search:", window.location.search);

        const params = new URLSearchParams(window.location.search);
        const type = params.get('window');

        console.log("App: Detected Window Type:", type);

        if (type) {
            setWindowType(type);
        } else {
            console.warn("App: No specific window parameter found!");
            setWindowType('debug_fallback');
        }
    }, []);

    if (windowType === 'sidebar') {
        return <Sidebar />;
    }

    if (windowType === 'pet') {
        return <Pet />;
    }

    if (windowType === 'prompt-manager') {
        return <PromptManager />;
    }

    return null;
}
export default App;
