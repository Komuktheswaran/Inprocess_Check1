// components/MenuScreen.js
import React from "react";
import "../styles/MenuScreen.css";

const MenuScreen = ({ navigation, route }) => {
  const { appType } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  const navigateToOption = (option) => {
    navigation.navigate("OptionDetailScreen", { appType, option });
  };

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1 className="menu-title">{appTitle} Application</h1>
        <p className="menu-subtitle">Select an option to continue</p>
      </div>

      <div className="menu-button-grid">
        <button
          className="menu-button menu-button-master"
          onClick={() => navigateToOption("master")}
        >
          <div className="menu-button-content">
            <span className="menu-button-text">Master</span>
            <span className="menu-button-subtext">
              Create and manage parameters
            </span>
          </div>
          <span className="menu-button-icon">⚙️</span>
        </button>

        <button
          className="menu-button menu-button-enter"
          onClick={() => navigateToOption("enterdetails")}
        >
          <div className="menu-button-content">
            <span className="menu-button-text">Enter Details</span>
            <span className="menu-button-subtext">
              Input data and information
            </span>
          </div>
          <span className="menu-button-icon">📝</span>
        </button>

        <button
          className="menu-button menu-button-download"
          onClick={() => navigateToOption("download")}
        >
          <div className="menu-button-content">
            <span className="menu-button-text">Download Details</span>
            <span className="menu-button-subtext">
              Export data with filters
            </span>
          </div>
          <span className="menu-button-icon">📥</span>
        </button>
      </div>
      <button
        className="btn-outline back-button"
        onClick={() => navigation.goBack()}
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default MenuScreen;
