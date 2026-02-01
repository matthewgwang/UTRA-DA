import React, { useState, useEffect, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowLeft', 'ArrowDown',
  'ArrowRight'
];

const CRTOverlay = () => {
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [konamiIndex, setKonamiIndex] = useState(0);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showJoke, setShowJoke] = useState(false);

  // Konami code listener
  const handleKeyDown = useCallback((e) => {
    const key = e.key;
    const expectedKey = KONAMI_CODE[konamiIndex];

    if (key === expectedKey || key.toLowerCase() === expectedKey) {
      const nextIndex = konamiIndex + 1;
      if (nextIndex === KONAMI_CODE.length) {
        // Konami code complete!
        setSelfDestruct(true);
        setKonamiIndex(0);
      } else {
        setKonamiIndex(nextIndex);
      }
    } else {
      setKonamiIndex(0);
    }
  }, [konamiIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Countdown timer for self destruct
  useEffect(() => {
    if (selfDestruct && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (selfDestruct && countdown === 0) {
      setShowJoke(true);
      setTimeout(() => {
        setSelfDestruct(false);
        setShowJoke(false);
        setCountdown(5);
      }, 3000);
    }
  }, [selfDestruct, countdown]);

  return (
    <>
      {/* CRT Toggle Button */}
      <button
        className="crt-toggle"
        onClick={() => setCrtEnabled(!crtEnabled)}
        title="Toggle CRT Mode"
      >
        {crtEnabled ? '📺' : '🖥️'}
      </button>

      {/* CRT Scanline Overlay */}
      {crtEnabled && <div className="crt-overlay" />}
      {crtEnabled && <div className="crt-vignette" />}

      {/* Self Destruct Overlay */}
      {selfDestruct && (
        <div className="self-destruct-overlay">
          {!showJoke ? (
            <div className="destruct-content">
              <h1 className="destruct-title">⚠️ SELF DESTRUCT INITIATED ⚠️</h1>
              <div className="destruct-countdown">{countdown}</div>
              <p className="destruct-warning">ALL SYSTEMS WILL BE PURGED</p>
              <div className="destruct-bars">
                <div className="destruct-bar" style={{ animationDelay: '0s' }} />
                <div className="destruct-bar" style={{ animationDelay: '0.1s' }} />
                <div className="destruct-bar" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          ) : (
            <div className="joke-content">
              <h1 className="joke-title">😂 JUST KIDDING 😂</h1>
              <p>You found the secret Konami Code!</p>
              <p className="joke-code">↑↑↓↓←→←→BA</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CRTOverlay;
