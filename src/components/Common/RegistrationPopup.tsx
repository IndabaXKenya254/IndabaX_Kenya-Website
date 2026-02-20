"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePopupSettings } from "@/hooks/useApi";

interface PopupSettings {
  enabled: boolean;
  title: string;
  content: string;
  delay: number;
  buttonText: string;
  buttonLink: string;
  highlights?: string[]; // Optional array of highlight items
}

const RegistrationPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // React Query hook with automatic caching and deduplication
  const { data: settingData, isLoading: loading } = usePopupSettings();

  // Parse and prepare settings with defaults
  const settings = useMemo<PopupSettings | null>(() => {
    if (!settingData) return null;

    // Parse the value - it might be a JSON string or already an object
    let popupSettings: PopupSettings;
    if (typeof settingData.value === 'string') {
      popupSettings = JSON.parse(settingData.value);
    } else {
      popupSettings = settingData.value as unknown as PopupSettings;
    }

    // Add default highlights if none provided
    if (!popupSettings.highlights || popupSettings.highlights.length === 0) {
      popupSettings.highlights = [
        '3 Days of AI Excellence',
        '50+ Expert Speakers',
        'FREE for Students Only',
        'Limited Seats Available'
      ];
    }

    return popupSettings;
  }, [settingData]);

  // Simple hash function that works with Unicode
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  };

  useEffect(() => {
    if (loading || !settings) return;

    // Don't show if popup is disabled in settings
    if (!settings.enabled) {
      return;
    }

    // Create a version hash based on popup content
    // This ensures popup shows again when admin updates content
    const contentVersion = JSON.stringify({
      title: settings.title,
      content: settings.content,
      highlights: settings.highlights,
      buttonText: settings.buttonText
    });
    const versionHash = simpleHash(contentVersion);

    // Check if user dismissed THIS version of the popup
    const dismissedVersion = localStorage.getItem("indabax-popup-dismissed-version");

    // Show popup again if content has changed (different version)
    if (dismissedVersion === versionHash) {
      return; // User dismissed this specific version
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem("indabax-popup-shown", "true");
    }, settings.delay * 1000);

    return () => clearTimeout(timer);
  }, [settings, loading]);

  const handleClose = () => {
    setIsVisible(false);
    // Just close - don't mark as dismissed permanently
  };

  const handleDontShowAgain = () => {
    if (!settings) return;

    setIsVisible(false);

    // Create version hash and store it
    const contentVersion = JSON.stringify({
      title: settings.title,
      content: settings.content,
      highlights: settings.highlights,
      buttonText: settings.buttonText
    });
    const versionHash = simpleHash(contentVersion);

    // Store the version that user dismissed
    localStorage.setItem("indabax-popup-dismissed-version", versionHash);

    // Keep old key for backward compatibility
    localStorage.setItem("indabax-popup-dismissed", "true");
  };

  if (!isVisible || !settings) return null;

  return (
    <>
      <div className="registration-popup-overlay" onClick={handleClose}>
        <div
          className="registration-popup-content"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="popup-close-btn"
            onClick={handleClose}
            aria-label="Close popup"
          >
            <i className="icofont-close"></i>
          </button>

          <div className="popup-header">
            <div className="popup-icon">
              <i className="icofont-megaphone"></i>
            </div>
            <h2>{settings.title}</h2>
          </div>

          <div className="popup-body">
            <p dangerouslySetInnerHTML={{ __html: settings.content }}></p>

            {(settings.highlights && settings.highlights.length > 0) && (
              <ul className="popup-highlights">
                {settings.highlights.map((highlight, index) => (
                  <li key={index}>
                    <i className="icofont-check-circled"></i> {highlight}
                  </li>
                ))}
              </ul>
            )}

            <div className="popup-actions">
              <Link
                href={settings.buttonLink}
                className="btn btn-primary btn-lg"
                onClick={handleClose}
              >
                {settings.buttonText}
                <i className="icofont-double-right"></i>
              </Link>
            </div>

            <button
              className="dont-show-again"
              onClick={handleDontShowAgain}
            >
              Don&apos;t show this again
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegistrationPopup;
