import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../../context/AuthContext';
import './ConfettiScreen.css';

export function ConfettiScreen() {
  const [showOptions, setShowOptions] = useState(false);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fire confetti on mount
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Show the options after 1.2s delay
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleFinish = () => {
    completeOnboarding();
    navigate('/');
  };

  return (
    <div className="confetti-screen">
      <div className="confetti-content">
        <div className="confetti-icon">🎉</div>
        <h1 className="confetti-title">You're all set!</h1>
        <p className="confetti-subtitle">Your personalized feed is ready.</p>

        <div className={`confetti-options ${showOptions ? 'visible' : ''}`}>
          <div className="options-divider" />
          <p className="options-text">Customize your feed further</p>
          
          <div className="options-buttons">
            <button className="btn-primary" onClick={handleFinish}>
              Create Persona
            </button>
            <button className="btn-secondary" onClick={handleFinish}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
