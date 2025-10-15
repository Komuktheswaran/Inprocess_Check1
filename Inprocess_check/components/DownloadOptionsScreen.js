// components/DownloadOptionsScreen.js
import React from "react";
import "../styles/DownloadOptions.css";

const DownloadOptionsScreen = ({ navigation, route }) => {
  const { appType } = route.params;

  const openDownloadMode = (mode) => {
    const routeByMode = {
      date: "Datewisedownload",
      shift: "Shiftwisedownload",
      parameter: "Parameterwisedownload",
      all: "Downloadscreen",
    };
    const routeName = routeByMode[mode];
    if (routeName) navigation.navigate(routeName, { appType });
  };

  return (
    <div className="download-options-container">
      <div className="download-options-header">
        <h1 className="download-options-title">Download Options</h1>
        <p className="download-options-subtitle">
          Select a filtering method to export data
        </p>
      </div>

      <div className="download-options-grid">
        <button
          className="download-option-button download-option-date"
          onClick={() => openDownloadMode("date")}
        >
          <div className="download-option-content">
            <span className="download-option-icon">📅</span>
            <span className="download-option-text">Date Wise Download</span>
            <span className="download-option-desc">Filter by date range</span>
          </div>
        </button>

        <button
          className="download-option-button download-option-shift"
          onClick={() => openDownloadMode("shift")}
        >
          <div className="download-option-content">
            <span className="download-option-icon">🕐</span>
            <span className="download-option-text">Shift Wise Download</span>
            <span className="download-option-desc">
              Filter by shift periods
            </span>
          </div>
        </button>

        <button
          className="download-option-button download-option-parameter"
          onClick={() => openDownloadMode("parameter")}
        >
          <div className="download-option-content">
            <span className="download-option-icon">⚙️</span>
            <span className="download-option-text">
              Parameter Wise Download
            </span>
            <span className="download-option-desc">Filter by parameters</span>
          </div>
        </button>

        <button
          className="download-option-button download-option-all"
          onClick={() => openDownloadMode("all")}
        >
          <div className="download-option-content">
            <span className="download-option-icon">📦</span>
            <span className="download-option-text">Download All</span>
            <span className="download-option-desc">Export complete data</span>
          </div>
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

export default DownloadOptionsScreen;
