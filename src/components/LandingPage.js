import React from 'react';
import './LandingPage.css';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/auth');
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="landing-container">
      {/* Logo */}
      <img src={logo} className="landing-logo" alt="CAPACITI logo" />

      {/* Title and Description */}
      <h1 className="landing-title">Welcome to the Resource Hub</h1>
      <p className="landing-description">
        Streamline your digital resource requests with our AI-powered system. Get started today!
      </p>

      {/* Feature Cards */}
      <div className="feature-cards">
        <div className="card">
          <h2>Effortless Resource Requests</h2>
          <p>Streamline your resource requests with our easy-to-use system.</p>
          <button className="read-more-button">Read More</button>
        </div>
        <div className="card">
          <h2>AI-Powered Recommendations</h2>
          <p>Get personalized resource recommendations based on your needs.</p>
          <button className="read-more-button">Read More</button>
        </div>
        <div className="card">
          <h2>Centralized Resource Management</h2>
          <p>Manage all your resources in one place efficiently and effectively.</p>
          <button className="read-more-button">Read More</button>
        </div>
      </div>

      {/* Buttons */}
      <div className="landing-buttons">
        <button onClick={handleRegister} className="get-started-button">Get Started SignIn/SignUp</button>
        {/* Back button removed since this is now the root page */}
      </div>
    </div>
  );
};

export default LandingPage;
