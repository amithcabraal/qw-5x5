import React, { useState, useEffect } from 'react';
import { Sparkles, Pause, Play, Shuffle, Lightbulb, Wand2 } from 'lucide-react';
import { wordSets } from './data/wordSets';
import { Grid } from './components/Grid';
import { ResultScreen } from './components/ResultScreen';
import { BurgerMenu } from './components/BurgerMenu';
import { HowToPlayModal } from './components/HowToPlayModal';
import { rearrangeGrid, shuffleUnsolvedLetters } from './utils/gridUtils';
import { formatTime } from './utils/timeUtils';

function App() {
  const [currentSetIndex, setCurrentSetIndex] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const setId = urlParams.get('set');
    if (setId) {
      const index = wordSets.findIndex(set => set.id === setId);
      return index !== -1 ? index : Math.floor(Math.random() * wordSets.length);
    }
    return Math.floor(Math.random() * wordSets.length);
  });

  const [letters, setLetters] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [solvedIndices, setSolvedIndices] = useState<number[]>([]);
  const [solvedWords, setSolvedWords] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime] = useState(Date.now());
  const [finalTime, setFinalTime] = useState(0);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);

  const currentSet = wordSets[currentSetIndex];
  const MAX_TIME = 240; // 4 minutes in seconds

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!showResult && !isPaused) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev >= MAX_TIME) {
            clearInterval(interval);
            setTimeExpired(true);
            setShowResult(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showResult, isPaused]);

  useEffect(() => {
    const allLetters = currentSet.words.join('').split('');
    for (let i = allLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
    }
    setLetters(allLetters);
    setSelectedIndices([]);
    setSolvedIndices([]);
    setSolvedWords([]);
    setShowResult(false);
    setTimer(0);
    setIsPaused(false);
    setTimeExpired(false);
  }, [currentSetIndex]);

  const handleLetterClick = (index: number) => {
    if (solvedIndices.includes(index) || isPaused) return;
    
    setIsError(false);
    setHintIndex(null);
    
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
      setCurrentWord(prev => prev.slice(0, -1));
      return;
    }

    if (selectedIndices.length < 5) {
      const newSelected = [...selectedIndices, index];
      setSelectedIndices(newSelected);
      setCurrentWord(prev => prev + letters[index]);

      if (newSelected.length === 5) {
        const word = newSelected.map(i => letters[i]).join('');
        if (currentSet.words.includes(word) && !solvedWords.includes(word)) {
          const newLetters = rearrangeGrid(letters, solvedWords, word);
          setLetters(newLetters);
          
          const newSolvedIndices = Array.from(
            { length: (solvedWords.length + 1) * 5 },
            (_, i) => i
          );
          
          setSolvedIndices(newSolvedIndices);
          setSolvedWords([...solvedWords, word]);
          setSelectedIndices([]);
          setCurrentWord('');

          if (solvedWords.length + 1 === currentSet.words.length) {
            setFinalTime(timer);
            setTimeout(() => setShowResult(true), 1000);
          }
        } else {
          setIsError(true);
          setTimeout(() => {
            setSelectedIndices([]);
            setCurrentWord('');
            setIsError(false);
          }, 1000);
        }
      }
    }
  };

  const handleHint = () => {
    const unsolvedWords = currentSet.words.filter(word => !solvedWords.includes(word));
    if (unsolvedWords.length > 0) {
      const randomWord = unsolvedWords[Math.floor(Math.random() * unsolvedWords.length)];
      const firstLetter = randomWord[0];
      const hintLetterIndex = letters.findIndex((letter, index) => 
        letter === firstLetter && !solvedIndices.includes(index)
      );
      setHintIndex(hintLetterIndex);
      setTimeout(() => setHintIndex(null), 2000);
    }
  };

  const handleSolve = () => {
    const unsolvedWords = currentSet.words.filter(word => !solvedWords.includes(word));
    if (unsolvedWords.length > 0) {
      const wordToSolve = unsolvedWords[0];
      const newLetters = rearrangeGrid(letters, solvedWords, wordToSolve);
      setLetters(newLetters);
      setSolvedWords([...solvedWords, wordToSolve]);
      const newSolvedIndices = Array.from(
        { length: (solvedWords.length + 1) * 5 },
        (_, i) => i
      );
      setSolvedIndices(newSolvedIndices);
      if (solvedWords.length + 1 === currentSet.words.length) {
        setFinalTime(timer);
        setTimeout(() => setShowResult(true), 1000);
      }
    }
  };

  const handleShuffle = () => {
    setLetters(shuffleUnsolvedLetters(letters, solvedIndices));
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?set=${currentSet.id}`;
    const message = `I completed "${currentSet.theme}" in ${formatTime(finalTime)} on QuizWordz 5x5!\n\nCan you beat my time? Try it here: ${url}`;
    navigator.clipboard.writeText(message);
    alert('Results copied to clipboard!');
  };

  const handlePlayAgain = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * wordSets.length);
    } while (nextIndex === currentSetIndex);
    setCurrentSetIndex(nextIndex);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-300">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-yellow-500" />
            QuizWordz 5x5
          </h1>
          <BurgerMenu
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onShare={handleShare}
            onShowHowToPlay={() => setShowHowToPlay(true)}
          />
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-xl font-mono text-gray-700 dark:text-gray-300">{formatTime(timer)}</p>
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play size={20} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Pause size={20} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={handleHint}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Hint"
            >
              <Lightbulb size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleSolve}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Solve"
            >
              <Wand2 size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={handleShuffle}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Shuffle"
            >
              <Shuffle size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Find five 5-letter words about: <b>{currentSet.theme}</b>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Set {currentSetIndex + 1} of {wordSets.length}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          {!isPaused ? (
            <>
              <Grid
                letters={letters}
                selectedIndices={selectedIndices}
                solvedIndices={solvedIndices}
                isError={isError}
                hintIndex={hintIndex}
                onLetterClick={handleLetterClick}
              />
              {currentWord && (
                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold tracking-wider text-gray-700 dark:text-gray-300">
                    {currentWord}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[360px] flex items-center justify-center">
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Game Paused</p>
            </div>
          )}
        </div>

        {showResult && (
          <ResultScreen
            theme={currentSet.theme}
            solvedWords={solvedWords}
            timeTaken={finalTime}
            onPlayAgain={handlePlayAgain}
            onShare={handleShare}
            timeExpired={timeExpired}
            isDarkMode={isDarkMode}
          />
        )}

        <HowToPlayModal
          isOpen={showHowToPlay}
          onClose={() => setShowHowToPlay(false)}
        />
      </div>
    </div>
  );
}

export default App;
