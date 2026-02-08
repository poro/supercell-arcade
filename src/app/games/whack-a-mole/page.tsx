'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('whack-a-mole')!;

const tutorial = {
  overview: 'Whack moles as they pop up! Click them before they disappear. Speed increases over time.',
  promptFlow: ['Random mole spawning', 'Timed appearance', 'Score tracking'],
  codeHighlights: ['Random hole selection', 'Timeout-based spawning', 'Hit detection'],
};

export default function WhackAMoleGame() {
  const [moles, setMoles] = useState<boolean[]>(Array(9).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(30);
    setMoles(Array(9).fill(false));
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsPlaying(false);
          setHighScore(h => Math.max(h, score));
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const moleSpawner = setInterval(() => {
      const hole = Math.floor(Math.random() * 9);
      setMoles(m => {
        const newMoles = [...m];
        newMoles[hole] = true;
        return newMoles;
      });

      setTimeout(() => {
        setMoles(m => {
          const newMoles = [...m];
          newMoles[hole] = false;
          return newMoles;
        });
      }, 800 - Math.min(score * 20, 500));
    }, 1000 - Math.min(score * 30, 600));

    return () => {
      clearInterval(timer);
      clearInterval(moleSpawner);
    };
  }, [isPlaying, score]);

  const whack = (index: number) => {
    if (!moles[index]) return;
    setMoles(m => {
      const newMoles = [...m];
      newMoles[index] = false;
      return newMoles;
    });
    setScore(s => s + 1);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-yellow-400">Time: {timeLeft}s</span>
          {highScore > 0 && <span className="text-purple-400">Best: {highScore}</span>}
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-green-800 rounded-xl">
          {moles.map((hasMole, i) => (
            <button
              key={i}
              onClick={() => whack(i)}
              className="w-24 h-24 rounded-full bg-amber-900 flex items-center justify-center text-4xl transition-all border-4 border-amber-950"
            >
              {hasMole && <span className="animate-bounce">🐹</span>}
            </button>
          ))}
        </div>

        {!isPlaying && (
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-500 rounded-lg text-xl font-bold"
          >
            {timeLeft === 0 ? 'Play Again' : 'Start Game'}
          </button>
        )}
      </div>
    </GameWrapper>
  );
}
