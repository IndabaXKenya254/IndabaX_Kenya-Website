// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - AOS (ANIMATE ON SCROLL) INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════
// Version: 1.0
// Date: October 16, 2025
// Description: Client-side AOS initialization component for scroll animations
// ═══════════════════════════════════════════════════════════════════════

"use client";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

/**
 * AOSInit Component
 *
 * Initializes AOS (Animate On Scroll) library with IndabaX Kenya configuration.
 * Must be used as client component since AOS requires browser DOM access.
 *
 * Configuration:
 * - duration: 800ms - Animation duration for smooth, professional feel
 * - once: false - Animations re-trigger when scrolling up
 * - mirror: true - Animate out when scrolling past elements
 * - offset: 100px - Trigger animations 100px before element enters viewport
 *
 * @returns null - This component doesn't render anything, just initializes AOS
 */
export default function AOSInit() {
  useEffect(() => {
    // Initialize AOS with IndabaX Kenya configuration
    AOS.init({
      duration: 800,        // Animation duration in milliseconds
      once: false,          // Allow animations to re-trigger on scroll up
      mirror: true,         // Animate elements out when scrolling past them
      offset: 100,          // Offset (in px) from the original trigger point
      easing: "ease-in-out", // Easing function for animations
      delay: 0,             // No delay by default
    });

    // Refresh AOS on route changes (Next.js App Router compatibility)
    AOS.refresh();
  }, []);

  // This component doesn't render anything
  return null;
}
