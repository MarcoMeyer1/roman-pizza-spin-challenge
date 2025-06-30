'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Constants
const PRIZES = ['Free Pizza', 'Free Pepsi', '10% Off', 'Try Again'];
const COLORS = ['#f44336', '#03a9f4', '#ffeb3b', '#4caf50']; // Slice colors
const SEG = 360 / PRIZES.length; // Degrees per segment
const FULL_SPINS = 3 * 360; // Ensures at least 3 full rotations per spin

export default function SpinWheel({ customerId }) {
  const [deg, setDeg] = useState(0);          // Accumulated rotation
  const [busy, setBusy] = useState(false);    // Animation in progress
  const [win, setWin] = useState(null);       // Displayed result after spin

  const spin = async () => {
    if (busy) return;
    setBusy(true);
    setWin(null);

    try {
      // Get prize from backend
      const { data } = await axios.post('http://localhost:5000/api/spin', { customerId });
      const prize = data.prize;
      const idx = PRIZES.indexOf(prize);

      if (idx < 0) throw new Error('Invalid prize received from API');

      // Calculate current visible rotation in degrees
      const current = (deg % 360 + 360) % 360;

      // Calculate the angle needed to center the selected segment under the pointer
      const target = (360 - (idx * SEG + SEG / 2)) % 360;

      // Determine additional degrees required to land on the correct segment
      let delta = target - current;
      if (delta < 0) delta += 360;

      // Combine full spins with offset
      const finalDeg = deg + FULL_SPINS + delta;
      setDeg(finalDeg);

      // Wait for animation to complete before showing result
      setTimeout(() => {
        setWin(prize);
        setBusy(false);
      }, 3000);
    } catch (err) {
      alert('Spin failed: ' + err.message);
      setBusy(false);
    }
  };

  // Create arc path for each segment using SVG
  const arcPath = (startDeg) => {
    const endDeg = startDeg + SEG;
    const largeArc = SEG > 180 ? 1 : 0;
    const R = 150, cx = 150, cy = 150;
    const sx = cx + R * Math.cos(startDeg * Math.PI / 180);
    const sy = cy + R * Math.sin(startDeg * Math.PI / 180);
    const ex = cx + R * Math.cos(endDeg * Math.PI / 180);
    const ey = cy + R * Math.sin(endDeg * Math.PI / 180);
    return `M${cx},${cy} L${sx},${sy} A${R},${R} 0 ${largeArc},1 ${ex},${ey} Z`;
  };

  // Ensure text labels remain upright regardless of rotation
  const labelRotation = (angle, x, y) => {
    const normalized = (angle + 360) % 360;
    const rotate = normalized > 90 && normalized < 270 ? normalized + 180 : normalized;
    return `rotate(${rotate} ${x} ${y})`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Pointer at top */}
      <div className="relative w-[320px] h-[320px]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px]
                          border-l-transparent border-r-transparent border-b-red-600" />
        </div>

        {/* Wheel container with animated rotation */}
        <motion.svg
          width={320}
          height={320}
          viewBox="0 0 300 300"
          animate={{ rotate: deg }}
          transition={{ duration: 3, ease: 'easeOut' }}
          className="rounded-full"
        >
          {PRIZES.map((label, i) => {
            const start = -90 + i * SEG;
            const center = start + SEG / 2;
            const textX = 150 + 95 * Math.cos(center * Math.PI / 180);
            const textY = 150 + 95 * Math.sin(center * Math.PI / 180);

            return (
              <g key={label}>
                <path d={arcPath(start)} fill={COLORS[i]} stroke="#fff" strokeWidth="2" />
                <text
                  x={textX}
                  y={textY}
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={labelRotation(center, textX, textY)}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </motion.svg>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={busy}
        className="mt-6 bg-[#215197] text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
      >
        {busy ? 'Spinning…' : 'Spin Now'}
      </button>

      {/* Prize result */}
      {win && (
        <p className="mt-6 text-lg font-bold text-green-700">
          You won: <span className="text-black">{win}</span>!
        </p>
      )}
    </div>
  );
}
