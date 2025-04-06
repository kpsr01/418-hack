import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import './Rewards.css'; // We'll create this CSS file next

// --- IMPORT IMAGES --- 
// Import logos based on actual files found
import appleLogo from './images/Apple-Logo.png'; // Placeholder/fallback
import amazonLogo from './images/amazon.png'; // Correct import
import appstoreLogo from './images/Appstore.png'; // Import for fitness app
import primeLogo from './images/amazon-prime.png'; 
import adidasLogo from './images/adidas.png'; // Renamed
// import appstore from './images/Appstore.png'; // Removed duplicate
import dellLogo from './images/Dell.png'; // Renamed
import playstoreLogo from './images/Playstore.png'; // Renamed
import pumaLogo from './images/Puma.png'; // Renamed
import swiggyLogo from './images/Swiggy.png'; // Renamed
// Placeholder logos (replace with actual image URLs or components later)
// We don't need this array anymore if we use the same logo for all cards
// const placeholderLogos = [
//   'Logo 1', 'Logo 2', 'Logo 3', 'Logo 4', 'Logo 5', 'Logo 6',
//   'Logo 7', 'Logo 8', 'Logo 9', 'Logo 10', 'Logo 11', 'Logo 12',
// ];

// Define sample reward data using available logos - UPDATED WITH NEW LOGOS
const rewardsData = [
  { id: 1, name: '$5 Amazon Gift Card', points: 50, logo: amazonLogo }, 
  { id: 9, name: 'Adidas Voucher', points: 300, logo: adidasLogo }, // New reward
  { id: 10, name: '$20 Dell Discount', points: 200, logo: dellLogo }, // New reward
  { id: 11, name: 'Puma Store Credit', points: 250, logo: pumaLogo }, // New reward
  { id: 5, name: 'Premium Fitness App Subscription (1 Month)', points: 80, logo: appstoreLogo }, // Kept Appstore 
  { id: 6, name: '$50 Amazon Prime Credit', points: 500, logo: primeLogo }, // Using Prime Logo
  { id: 12, name: 'Swiggy Food Coupon', points: 60, logo: swiggyLogo }, // New reward
  { id: 13, name: '$10 Google Play Credit', points: 100, logo: playstoreLogo }, // New reward 
];

// Let's assume we want 12 cards for now - REMOVED, using rewardsData length now
// const numberOfCards = 12;

export default function Rewards() {
  const { rewardPoints } = useContext(AppContext);

  // Simple handler for redeem button click (does nothing for now)
  const handleRedeemClick = (pointsRequired) => {
    alert(`Redeem functionality not implemented yet. Needs ${pointsRequired} points.`);
  };

  return (
    <div className="rewards-container">
      <h2>Redeem Your Points</h2>
      <p className="points-display">Total Points: 8.6</p>
      {/* Removed Coming Soon Text */}
      {/* <p className="coming-soon-text">Feature Coming Soon!</p> */}
      <div className="rewards-grid">
        {/* Map over the actual rewards data */}
        {rewardsData.map((reward) => {
          const canRedeem = rewardPoints >= reward.points;
          return (
            <div key={reward.id} className={`reward-item ${!canRedeem ? 'disabled' : ''}`}>
              <div className="logo-placeholder">
                {/* Use the logo from reward data */}
                <img src={reward.logo} alt={`${reward.name} Logo`} />
              </div>
              {/* Display reward name and points cost */}
              <p className="reward-name">{reward.name}</p>
              <p className="reward-points">{reward.points.toLocaleString()} points</p>
              {/* Add a Redeem button */}
              <button
                className="redeem-button"
                onClick={() => handleRedeemClick(reward.points)}
                disabled={!canRedeem} // Disable if not enough points
              >
                {canRedeem ? 'Redeem' : 'Need More Points'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
} 