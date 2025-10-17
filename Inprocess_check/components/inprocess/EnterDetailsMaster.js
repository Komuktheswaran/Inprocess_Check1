// components/EnterDetailsMaster.js
import React from "react";
import "../../styles/EnterDetailsMaster.css";

const EnterDetailsMaster = ({ navigation, route }) => {
  const { appType } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  return (
    <div className="enter-details-master-container">
      <div className="screen-header">
        <h1>Enter Details Master</h1>
        <p className="subtitle">{appTitle} - Data Entry Options</p>
      </div>

      <div className="content-area">
        <div className="options-grid">
          {/* Enter Details Option */}
          <button
            className="option-card enter-details"
            onClick={() => navigation.navigate("EnterDetails", { appType })}
          >
            <div className="option-icon">📝</div>
            <div className="option-content">
              <h3>Enter Details</h3>
              <p>Record quality measurements</p>
            </div>
          </button>

          {/* You can add more options here if needed */}
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

export default EnterDetailsMaster;
