import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GridProps {
  letters: string[];
  selectedIndices: number[];
  solvedIndices: number[];
  isError: boolean;
  hintIndex: number | null;
  onLetterClick: (index: number) => void;
}

export function Grid({ letters, selectedIndices, solvedIndices, isError, hintIndex, onLetterClick }: GridProps) {
  const getLetterStatus = (index: number) => {
    if (hintIndex === index) return 'hint';
    if (solvedIndices.includes(index)) return 'solved';
    if (selectedIndices.includes(index)) return isError ? 'error' : 'selected';
    return 'default';
  };

  return (
    <div className="grid grid-cols-5 gap-0.5 p-0.5">
      <AnimatePresence>
        {letters.map((letter, index) => (
          <motion.button
            key={`${index}-${letter}`}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              hintIndex === index 
                ? { scale: [1, 1.2, 1] }
                : { scale: 1, rotate: 0 }
            }
            layout
            transition={{
              layout: { duration: 0.3 },
              scale: { duration: 0.2 }
            }}
            onClick={() => onLetterClick(index)}
            className={`
              w-14 h-14 rounded-lg font-bold text-2xl flex items-center justify-center
              transition-colors duration-300
              ${getLetterStatus(index) === 'solved' ? 'bg-green-500 text-white dark:bg-green-600' : ''}
              ${getLetterStatus(index) === 'selected' ? 'bg-blue-500 text-white dark:bg-blue-600' : ''}
              ${getLetterStatus(index) === 'error' ? 'bg-red-500 text-white dark:bg-red-600' : ''}
              ${getLetterStatus(index) === 'hint' ? 'bg-yellow-400 text-white dark:bg-yellow-500' : ''}
              ${getLetterStatus(index) === 'default' ? 'bg-white dark:bg-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white' : ''}
            `}
          >
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}