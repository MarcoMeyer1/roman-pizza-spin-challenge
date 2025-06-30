'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import PrizeModal from './PrizeModal.jsx';

// Constants
const PRIZES = ['Free Pizza', 'Free Pepsi', '10% Off', 'Try Again'];
const SEG = 360 / PRIZES.length; // Degrees per segment
const FULL_SPINS = 3 * 360; // Ensures at least 3 full rotations per spin
const ENABLE_COOLDOWN = false; // Toggle cooldown logic

export default function SpinWheel({ customerId }) {
  const [deg, setDeg] = useState(0);          // Accumulated rotation
  const [busy, setBusy] = useState(false);    // Animation in progress
  const [win, setWin] = useState(null);       // Displayed result after spin
  const [showModal, setShowModal] = useState(false); // Modal display state
  const [disableSpin, setDisableSpin] = useState(false); // Cooldown flag
  const [timeLeft, setTimeLeft] = useState(null); // Countdown display

  useEffect(() => {
    if (!ENABLE_COOLDOWN || !customerId) return;

    const checkCooldown = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/next-spin/${customerId}`);
        if (!data.canSpin && data.nextSpinAt) {
          setDisableSpin(true);
          const next = new Date(data.nextSpinAt).getTime();

          const tick = () => {
            const now = Date.now();
            const diff = next - now;
            if (diff <= 0) {
              setDisableSpin(false);
              setTimeLeft(null);
              return;
            }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
          };

          tick();
          const interval = setInterval(tick, 1000);
          return () => clearInterval(interval);
        }
      } catch (err) {
        console.error('Cooldown check failed', err.message);
      }
    };

    checkCooldown();
  }, [customerId]);

  const spin = async () => {
    if (busy || disableSpin) return;
    setBusy(true);
    setWin(null);
    setShowModal(false);

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

      // Show prize after rotation completes
      setTimeout(() => {
        setWin(prize);
        setBusy(false);
        setShowModal(true);
      }, 3000);
    } catch (err) {
      alert('Spin failed: ' + err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-4">
      {/* Heading */}
      <h2 className="text-2xl md:text-3xl font-bold text-[#215197] mt-4 mb-2">Spin & Win!</h2>

      {/* Wheel container with animated rotation */}
      <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[480px] md:h-[480px]">
        {/* Top pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[18px] rotate-180
                          border-l-transparent border-r-transparent border-b-red-600" />
        </div>

        <motion.img
          src="/Pizza_Spin_Wheel.png"
          alt="Spin the Wheel"
          className="rounded-full w-full h-full object-contain"
          animate={{ rotate: deg }}
          transition={{ duration: 3, ease: 'easeOut' }}
        />
      </div>

      {/* Spin button */}
      {!disableSpin && (
        <button
          onClick={spin}
          disabled={busy}
          className="mt-6 bg-[#215197] text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {busy ? 'Spinning…' : 'Spin Now'}
        </button>
      )}

      {/* Cooldown countdown */}
      {disableSpin && timeLeft && (
        <p className="mt-6 text-sm text-gray-700 text-center">
          You can spin again in:<br />
          <span className="text-lg font-semibold text-gray-800">{timeLeft}</span>
        </p>
      )}

      {/* Modal result */}
      {showModal && win && (
        <PrizeModal prize={win} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
