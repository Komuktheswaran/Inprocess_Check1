// components/ApplicationSelectionScreen.js
import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import "../styles/ApplicationSelection.css";

import logo from "../assets/logo.png";

const ApplicationSelectionScreen = ({ navigation, theme }) => {
  const selectApplication = (appType) => {
    if (appType === "inprocess") {
      navigation.navigate("MenuScreen", { appType });
    } else if (appType === "bom") {
      navigation.navigate("bommenuscreen", { appType }); // Point to BOM's menu or entry screen
    }
  };

  return (
    <div className="app-selection-container">
      <div className="app-selection-header">
        <img src={logo} alt="Logo" className="app-selection-logo" />
        <h1 className="app-selection-title">Select Application</h1>
        <p className="app-selection-subtitle">
          Choose an application to continue
        </p>
      </div>

      <div className="app-selection-button-grid">
        <button
          className="app-selection-button app-selection-primary"
          onClick={() => selectApplication("inprocess")}
        >
          <div className="app-selection-button-content">
            <span className="app-selection-button-text">In-Process</span>
            <span className="app-selection-button-subtext">
              Quality Control Management
            </span>
          </div>
          <span className="app-selection-button-icon">→</span>
        </button>

        <button
          className="app-selection-button app-selection-secondary"
          onClick={() => selectApplication("bom")}
        >
          <div className="app-selection-button-content">
            <span className="app-selection-button-text">BOM</span>
            <span className="app-selection-button-subtext">
              Bill of Materials
            </span>
          </div>
          <span className="app-selection-button-icon">→</span>
        </button>
      </div>
    </div>
  );
};

export default ApplicationSelectionScreen;
