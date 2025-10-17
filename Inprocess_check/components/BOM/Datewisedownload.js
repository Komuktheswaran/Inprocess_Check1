import React, { useState, useEffect } from 'react';
import '../../styles/Downloads.css';
import '../../styles/themes.css';
import ApiService from '../../services/ApiService';

const Datewisedownload = ({ navigation }) => {
 
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

export default Datewisedownload;
