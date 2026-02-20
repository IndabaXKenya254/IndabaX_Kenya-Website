// ═══════════════════════════════════════════════════════════════════════
// ADMIN - QR CODE SCANNER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
// Camera-based QR code scanner for ticket check-in
// Uses html5-qrcode library (most reliable, 400K+ weekly downloads)
// ═══════════════════════════════════════════════════════════════════════

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: unknown) => void;
}

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error' | 'permission-denied';

// Detect browser type for specific instructions
const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') return { name: 'Unknown', isMobile: false };

  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (ua.includes('Chrome') && !ua.includes('Edg')) return { name: 'Chrome', isMobile };
  if (ua.includes('Firefox')) return { name: 'Firefox', isMobile };
  if (ua.includes('Safari') && !ua.includes('Chrome')) return { name: 'Safari', isMobile };
  if (ua.includes('Edg')) return { name: 'Edge', isMobile };
  return { name: 'Unknown', isMobile };
};

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [browserInfo, setBrowserInfo] = useState({ name: 'Unknown', isMobile: false });
  const [lastScan, setLastScan] = useState<string>('');

  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State: 0 = NOT_STARTED, 1 = SCANNING, 2 = PAUSED
        if (state === 1 || state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('Scanner cleanup:', err);
      }
      scannerRef.current = null;
    }
    setStatus('idle');
  }, []);

  const startScanner = useCallback(async () => {
    setStatus('starting');
    setErrorMessage('');

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      // Create scanner instance
      const scannerId = 'qr-scanner-container';

      // Ensure container exists
      if (!document.getElementById(scannerId)) {
        setStatus('error');
        setErrorMessage('Scanner container not found');
        return;
      }

      // Stop any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log('QR Code scanned:', decodedText, decodedResult);

        // Prevent duplicate scans
        if (decodedText === lastScan) {
          return;
        }

        setLastScan(decodedText);
        onScan(decodedText);

        // Stop scanner after successful scan
        stopScanner();

        // Reset duplicate prevention after 2 seconds
        setTimeout(() => setLastScan(''), 2000);
      };

      const onScanError = (errorMessage: string) => {
        // This fires continuously when no QR code is detected - ignore it
        // Only log actual errors, not "QR code not found" messages
        if (!errorMessage.includes('No QR code found') &&
            !errorMessage.includes('NotFoundException')) {
          console.log('Scan attempt:', errorMessage);
        }
      };

      // Try to get available cameras
      let cameraId: string | undefined;
      try {
        const cameras = await Html5Qrcode.getCameras();
        console.log('Available cameras:', cameras);

        if (cameras && cameras.length > 0) {
          // Prefer back camera
          const backCamera = cameras.find(c =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          cameraId = backCamera?.id || cameras[cameras.length - 1].id;
        }
      } catch (e) {
        console.log('Could not enumerate cameras, will use default');
      }

      // Scanner configuration - optimized for QR code detection
      const config = {
        fps: 15,  // Higher FPS for faster detection
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Use 70% of the smaller dimension for scan area
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdge * 0.7);
          return { width: qrboxSize, height: qrboxSize };
        },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,  // Higher zoom for better focus
        formatsToSupport: [0],  // 0 = QR_CODE only for faster detection
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true  // Use native BarcodeDetector API if available
        },
        rememberLastUsedCamera: true,
        supportedScanTypes: [0],  // 0 = SCAN_TYPE_CAMERA
      };

      // Start scanning with video constraints for better quality
      const videoConstraints = cameraId
        ? { deviceId: { exact: cameraId } }
        : {
            facingMode: 'environment',
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            focusMode: 'continuous'
          };

      await scanner.start(
        videoConstraints,
        config,
        onScanSuccess,
        onScanError
      );

      setStatus('scanning');
      console.log('Scanner started successfully');

    } catch (err: any) {
      console.error('Failed to start scanner:', err);

      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setStatus('permission-denied');
        setErrorMessage('Camera permission was denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setStatus('error');
        setErrorMessage('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setStatus('error');
        setErrorMessage('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to start camera. Please try again.');
      }

      onError?.(err);
    }
  }, [onScan, onError, lastScan, stopScanner]);

  // Get browser-specific instructions for enabling camera
  const getPermissionInstructions = () => {
    const { name, isMobile } = browserInfo;

    if (isMobile) {
      switch (name) {
        case 'Chrome':
          return {
            title: 'Enable Camera on Chrome (Mobile)',
            steps: [
              'Tap the lock icon (🔒) next to the URL',
              'Tap "Site settings" or "Permissions"',
              'Find "Camera" and change to "Allow"',
              'Reload the page and try again'
            ]
          };
        case 'Safari':
          return {
            title: 'Enable Camera on Safari (iOS)',
            steps: [
              'Open Settings app on your device',
              'Scroll down and tap "Safari"',
              'Tap "Camera" under "Settings for Websites"',
              'Select "Allow" or "Ask"',
              'Return to this page and reload'
            ]
          };
        default:
          return {
            title: 'Enable Camera Access',
            steps: [
              'Open browser settings',
              'Find "Site permissions" or "Privacy"',
              'Allow camera for this site',
              'Reload and try again'
            ]
          };
      }
    }

    switch (name) {
      case 'Chrome':
        return {
          title: 'Enable Camera on Chrome',
          steps: [
            'Click the lock icon (🔒) next to the URL',
            'Click "Site settings"',
            'Change "Camera" to "Allow"',
            'Reload the page'
          ]
        };
      case 'Firefox':
        return {
          title: 'Enable Camera on Firefox',
          steps: [
            'Click the lock icon (🔒) in the address bar',
            'Click "More Information"',
            'Go to "Permissions" tab',
            'Find "Use the Camera" and set to "Allow"'
          ]
        };
      case 'Safari':
        return {
          title: 'Enable Camera on Safari',
          steps: [
            'Click Safari menu → "Settings for This Website"',
            'Find "Camera" and set to "Allow"',
            'Reload the page'
          ]
        };
      case 'Edge':
        return {
          title: 'Enable Camera on Edge',
          steps: [
            'Click the lock icon (🔒) in the address bar',
            'Click "Permissions for this site"',
            'Change "Camera" to "Allow"',
            'Reload the page'
          ]
        };
      default:
        return {
          title: 'Enable Camera Access',
          steps: [
            'Look for lock icon in address bar',
            'Find camera permissions',
            'Change to "Allow"',
            'Reload the page'
          ]
        };
    }
  };

  const renderPermissionDenied = () => {
    const instructions = getPermissionInstructions();
    return (
      <div className="card border-warning">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0">
            <i className="icofont-warning me-2"></i>
            Camera Permission Required
          </h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-3">{errorMessage}</p>

          <div className="bg-light p-3 rounded mb-3">
            <h6 className="fw-bold mb-2">{instructions.title}</h6>
            <ol className="mb-0 ps-3">
              {instructions.steps.map((step, index) => (
                <li key={index} className="mb-1" style={{ fontSize: '0.9rem' }}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button onClick={startScanner} className="btn btn-primary">
              <i className="icofont-refresh me-2"></i>
              Try Again
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-outline-secondary">
              <i className="icofont-loop me-2"></i>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="card border-danger mb-3">
      <div className="card-header bg-danger text-white">
        <h5 className="mb-0">
          <i className="icofont-warning-alt me-2"></i>
          Camera Error
        </h5>
      </div>
      <div className="card-body">
        <p className="mb-3">{errorMessage}</p>
        <div className="d-flex gap-2">
          <button onClick={startScanner} className="btn btn-primary">
            <i className="icofont-refresh me-2"></i>
            Retry
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="qr-scanner-wrapper">
      {/* Permission Denied */}
      {status === 'permission-denied' && renderPermissionDenied()}

      {/* Error State */}
      {status === 'error' && renderError()}

      {/* Idle - Show Start Button */}
      {status === 'idle' && (
        <button
          onClick={startScanner}
          className="btn btn-success btn-lg w-100 mb-3"
        >
          <i className="icofont-qr-code me-2"></i>
          Start QR Scanner
        </button>
      )}

      {/* Starting */}
      {status === 'starting' && (
        <div className="text-center p-4">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Starting camera...</p>
        </div>
      )}

      {/* Scanning */}
      {(status === 'scanning' || status === 'starting') && (
        <div className="scanner-container">
          <div className="card">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <i className="icofont-qr-code me-2"></i>
                  {status === 'starting' ? 'Starting...' : 'Scanning for QR Code'}
                </span>
                <button onClick={stopScanner} className="btn btn-sm btn-light">
                  <i className="icofont-close-line"></i>
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              {/* Scanner renders here */}
              <div
                id="qr-scanner-container"
                ref={containerRef}
                style={{ width: '100%', minHeight: '300px' }}
              ></div>

              <div className="p-3 bg-light text-center">
                <p className="mb-0 text-muted">
                  <i className="icofont-info-circle me-1"></i>
                  Point your camera at the QR code on the ticket
                </p>
              </div>
            </div>
          </div>

          <button onClick={stopScanner} className="btn btn-secondary mt-3 w-100">
            <i className="icofont-close-line me-2"></i>
            Cancel Scan
          </button>
        </div>
      )}

      <style jsx>{`
        .qr-scanner-wrapper {
          width: 100%;
        }

        .scanner-container {
          margin-top: 1rem;
        }

        #qr-scanner-container {
          position: relative;
          overflow: hidden;
        }

        /* Override html5-qrcode default styles */
        :global(#qr-scanner-container video) {
          width: 100% !important;
          max-height: 400px;
          object-fit: cover;
        }

        :global(#qr-scanner-container img) {
          display: none;
        }

        :global(#qr-shaded-region) {
          border-width: 50px !important;
        }
      `}</style>
    </div>
  );
}
