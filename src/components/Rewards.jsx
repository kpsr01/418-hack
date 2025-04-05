import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import './Rewards.css'; // We'll create this CSS file next

// --- IMPORT IMAGES --- 
// Ensure these files exist in src/components/images/
import appleLogo from './images/Apple-Logo.png'; // Placeholder/fallback
// Removed unused imports for now
// import amazonLogo from './images/amazon.png'; // Assumed filename
// import starbucksLogo from './images/starbucks.png'; // Assumed filename
// import movieLogo from './images/movie.png'; // Assumed filename
// import visaLogo from './images/visa.png'; // Assumed filename
// import fitnessLogo from './images/fitness.png'; // Assumed filename
// import earbudsLogo from './images/earbuds.png'; // Assumed filename
// import bottleLogo from './images/bottle.png'; // Assumed filename

// Placeholder logos (replace with actual image URLs or components later)
// We don't need this array anymore if we use the same logo for all cards
// const placeholderLogos = [
//   'Logo 1', 'Logo 2', 'Logo 3', 'Logo 4', 'Logo 5', 'Logo 6',
//   'Logo 7', 'Logo 8', 'Logo 9', 'Logo 10', 'Logo 11', 'Logo 12',
// ];

// Define sample reward data with specific logos - REVERTED to appleLogo
const rewardsData = [
  { id: 1, name: '$5 Amazon Gift Card', points: 50, logo: appleLogo },
  { id: 2, name: '$10 Starbucks Card', points: 100, logo: appleLogo },
  { id: 3, name: 'Movie Ticket Voucher', points: 120, logo: appleLogo },
  { id: 4, name: '$25 Visa Gift Card', points: 250, logo: appleLogo },
  { id: 5, name: 'Premium Fitness App Subscription (1 Month)', points: 80, logo: appleLogo },
  { id: 6, name: '$50 Amazon Gift Card', points: 500, logo: appleLogo },
  { id: 7, name: 'Wireless Earbuds', points: 1000, logo: appleLogo },
  { id: 8, name: 'Smart Water Bottle', points: 750, logo: appleLogo },
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