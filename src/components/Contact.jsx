import React from 'react';
import './Contact.css'; // We'll create this CSS file next

export default function Contact() {
  return (
    <div className="contact-container">
      <h2>Contact Us</h2>
      <p>For inquiries, please reach out to us:</p>
      <div className="contact-details">
        <p><strong>Email:</strong> support@snackscan.app (dummy)</p>
        <p><strong>Phone:</strong> +1 (555) 123-4567 (dummy)</p>
      </div>
      <p className="coming-soon-text">More contact options coming soon!</p>
    </div>
  );
} 