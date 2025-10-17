// components/DownloadMaster.js
import React from "react";
import "../../styles/DownloadMaster.css";

const MasterScreen = ({ navigation, route }) => {
  const { appType } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  return (
    <div className="download-master-container">
      <div className="screen-header">
        <h1>Create Parameter Master</h1>
        <p className="subtitle">{appTitle} - Export Options</p>
      </div>

      <div className="content-area">
        <div className="options-grid">
          {/* Date Wise */}

          <button
            className="option-card date-wise"
            onClick={() => navigation.navigate("createparameter", appType)}
          >
            <div className="option-icon"></div>
            <div className="option-content">
              <span className="home-button-content">
                <span className="home-button-text">Create Parameter</span>
                <span className="home-button-subtext">
                  Define new quality parameters
                </span>
              </span>
              <span className="home-button-icon" aria-hidden>
                📄
              </span>
            </div>
          </button>
        </div>
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

export default MasterScreen;
