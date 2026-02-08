'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('qbert')!;

const tutorial = {
  overview: 'Hop on all cubes to change their color! Avoid enemies and don\'t fall off the pyramid.',
  promptFlow: ['Isometric pyramid grid', 'Diagonal movement', 'Color change tracking', 'Enemy spawning'],
  codeHighlights: ['Isometric coordinate system', 'Cube state management', 'Fall detection'],
};

export default function QbertGame() {
  const [cubes, setCubes] = useState<boolean[]>(Array(28).fill(false));
  const [playerPos, setPlayerPos] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);

  const PYRAMID = [
    [0],
    [1, 2],
    [3, 4, 5],
    [6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25, 26, 27],
  ];

  const getPos = (index: number) => {
    for (let row = 0; row < PYRAMID.length; row++) {
      const col = PYRAMID[row].indexOf(index);
      if (col !== -1) return { row, col };
    }
    return { row: 0, col: 0 };
  };

  const getIndex = (row: number, col: number) => {
    if (row < 0 || row >= PYRAMID.length || col < 0 || col >= PYRAMID[row].length) return -1;
    return PYRAMID[row][col];
  };

  const move = useCallback((dr: number, dc: number) => {
    if (won || lives <= 0) return;
    
    const { row, col } = getPos(playerPos);
    const newRow = row + dr;
    const newCol = col + dc;
    const newIndex = getIndex(newRow, newCol);

    if (newIndex === -1) {
      setLives(l => l - 1);
      setPlayerPos(0);
      return;
    }

    setPlayerPos(newIndex);
    
    if (!cubes[newIndex]) {
      const newCubes = [...cubes];
      newCubes[newIndex] = true;
      setCubes(newCubes);
      setScore(s => s + 25);

      if (newCubes.every(c => c)) {
        setWon(true);
      }
    }
  }, [playerPos, cubes, won, lives]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': case 'w': move(-1, 0); break;
        case 'ArrowDown': case 's': move(1, 1); break;
        case 'ArrowLeft': case 'a': move(1, 0); break;
        case 'ArrowRight': case 'd': move(-1, -1); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const reset = () => {
    setCubes(Array(28).fill(false));
    setPlayerPos(0);
    setScore(0);
    setLives(3);
    setWon(false);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-orange-400">Score: {score}</span>
          <span className="text-red-400">Lives: {lives}</span>
          <span className="text-blue-400">{cubes.filter(c => c).length}/28</span>
        </div>

        <div className="relative">
          {PYRAMID.map((row, ri) => (
            <div key={ri} className="flex justify-center" style={{ marginTop: ri === 0 ? 0 : -20 }}>
              {row.map((cubeIndex, ci) => (
                <div
                  key={ci}
                  className={`w-12 h-12 m-1 flex items-center justify-center transform rotate-45 text-xl
                    ${cubes[cubeIndex] ? 'bg-yellow-400' : 'bg-purple-600'}
                    ${playerPos === cubeIndex ? 'ring-4 ring-white' : ''}
                  `}
                >
                  {playerPos === cubeIndex && <span className="transform -rotate-45">🔴</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {(won || lives <= 0) && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{won ? '🎉 You Win!' : 'Game Over!'}</h2>
            <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">Play Again</button>
          </div>
        )}

        <div className="text-gray-400 text-sm">WASD or Arrow keys to hop diagonally</div>
      </div>
    </GameWrapper>
  );
}
