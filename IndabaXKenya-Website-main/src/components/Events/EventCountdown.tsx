"use client";

// ═══════════════════════════════════════════════════════════════════════
// EVENT COUNTDOWN - Client Component
// ═══════════════════════════════════════════════════════════════════════
// Countdown timer for upcoming events - updates every second
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";

interface EventCountdownProps {
  endDate: string;
}

const EventCountdown: React.FC<EventCountdownProps> = ({ endDate }) => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDateTime = new Date(endDate).getTime();
      const now = new Date().getTime();
      const timeRemaining = endDateTime - now;

      if (timeRemaining > 0) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately on mount
    calculateTimeLeft();

    // Then update every second
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="event-countdown-box">
      <div className="countdown-wrapper">
        <div className="countdown-item">
          <span className="countdown-value">{countdown.days}</span>
          <span className="countdown-label">Days</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.hours}</span>
          <span className="countdown-label">Hours</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.minutes}</span>
          <span className="countdown-label">Minutes</span>
        </div>
        <div className="countdown-item">
          <span className="countdown-value">{countdown.seconds}</span>
          <span className="countdown-label">Seconds</span>
        </div>
      </div>
    </div>
  );
};

export default EventCountdown;
