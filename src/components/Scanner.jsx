import { useContext, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppContext } from "../context/AppContext";

export default function Scanner() {
  const { setScanResult } = useContext(AppContext);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const handleScanSuccess = (decodedText, decodedResult) => {
    console.log("✅ Scanned barcode:", decodedText);

    // Mocked scan result
    setScanResult({
      name: decodedText,
      calories: 180,
      alternative: "RX Bar Chocolate Sea Salt",
      reward: 20,
    });

    html5QrCodeRef.current
      .stop()
      .then(() => {
        console.log("Scanner stopped after scan");
        setScanning(false);
      })
      .catch((err) => console.error("Error stopping scanner:", err));
  };

  const startScanner = async () => {
    setScanning(true);
    setError(null);

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const html5QrCode = new Html5Qrcode("scanner", {
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true, // Barcode scanning enabled
      },
    });
    html5QrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScanSuccess,
        (scanError) => {
          console.log("Scanning...", scanError);
        }
      );
    } catch (err) {
      setError("Failed to start camera. Check permissions or browser support.");
      console.error("Scanner init error:", err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      {!scanning && (
        <button onClick={startScanner} style={{ padding: "0.5rem 1rem" }}>
          Start Barcode Scan
        </button>
      )}
      <div
        id="scanner"
        style={{
          width: "320px",
          height: "320px",
          margin: "1rem auto",
          border: scanning ? "2px solid #0f0" : "2px dashed #999",
        }}
      ></div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
