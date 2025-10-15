// components/OptionDetailScreen.js
import React from "react";
import "../styles/OptionDetailScreen.css";

const OptionDetailScreen = ({ navigation, route }) => {
  const { appType, option } = route.params;
  const appTitle = appType === "inprocess" ? "In-Process" : "BOM";

  const getOptionTitle = () => {
    switch (option) {
      case "master":
        return "Master";
      case "enterdetails":
        return "Enter Details";
      case "download":
        return "Download Details";
      default:
        return "";
    }
  };

  const getOptionDescription = () => {
    switch (option) {
      case "master":
        return "Create and manage parameters for your application. Set up measurement criteria and quality standards.";
      case "enterdetails":
        return "Enter and submit data details. Record measurements and observations according to defined parameters.";
      case "download":
        return "Select filtering method and download data. Export your records using various filtering options.";
      default:
        return "";
    }
  };

  const handleAction = () => {
    if (option === "master") {
      navigation.navigate("CreateParameter", { appType });
    } else if (option === "enterdetails") {
      navigation.navigate("EnterDetails", { appType });
    } else if (option === "download") {
      navigation.navigate("DownloadOptions", { appType });
    }
  };

  const getActionButtonText = () => {
    switch (option) {
      case "master":
        return "Open Create Parameter";
      case "enterdetails":
        return "Open Enter Details";
      case "download":
        return "View Download Options";
      default:
        return "Continue";
    }
  };

  const getOptionIcon = () => {
    switch (option) {
      case "master":
        return "⚙️";
      case "enterdetails":
        return "📝";
      case "download":
        return "📥";
      default:
        return "📄";
    }
  };

  return (
    <div className="option-detail-container">
      <div className="option-detail-content">
        <div className="option-detail-header">
          <div className="option-detail-icon">{getOptionIcon()}</div>
          <h1 className="option-detail-title">
            {appTitle} - {getOptionTitle()}
          </h1>
        </div>

        <div className="option-detail-info-card">
          <h3 className="option-detail-info-title">What you can do here</h3>
          <p className="option-detail-info-text">{getOptionDescription()}</p>
        </div>

        <button className="option-detail-action-button" onClick={handleAction}>
          <span className="option-detail-button-text">
            {getActionButtonText()}
          </span>
          <span className="option-detail-button-arrow">→</span>
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

export default OptionDetailScreen;
