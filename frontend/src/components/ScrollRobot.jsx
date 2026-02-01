// frontend/src/components/ScrollRobot.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const ScrollRobot = () => {
  const containerRef = useRef(null);
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [robotPosition, setRobotPosition] = useState({ x: 0, y: 0, angle: 0 });
  const [currentZone, setCurrentZone] = useState('START');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      if (pathRef.current && pathLength > 0) {
        const distance = latest * pathLength;
        const point = pathRef.current.getPointAtLength(distance);
        const nextPoint = pathRef.current.getPointAtLength(Math.min(distance + 1, pathLength));
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

        setRobotPosition({ x: point.x, y: point.y, angle: angle });

        // Update current zone based on progress
        if (latest < 0.05) setCurrentZone('START');
        else if (latest < 0.15) setCurrentZone('PICKUP BOX');
        else if (latest < 0.30) setCurrentZone('BLACK PATH');
        else if (latest < 0.40) setCurrentZone('PATH SPLIT');
        else if (latest < 0.50) setCurrentZone('GREEN PATH');
        else if (latest < 0.55) setCurrentZone('RE-UPLOAD POINT');
        else if (latest < 0.65) setCurrentZone('CLIMBING RAMP');
        else if (latest < 0.75) setCurrentZone('BLUE RING');
        else if (latest < 0.85) setCurrentZone('RED RING');
        else if (latest < 0.92) setCurrentZone('GREEN RING');
        else setCurrentZone('🎯 BLACK CENTER - SHOOT!');
      }
    });
    return () => unsubscribe();
  }, [pathLength, smoothProgress]);

  return (
    <div ref={containerRef} className="scroll-container">
      <div className="scroll-viewport">
        <h2 className="scroll-title">WINTER OLYMPICS ROBOTICS CHALLENGE</h2>
        <p className="scroll-subtitle">Watch the robot follow the competition track</p>

        {/* Current Zone Display */}
        <div className="current-zone-display">
          <span className="zone-label">CURRENT ZONE:</span>
          <span className="zone-value">{currentZone}</span>
        </div>

        <div className="track-arena">
          <svg
            viewBox="0 0 600 750"
            className="track-svg-overlay"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background */}
            <rect width="600" height="750" fill="#1a1a2e" />
            
            {/* Snowflake pattern */}
            <pattern id="snowflakes" width="50" height="50" patternUnits="userSpaceOnUse">
              <text x="25" y="25" fontSize="16" fill="#2a2a4e" textAnchor="middle">❄</text>
            </pattern>
            <rect width="600" height="750" fill="url(#snowflakes)" opacity="0.3" />

            {/* ============ TARGET PLATFORM (Top Left) ============ */}
            <rect x="50" y="30" width="180" height="180" fill="rgba(255,200,200,0.15)" stroke="#ff6b6b" strokeWidth="1" strokeDasharray="5,5" rx="5" />
            <text x="140" y="22" textAnchor="middle" fill="#ff6b6b" fontSize="10">Raised Platform</text>
            
            {/* Target rings - centered at (140, 120) */}
            <circle cx="140" cy="120" r="75" fill="#3b82f6" />
            <circle cx="140" cy="120" r="55" fill="#ef4444" />
            <circle cx="140" cy="120" r="35" fill="#22c55e" />
            <circle cx="140" cy="120" r="18" fill="#111" />
            
            {/* Ball */}
            <circle cx="140" cy="120" r="6" fill="#888" stroke="#666" strokeWidth="1" />
            <text x="140" y="123" textAnchor="middle" fill="#fff" fontSize="6">ball</text>

            {/* ============ RAMPS ============ */}
            {/* Curved Ramp (left side) */}
            <path
              d="M 100 210 Q 60 260, 70 320 Q 85 370, 140 400"
              fill="none"
              stroke="#333"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <text x="35" y="280" fill="#888" fontSize="9">Curved</text>
            <text x="35" y="292" fill="#888" fontSize="9">Ramp</text>

            {/* Straight Ramp (center-left) */}
            <path
              d="M 165 210 L 175 400"
              fill="none"
              stroke="#333"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <text x="185" y="300" fill="#888" fontSize="9">Straight</text>
            <text x="185" y="312" fill="#888" fontSize="9">Ramp</text>

            {/* ============ GREEN PATH (to target) ============ */}
            <path
              d="M 155 400 L 230 450 L 330 450"
              fill="none"
              stroke="#22c55e"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Re-upload point on green path */}
            <ellipse cx="155" cy="400" rx="15" ry="10" fill="#8b5cf6" />
            <text x="105" y="385" fill="#8b5cf6" fontSize="8">Re-upload</text>
            <text x="110" y="395" fill="#8b5cf6" fontSize="8">Point</text>

            {/* Blue circle on green path */}
            <ellipse cx="280" cy="450" rx="18" ry="10" fill="#3b82f6" />

            {/* ============ BLACK MAIN PATH ============ */}
            <path
              d="M 330 700 L 330 450"
              fill="none"
              stroke="#333"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* ============ RED PATH (obstacle course) ============ */}
            <path
              d="M 330 450 
                 L 400 420
                 L 430 350
                 Q 480 280, 520 220
                 Q 560 150, 520 100
                 Q 480 60, 420 80
                 Q 360 100, 380 160
                 Q 400 220, 450 280
                 L 430 350"
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Re-upload point on red path */}
            <ellipse cx="400" cy="420" rx="15" ry="10" fill="#8b5cf6" />
            <text x="420" y="440" fill="#8b5cf6" fontSize="8">Re-upload</text>
            <text x="420" y="450" fill="#8b5cf6" fontSize="8">Point</text>

            {/* Blue circle on red path */}
            <ellipse cx="380" cy="380" rx="18" ry="10" fill="#3b82f6" />

            {/* Obstructions on red path */}
            <rect x="485" y="180" width="30" height="20" fill="#111" rx="2" />
            <text x="500" y="215" textAnchor="middle" fill="#666" fontSize="7">Obstruction</text>
            
            <rect x="440" y="300" width="30" height="20" fill="#111" rx="2" transform="rotate(20, 455, 310)" />
            <text x="480" y="335" fill="#666" fontSize="7">Obstruction</text>

            {/* ============ BOXES ============ */}
            {/* Bottom boxes near start */}
            <rect x="270" y="620" width="40" height="25" fill="#fff" stroke="#333" strokeWidth="1" rx="2" />
            <text x="290" y="637" textAnchor="middle" fill="#333" fontSize="8">Box</text>
            
            <rect x="360" y="620" width="40" height="25" fill="#fff" stroke="#333" strokeWidth="1" rx="2" />
            <text x="380" y="637" textAnchor="middle" fill="#333" fontSize="8">Box</text>

            {/* Middle boxes near split */}
            <rect x="340" y="380" width="40" height="25" fill="#fff" stroke="#333" strokeWidth="1" rx="2" />
            <text x="360" y="397" textAnchor="middle" fill="#333" fontSize="8">Box</text>
            
            <rect x="420" y="380" width="40" height="25" fill="#fff" stroke="#333" strokeWidth="1" rx="2" />
            <text x="440" y="397" textAnchor="middle" fill="#333" fontSize="8">Box</text>

            {/* Blue drop zone at bottom */}
            <ellipse cx="330" cy="630" rx="20" ry="12" fill="#3b82f6" />

            {/* ============ START ZONE ============ */}
            <rect x="305" y="690" width="50" height="35" fill="#22c55e" stroke="#166534" strokeWidth="2" rx="4" />
            <text x="330" y="712" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">BEGIN</text>

            {/* ============ ROBOT PATH (Yellow dashed - follows green route) ============ */}
            <path
              ref={pathRef}
              d="M 330 700
                 L 330 630
                 L 290 630
                 L 330 630
                 L 330 450
                 L 280 450
                 L 230 450
                 L 155 400
                 L 170 320
                 L 170 210
                 L 140 195
                 L 140 170
                 L 140 145
                 L 140 125
                 L 140 120"
              fill="none"
              stroke="rgba(250, 204, 21, 0.7)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8 6"
            />

            {/* Path direction arrows */}
            <polygon points="330,550 340,565 320,565" fill="#facc15" />
            <polygon points="230,450 240,440 240,460" fill="#facc15" transform="rotate(-10, 235, 450)" />
            <polygon points="170,280 180,295 160,295" fill="#facc15" />
            <polygon points="140,150 150,165 130,165" fill="#facc15" />

            {/* ============ LEGEND ============ */}
            <rect x="460" y="580" width="120" height="140" fill="rgba(30,30,50,0.9)" stroke="#444" strokeWidth="1" rx="5" />
            <text x="520" y="600" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">LEGEND</text>
            
            <line x1="475" y1="615" x2="505" y2="615" stroke="#333" strokeWidth="4" />
            <text x="515" y="619" fill="#aaa" fontSize="8">Black Path</text>
            
            <line x1="475" y1="635" x2="505" y2="635" stroke="#22c55e" strokeWidth="4" />
            <text x="515" y="639" fill="#aaa" fontSize="8">Green Path</text>
            
            <line x1="475" y1="655" x2="505" y2="655" stroke="#ef4444" strokeWidth="4" />
            <text x="515" y="659" fill="#aaa" fontSize="8">Red Path</text>
            
            <circle cx="490" cy="675" r="6" fill="#8b5cf6" />
            <text x="515" y="679" fill="#aaa" fontSize="8">Re-upload</text>
            
            <circle cx="490" cy="695" r="6" fill="#3b82f6" />
            <text x="515" y="699" fill="#aaa" fontSize="8">Box Drop</text>

            <line x1="475" y1="712" x2="505" y2="712" stroke="#facc15" strokeWidth="3" strokeDasharray="4 3" />
            <text x="515" y="716" fill="#aaa" fontSize="8">Robot Path</text>

          </svg>

          {/* THE ROBOT */}
          <motion.div
            className="robot"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              x: `calc(${robotPosition.x / 600 * 100}% - 12px)`,
              y: `calc(${robotPosition.y / 750 * 100}% - 15px)`,
              rotate: robotPosition.angle + 90,
            }}
          >
            <div className="robot-body">
              <div className="robot-chassis">
                <div className="robot-sensor"></div>
                <div className="robot-stripe"></div>
              </div>
              <div className="robot-wheel left"></div>
              <div className="robot-wheel right"></div>
            </div>
          </motion.div>

          {/* Progress indicator */}
          <div className="progress-indicator">
            <div className="progress-label">MISSION PROGRESS</div>
            <div className="progress-track">
              <motion.div
                className="progress-bar"
                style={{ scaleX: smoothProgress }}
              />
            </div>
          </div>
        </div>

        <p className="scroll-hint">↓ Keep scrolling to navigate the course ↓</p>
      </div>
    </div>
  );
};

export default ScrollRobot;
