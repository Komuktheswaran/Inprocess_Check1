import React, { useEffect, useMemo, useState, useRef } from "react";
import "../../styles/EnterDetailsScreen.css";
import ApiService from "../../services/ApiService";

const EnterDetailsScreen = ({ navigation }) => {  
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#2c3e50",
          color: "#ecf0f1",
        }}
      >
        <h1>🚧 Page Under Development 🚧</h1>
        <p>
          This feature is currently being built.
          <br />
          Please check back soon.
        </p>
      </div>
    );

};

export default EnterDetailsScreen;
