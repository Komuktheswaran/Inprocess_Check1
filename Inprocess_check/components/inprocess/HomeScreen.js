// components/HomeScreen.js
import React from 'react';

// On web builds, ensure themes.css and HomeScreen.css are loaded.
// If importing globally in App.js with Platform guard, these lines can be omitted here.
import themes from '../../styles/themes.css';

import { View, Text, TouchableOpacity, Image } from "react-native";
import '../../styles/HomeScreen.css';
import logo from '../../assets/logo.png';

const HomeScreen = ({ toggleTheme, navigation }) => {
    const goCreateParameter = () => navigation.navigate('CreateParameter');
    const goEnterDetails = () => navigation.navigate('EnterDetails');

    const openMode = (mode) => {
        const routeByMode = {
            date: 'Datewisedownload',
            shift: 'Shiftwisedownload',
            parameter: 'Parameterwisedownload',
            all: 'Downloadscreen',
        };
        const route = routeByMode[mode];
        if (route) navigation.navigate(route);
    };

    return (
        <div className="home-container">

            <div className="home-header card shadow-1">
                <h1 className="home-title">Inprocess Check System</h1>
                <p className="home-subtitle">Quality Control Management</p>
            </div>

            {/* One unified grid so all tiles share the same size and spacing */}
            <div className="home-button-grid">
                <button className="home-button home-primary-button shadow-1" onClick={goCreateParameter}>
                    <span className="home-button-content">
                        <span className="home-button-text">Create Parameter</span>
                        <span className="home-button-subtext">Define new quality parameters</span>
                    </span>
                    <span className="home-button-icon" aria-hidden>📄</span>
                </button>

                <button className="home-button shadow-1" onClick={goEnterDetails}>
                    <span className="home-button-content">
                        <span className="home-button-text">Enter Details</span>
                        <span className="home-button-subtext">Record quality measurements</span>
                    </span>
                    <span className="home-button-icon" aria-hidden>📝</span>
                </button>

                <button className="home-button shadow-1" onClick={() => openMode('date')}>
                    <span className="home-button-text">Date wise</span>
                    <span className="home-button-icon" aria-hidden>📅</span>
                </button>

                <button className="home-button shadow-1" onClick={() => openMode('shift')}>
                    <span className="home-button-text">Shift wise</span>
                    <span className="home-button-icon" aria-hidden>⏱️</span>
                </button>

                <button className="home-button shadow-1" onClick={() => openMode('parameter')}>
                    <span className="home-button-text">Parameters wise</span>
                    <span className="home-button-icon" aria-hidden>🧪</span>
                </button>

                <button className="home-button shadow-1" onClick={() => openMode('all')}>
                    <span className="home-button-text">All above</span>
                    <span className="home-button-icon" aria-hidden>⬇️</span>
                </button>
            </div>

            <div className="home-footer">
                <p className="home-footer-text">Select an option to continue</p>
            </div>
        </div>
    );
};

export default HomeScreen;
