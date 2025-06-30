'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function PrizeModal({ prize, onClose }) {
  const { width, height } = useWindowSize();

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }} //20% opacity
      >
        <Confetti
          width={width}
          height={height}
          numberOfPieces={150}
          recycle={false}
        />

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center relative"
        >
          <h2 className="text-2xl font-bold text-green-600 mb-4">Congratulations!</h2>
          <p className="text-xl text-[#215197] font-semibold">
            You won: <span className="text-black">{prize}</span>
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-[#215197] text-white px-5 py-2 rounded hover:bg-blue-800"
          >
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
