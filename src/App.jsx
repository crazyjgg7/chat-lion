import React, { useState, useEffect } from 'react';
import Pet from './components/Pet';
import Sidebar from './components/Sidebar';

function App() {
    const [windowType, setWindowType] = useState(null);

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

    return null;
}
export default App;
