// src/utils/scannerUtils.js
import { Html5Qrcode } from "html5-qrcode";

export async function startScanner(elementId, onScanSuccess) {
  const scanner = new Html5Qrcode(elementId);

  const config = {
    fps: 10,
    qrbox: 250,
    aspectRatio: 1.0,
  };

  await scanner.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      onScanSuccess(decodedText);
      scanner.stop(); // stop after successful scan
    },
    (error) => {
      console.warn("Scan error:", error);
    }
  );
}
