// src/components/SnackResult.jsx
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export default function SnackResult() {
  const { scanResult, rewardPoints } = useContext(AppContext);

  if (!scanResult) return null;

  return (
    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
      <h3>Scanned: {scanResult.name}</h3>
      <p>Calories: {scanResult.calories}</p>
      <p>Try this instead: {scanResult.alternative}</p>
      <p>+{scanResult.reward} points earned</p>
      <p>Total Points: {rewardPoints}</p>
    </div>
  );
}
