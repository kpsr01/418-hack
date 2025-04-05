import React from 'react';

const ScanButton = ({ onClick, isScanning, hasProductDetails }) => {
  if (isScanning || hasProductDetails) {
    return null; // Don't render the button if scanning is active or product details are shown
  }

  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.75rem 1.5rem",
        backgroundColor: "#000",
        color: "#fff",
        border: "1px solid #000",
        borderRadius: "999px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.3s ease",
        marginBottom: "1rem",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#fff";
        e.target.style.color = "#000";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#000";
        e.target.style.color = "#fff";
      }}
    >
      Start Scan
    </button>
  );
};

export default ScanButton; 