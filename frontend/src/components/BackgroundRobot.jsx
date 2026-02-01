import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useSpring } from 'framer-motion';

const BackgroundRobot = () => {
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [robotPosition, setRobotPosition] = useState({ x: 1850, y: 80, angle: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);

  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 20,
    restDelta: 0.0001
  });

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      // Animation starts earlier in the page (15% scroll)
      const animationStart = 0.15;
      const adjustedProgress = Math.max(0, (latest - animationStart) / (1 - animationStart));
      
      setScrollProgress(adjustedProgress);
      if (pathRef.current && pathLength > 0) {
        const distance = adjustedProgress * pathLength;
        const point = pathRef.current.getPointAtLength(distance);
        const lookAhead = Math.min(distance + 5, pathLength);
        const nextPoint = pathRef.current.getPointAtLength(lookAhead);
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
        setRobotPosition({ x: point.x, y: point.y, angle });
      }
    });
    return () => unsubscribe();
  }, [pathLength, smoothProgress]);

  // Ring position (earlier in path - around 20% scroll)
  const ringX = 1200;
  const ringY = 280;

  // Ball behavior - rolls along path in front of robot, settles in ring at end
  const ballSettlePoint = 0.22; // When ball settles in ring center
  
  let ballX, ballY;

  if (scrollProgress < ballSettlePoint) {
    // Ball rolls in front of robot along the path
    if (pathRef.current && pathLength > 0) {
      const ballDistance = Math.min(scrollProgress * pathLength + 40, pathLength);
      const ballPoint = pathRef.current.getPointAtLength(ballDistance);
      ballX = ballPoint.x;
      ballY = ballPoint.y;
    } else {
      ballX = robotPosition.x + Math.cos(robotPosition.angle * Math.PI / 180) * 40;
      ballY = robotPosition.y + Math.sin(robotPosition.angle * Math.PI / 180) * 40;
    }
  } else {
    // Ball settled in center of ring
    ballX = ringX;
    ballY = ringY;
  }

  // Ball rotation based on movement
  const ballRotation = scrollProgress * 720; // Spins as it moves

  // Obstacle positions
  const obstacle1 = { x: 550, y: 520 };
  const obstacle2 = { x: 350, y: 680 };

  // Path: Start top-right -> ring (early) -> weave around obstacles -> end bottom-left
  const pathData = `
    M 1850 80
    C 1700 100, 1500 150, 1350 200
    L 1250 250
    L 1200 280
    L 1150 300
    C 1000 380, 850 450, 700 480
    C 620 500, 600 510, 550 450
    C 500 390, 480 420, 500 500
    C 520 580, 560 600, 500 650
    C 440 700, 380 680, 350 610
    C 320 540, 280 580, 300 680
    C 320 780, 250 820, 150 870
    C 50 920, 0 950, -50 980
  `;

  return (
    <div className="background-robot-container">
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="background-svg"
      >
        <defs>
          <pattern id="bgGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(59,130,246,0.06)" strokeWidth="1"/>
          </pattern>

          <linearGradient id="bgPathGradient" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="20%" stopColor="#22c55e"/>
            <stop offset="50%" stopColor="#eab308"/>
            <stop offset="100%" stopColor="#ef4444"/>
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        <rect width="100%" height="100%" fill="url(#bgGrid)"/>

        {/* === BLUE TARGET RING (earlier position) === */}
        <g>
          <circle cx={ringX} cy={ringY} r="80" fill="none" stroke="#3b82f6" strokeWidth="4" opacity="0.2" filter="url(#softGlow)"/>
          <circle cx={ringX} cy={ringY} r="60" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth="4"/>
          <circle cx={ringX} cy={ringY} r="40" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="2" strokeDasharray="8 4"/>
          <circle cx={ringX} cy={ringY} r="15" fill="#3b82f6" opacity="0.6"/>
          <text x={ringX} y={ringY - 90} textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold" opacity="0.8">TARGET</text>

          {/* Score indicator */}
          {scrollProgress > ballSettlePoint && (
            <text x={ringX} y={ringY + 100} textAnchor="middle" fill="#22c55e" fontSize="18" fontWeight="bold" filter="url(#glow)">SCORE!</text>
          )}
        </g>

        {/* === OBSTACLES === */}
        <g>
          {/* Obstacle 1 */}
          <rect
            x={obstacle1.x - 30}
            y={obstacle1.y - 30}
            width="60"
            height="60"
            rx="8"
            fill="#1f2937"
            stroke="#ef4444"
            strokeWidth="3"
            opacity="0.9"
          />
          <line x1={obstacle1.x - 20} y1={obstacle1.y - 20} x2={obstacle1.x + 20} y2={obstacle1.y + 20} stroke="#ef4444" strokeWidth="3" opacity="0.7"/>
          <line x1={obstacle1.x + 20} y1={obstacle1.y - 20} x2={obstacle1.x - 20} y2={obstacle1.y + 20} stroke="#ef4444" strokeWidth="3" opacity="0.7"/>

          {/* Obstacle 2 */}
          <rect
            x={obstacle2.x - 30}
            y={obstacle2.y - 30}
            width="60"
            height="60"
            rx="8"
            fill="#1f2937"
            stroke="#ef4444"
            strokeWidth="3"
            opacity="0.9"
          />
          <line x1={obstacle2.x - 20} y1={obstacle2.y - 20} x2={obstacle2.x + 20} y2={obstacle2.y + 20} stroke="#ef4444" strokeWidth="3" opacity="0.7"/>
          <line x1={obstacle2.x + 20} y1={obstacle2.y - 20} x2={obstacle2.x - 20} y2={obstacle2.y + 20} stroke="#ef4444" strokeWidth="3" opacity="0.7"/>

          <text x={(obstacle1.x + obstacle2.x) / 2} y={obstacle1.y - 60} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold" opacity="0.7">OBSTACLE ZONE</text>
        </g>

        {/* === PATH === */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#bgPathGradient)"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
        />

        <path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke="url(#bgPathGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          opacity="0.8"
        />

        {/* === BALL === */}
        <g transform={`translate(${ballX}, ${ballY}) rotate(${ballRotation})`}>
          {/* Ball shadow */}
          <ellipse cx="5" cy="20" rx="15" ry="5" fill="rgba(0,0,0,0.3)"/>
          {/* Main ball */}
          <circle
            cx="0"
            cy="0"
            r="18"
            fill="#f97316"
            stroke="#fff"
            strokeWidth="2"
          />
          {/* Ball pattern (to show rotation) */}
          <path
            d="M -12 -12 Q 0 -18, 12 -12"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            opacity="0.6"
          />
          <path
            d="M -12 12 Q 0 18, 12 12"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            opacity="0.6"
          />
          {/* Highlight */}
          <circle cx="-6" cy="-6" r="5" fill="rgba(255,255,255,0.4)"/>
        </g>

        {/* Ball label when rolling */}
        {scrollProgress < ballSettlePoint && (
          <text x={ballX} y={ballY - 30} textAnchor="middle" fill="#f97316" fontSize="12" fontWeight="bold">BALL</text>
        )}

        {/* === CHECKPOINT MARKERS === */}
        <circle cx="1350" cy="200" r="8" fill="rgba(59,130,246,0.5)" stroke="#3b82f6" strokeWidth="2"/>
        <circle cx="700" cy="480" r="8" fill="rgba(234,179,8,0.5)" stroke="#eab308" strokeWidth="2"/>
        <circle cx="150" cy="870" r="8" fill="rgba(239,68,68,0.5)" stroke="#ef4444" strokeWidth="2"/>

        {/* === ROBOT === */}
        <g transform={`translate(${robotPosition.x}, ${robotPosition.y}) rotate(${robotPosition.angle})`}>
          <rect
            x="-20"
            y="-15"
            width="40"
            height="30"
            rx="4"
            fill="#1f2937"
            stroke="#3b82f6"
            strokeWidth="3"
            filter="url(#glow)"
          />
          <rect
            x="15"
            y="-8"
            width="8"
            height="16"
            rx="2"
            fill="#22c55e"
          />
          <rect x="-22" y="-18" width="6" height="12" rx="1" fill="#111"/>
          <rect x="-22" y="6" width="6" height="12" rx="1" fill="#111"/>
          <rect x="16" y="-18" width="6" height="12" rx="1" fill="#111"/>
          <rect x="16" y="6" width="6" height="12" rx="1" fill="#111"/>
          <polygon points="25,0 20,-5 20,5" fill="#22c55e"/>
        </g>

        {/* === LABELS === */}
        <text x="1800" y="60" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold" opacity="0.7">START</text>
        <text x="80" y="950" textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="bold" opacity="0.7">FINISH</text>
      </svg>
    </div>
  );
};

export default BackgroundRobot;
