//===========================================================
//  
//  ThemeToggle.jsx
//  A React component that provides a toggle switch for
//  switching between light and dark themes.
//  
//============================================================
import React, { useState, useEffect } from 'react';
import '../styles/ThemeToggle.css';

// ---------------------------------------------------------------------
//   Provides an interactive switch for dark/light mode.
// -------------------------------------------------------------------
const ThemeToggle = () => {
    const [isLightMode, setIsLightMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'light';
    });

    useEffect(() => {
        if (isLightMode) {
            document.documentElement.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLightMode]);

    return (
        <div className="theme-toggle-container" title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
            <label className="theme-switch">
                <input
                    type="checkbox"
                    checked={isLightMode}
                    onChange={() => setIsLightMode(!isLightMode)}
                />
                <span className="slider round" />
            </label>
        </div>
    );
};

export default ThemeToggle;
