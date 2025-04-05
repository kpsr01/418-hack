import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import './Rewards.css'; // We'll create this CSS file next
import appleLogo from './images/Apple-Logo.png'; // Import the logo

// Placeholder logos (replace with actual image URLs or components later)
// We don't need this array anymore if we use the same logo for all cards
// const placeholderLogos = [
//   'Logo 1', 'Logo 2', 'Logo 3', 'Logo 4', 'Logo 5', 'Logo 6',
//   'Logo 7', 'Logo 8', 'Logo 9', 'Logo 10', 'Logo 11', 'Logo 12',
// ];

// Let's assume we want 12 cards for now
const numberOfCards = 12;

export default function Rewards() {
  const { rewardPoints } = useContext(AppContext);

  return (
    <div className="rewards-container">
      <h2>Redeem Your Points</h2>
      <p className="points-display">Total Points: {rewardPoints.toFixed(1)}</p>
      <p className="coming-soon-text">Feature Coming Soon!</p>
      <div className="rewards-grid">
        {[...Array(numberOfCards)].map((_, index) => ( // Create an array to map over
          <div key={index} className="reward-item">
            {/* Use the imported image */}
            <div className="logo-placeholder">
              <img src={appleLogo} alt="Reward Logo" />
            </div>
            <p>Details coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
} 