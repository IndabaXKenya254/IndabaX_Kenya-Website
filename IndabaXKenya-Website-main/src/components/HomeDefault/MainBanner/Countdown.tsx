"use client";

import React, { useState, useEffect } from "react";

interface CountdownProps {
  endDate: string; // Format: "Month Day, Year HH:mm:ss"
}

const Countdown: React.FC<CountdownProps> = ({ endDate }) => {
  const calculateTimeLeft = () => {
    // Use the dynamic endDate prop from settings.json
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

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Calculate immediately on mount
    calculateTimeLeft();

    // Then update every second
    const interval = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  return (
    <>
      <div className="event-countdown countdown1">
        <div id="timer">
          <div id="days">
            {countdown.days} <span>Days</span>
          </div>
          <div id="hours">
            {countdown.hours} <span>Hours</span>
          </div>
          <div id="minutes">
            {countdown.minutes} <span>Minutes</span>
          </div>
          <div id="seconds">
            {countdown.seconds} <span>Seconds</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Countdown;
