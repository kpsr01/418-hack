// src/components/Scanner.jsx
import { useContext, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppContext } from "../context/AppContext";

export default function Scanner() {
  const { setScanResult } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log("Decoded:", decodedText);

    setScanResult({
      name: decodedText,
      calories: 200,
      alternative: "Kind Bar",
      reward: 10,
    });

    // Stop the scanner after a successful scan
    if (html5QrCodeRef.current && scanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          console.log("Scanner stopped after successful scan.");
          setScanning(false);
        })
        .catch((err) => console.error("Failed to stop scanner", err));
    }
  };

  const onScanFailure = (error) => {
    // This callback is optional, but can be useful for logging continuous scan errors
    // console.warn(`Code scan error = ${error}`);
  };

  const startScanner = async () => {
    setScanning(true);
    setError(null);
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      // Optional: You can add more configurations here if needed
    };

    const html5QrCode = new Html5Qrcode("scanner");
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" }, // Attempt to use the rear camera
        config,
        handleScanSuccess,
        onScanFailure // Added the onScanFailure callback
      );
    } catch (err) {
      setError("Failed to start camera. Make sure camera permission is granted.");
      console.error("Error starting scanner:", err);
      setScanning(false); // Reset scanning state on failure
    }
  };

  const stopScannerManually = () => {
    if (html5QrCodeRef.current && scanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          console.log("Scanner stopped manually.");
          setScanning(false);
        })
        .catch((err) => console.error("Failed to stop scanner manually", err));
    }
  };

  useEffect(() => {
    // Clean up if the component unmounts while scanning
    return () => {
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current
          .stop()
          .catch((err) => console.error("Failed to stop scanner on unmount", err));
      }
    };
  }, [scanning]);

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {!scanning && <button onClick={startScanner}>Start Barcode Scan</button>}
      {scanning && <button onClick={stopScannerManually}>Stop Scanner</button>} {/* Option to stop manually */}
      <div id="scanner" style={{ width: "300px", height: "300px", margin: "auto" }}></div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}