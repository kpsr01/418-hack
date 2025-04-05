// src/context/AppContext.jsx
import { createContext, useState, useCallback } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [scanResult, setScanResult] = useState(null);
  const [rewardPoints, setRewardPoints] = useState(0);

  // This function might be used elsewhere or could be deprecated if
  // the main point logic is now solely driven by LLM comparison in Scanner
  const updateScan = useCallback((result) => {
    setScanResult(result);
    // We are removing the points update from here as Scanner will call addPoints directly
    // setRewardPoints((prev) => prev + (result?.reward || 0));

    // Remove the alert from here, as Scanner handles the modal
    // if (result && result.reward > 0) {
    //   window.alert(`+${result.reward} points added`);
    // }
  }, []);

  // New function specifically to add points from any source
  const addPoints = useCallback((pointsToAdd) => {
    if (typeof pointsToAdd === 'number' && pointsToAdd > 0) {
      setRewardPoints((prev) => {
        console.log(`Adding ${pointsToAdd} points to ${prev}. New total will be ${prev + pointsToAdd}`); // Log accurately
        return prev + pointsToAdd;
      });
    }
  }, []); // REMOVE rewardPoints from dependency array

  return (
    <AppContext.Provider value={{
      scanResult,
      setScanResult: updateScan, // Keep updateScan for potential other uses of scanResult
      rewardPoints,             // Provide the total points
      addPoints                 // Provide the function to add points
    }}>
      {children}
    </AppContext.Provider>
  );
}
