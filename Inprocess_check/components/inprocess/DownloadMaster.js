// components/DownloadMaster.js
import React from "react";
import "../../styles/DownloadMaster.css";

const DownloadMaster = ({ navigation, route }) => {
  const { appType } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  return (
    <div className="download-master-container">
      <div className="screen-header">
        <h1>Download Master</h1>
        <p className="subtitle">{appTitle} - Export Options</p>
      </div>

      <div className="content-area">
        <div className="options-grid">
          {/* Date Wise */}
          <button
            className="option-card date-wise"
            onClick={() => navigation.navigate("Datewisedownload", { appType })}
          >
            <div className="option-icon">📅</div>
            <div className="option-content">
              <h3>Date wise</h3>
              <p>Download data by date range</p>
            </div>
          </button>

          {/* Shift Wise */}
          <button
            className="option-card shift-wise"
            onClick={() =>
              navigation.navigate("Shiftwisedownload", { appType })
            }
          >
            <div className="option-icon">🕐</div>
            <div className="option-content">
              <h3>Shift wise</h3>
              <p>Download data by shift</p>
            </div>
          </button>

          {/* Parameters Wise */}
          <button
            className="option-card parameter-wise"
            onClick={() =>
              navigation.navigate("Parameterwisedownload", { appType })
            }
          >
            <div className="option-icon">📊</div>
            <div className="option-content">
              <h3>Parameters wise</h3>
              <p>Download by parameter type</p>
            </div>
          </button>

          {/* All Above */}
          <button
            className="option-card all-above"
            onClick={() => navigation.navigate("Downloadscreen", { appType })}
          >
            <div className="option-icon">⬇️</div>
            <div className="option-content">
              <h3>All above</h3>
              <p>Complete data export</p>
            </div>
          </button>
        </div>
      </div>

      <button
        className="btn-outline back-button"
        onClick={() => navigation.goBack()}
      >
        ← Back to Menu
      </button>
    </div>
  );
};

export default DownloadMaster;
