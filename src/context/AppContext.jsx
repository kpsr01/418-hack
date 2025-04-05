// src/context/AppContext.jsx
import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [scanResult, setScanResult] = useState(null);
  const [rewardPoints, setRewardPoints] = useState(0);

  const updateScan = (result) => {
    setScanResult(result);
    setRewardPoints((prev) => prev + (result.reward || 0));
  };

  return (
    <AppContext.Provider value={{
      scanResult,
      setScanResult: updateScan,
      rewardPoints
    }}>
      {children}
    </AppContext.Provider>
  );
}
