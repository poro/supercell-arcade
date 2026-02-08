'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('aim-trainer')!;

const tutorial = {
  overview: 'Click targets as fast as possible! Improve your mouse accuracy and speed.',
  promptFlow: ['Spawn random targets', 'Track hit accuracy and speed', 'Progressive difficulty'],
  codeHighlights: ['Random target positioning', 'Hit detection', 'Statistics tracking'],
};

export default function AimTrainerGame() {
  const [target, setTarget] = useState({ x: 200, y: 200, size: 50 });
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const spawnTarget = useCallback(() => {
    const size = Math.max(20, 60 - score * 2);
    setTarget({
      x: 50 + Math.random() * 400,
      y: 50 + Math.random() * 300,
      size,
    });
  }, [score]);

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

    return () => clearInterval(timer);
  }, [isPlaying, score]);

  const startGame = () => {
    setScore(0);
    setMisses(0);
    setTimeLeft(30);
    setIsPlaying(true);
    spawnTarget();
  };

  const handleHit = () => {
    if (!isPlaying) return;
    setScore(s => s + 1);
    spawnTarget();
  };

  const handleMiss = () => {
    if (!isPlaying) return;
    setMisses(m => m + 1);
  };

  const accuracy = score + misses > 0 ? Math.round((score / (score + misses)) * 100) : 0;

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-lg font-bold">
          <span className="text-green-400">Hits: {score}</span>
          <span className="text-red-400">Misses: {misses}</span>
          <span className="text-blue-400">Accuracy: {accuracy}%</span>
          <span className="text-yellow-400">Time: {timeLeft}s</span>
        </div>

        <div
          onClick={handleMiss}
          className="relative w-[500px] h-[400px] bg-gray-800 rounded-xl cursor-crosshair overflow-hidden"
        >
          {isPlaying && (
            <button
              onClick={(e) => { e.stopPropagation(); handleHit(); }}
              className="absolute bg-red-500 hover:bg-red-400 rounded-full transition-all"
              style={{
                left: target.x - target.size / 2,
                top: target.y - target.size / 2,
                width: target.size,
                height: target.size,
              }}
            />
          )}

          {!isPlaying && timeLeft === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
              <p className="text-xl mb-1">Score: {score}</p>
              <p className="text-lg text-gray-400 mb-4">Accuracy: {accuracy}%</p>
              <p className="text-yellow-400 mb-4">High Score: {highScore}</p>
              <button onClick={startGame} className="px-6 py-3 bg-purple-500 rounded-lg">Play Again</button>
            </div>
          )}

          {!isPlaying && timeLeft === 30 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4">🎯 Aim Trainer</h2>
              <button onClick={startGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
        </div>

        {highScore > 0 && <div className="text-yellow-400">High Score: {highScore}</div>}
      </div>
    </GameWrapper>
  );
}
