// components/MenuScreen.js
import React from "react";
import "../../styles/MenuScreen.css";

const MenuScreen = ({ navigation, route }) => {
  const { appType } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  return (
    <div className="menu-container">
      <div className="menu-header">
        <h1 className="menu-title">{appTitle} Application</h1>
        <p className="menu-subtitle">Select a master module to continue</p>
      </div>

      <div className="menu-button-grid">
        {/* Create Parameter Master */}
        <button
          className="menu-button menu-button-master"
          onClick={() => navigation.navigate("MasterScreen", { appType })}
        >
          <div className="menu-button-content">
            <span className="menu-button-icon">📋</span>
            <span className="menu-button-text">Create Parameter Master</span>
            <span className="menu-button-subtext">
              Define and manage quality parameters
            </span>
          </div>
          <span className="menu-button-arrow">→</span>
        </button>

        {/* Enter Details Master */}
        <button
          className="menu-button menu-button-enter"
          onClick={() => navigation.navigate("EnterDetailsMaster", { appType })}
        >
          <div className="menu-button-content">
            <span className="menu-button-icon">📝</span>
            <span className="menu-button-text">Enter Details Master</span>
            <span className="menu-button-subtext">
              Record quality measurements and data
            </span>
          </div>
          <span className="menu-button-arrow">→</span>
        </button>

        {/* Download Master */}
        <button
          className="menu-button menu-button-download"
          onClick={() => navigation.navigate("DownloadMaster", { appType })}
        >
          <div className="menu-button-content">
            <span className="menu-button-icon">📥</span>
            <span className="menu-button-text">Download Master</span>
            <span className="menu-button-subtext">
              Export and download quality reports
            </span>
          </div>
          <span className="menu-button-arrow">→</span>
        </button>
      </div>

      <button
        className="btn-outline back-button"
        onClick={() => navigation.goBack()}
      >
        ← Back to Application Selection
      </button>
    </div>
  );
};

export default MenuScreen;
