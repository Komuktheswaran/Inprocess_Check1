import React, { useEffect, useState } from 'react';
import ApiService from '../../services/ApiService';
import '../../styles/themes.css';
import '../../styles/Downloads.css';

const Parameterwisedownload = ({ navigation }) => { 
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

export default Parameterwisedownload;
