"use client";

import React, { useEffect, useState } from "react";

const GoTop = () => {
  // The back-to-top button is hidden at the beginning
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 150) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup listener on unmount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // This function will scroll the window to the top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // for smoothly scrolling
    });
  };

  return (
    <>
      {showButton && (
        <button
          onClick={scrollToTop}
          className="back-to-top"
          aria-label="Scroll to top"
          title="Back to top"
        >
          <i className="icofont-arrow-up" aria-hidden="true"></i>
        </button>
      )}
    </>
  );
};

export default GoTop;
