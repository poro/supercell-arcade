'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('sokoban')!;

const tutorial = {
  overview: 'Push boxes onto targets! You can only push, not pull. Plan your moves carefully - boxes can get stuck!',
  promptFlow: ['Grid-based movement', 'Box pushing mechanics', 'Target detection', 'Level progression'],
  codeHighlights: ['Push detection', 'Wall collision', 'Win condition checking'],
};

const LEVELS = [
  {
    map: [
      '########',
      '#   # .#',
      '# $  $.#',
      '#  ##  #',
      '# @$ . #',
      '########',
    ],
  },
];

export default function SokobanGame() {
  const [level, setLevel] = useState(0);
  const [player, setPlayer] = useState({ x: 0, y: 0 });
  const [boxes, setBoxes] = useState<{ x: number; y: number }[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const walls = new Set<string>();
  const targets = new Set<string>();

  const parseLevel = useCallback(() => {
    const map = LEVELS[level].map;
    const newBoxes: { x: number; y: number }[] = [];
    
    walls.clear();
    targets.clear();

    map.forEach((row, y) => {
      row.split('').forEach((cell, x) => {
        if (cell === '#') walls.add(`${x},${y}`);
        if (cell === '.' || cell === '*') targets.add(`${x},${y}`);
        if (cell === '$' || cell === '*') newBoxes.push({ x, y });
        if (cell === '@' || cell === '+') setPlayer({ x, y });
      });
    });

    setBoxes(newBoxes);
    setMoves(0);
    setWon(false);
  }, [level]);

  useEffect(() => { parseLevel(); }, [parseLevel]);

  const map = LEVELS[level].map;
  map.forEach((row, y) => {
    row.split('').forEach((cell, x) => {
      if (cell === '#') walls.add(`${x},${y}`);
      if (cell === '.' || cell === '*') targets.add(`${x},${y}`);
    });
  });

  const move = useCallback((dx: number, dy: number) => {
    if (won) return;

    const newX = player.x + dx;
    const newY = player.y + dy;
    const key = `${newX},${newY}`;

    if (walls.has(key)) return;

    const boxIndex = boxes.findIndex(b => b.x === newX && b.y === newY);
    
    if (boxIndex !== -1) {
      const boxNewX = newX + dx;
      const boxNewY = newY + dy;
      const boxKey = `${boxNewX},${boxNewY}`;
      
      if (walls.has(boxKey) || boxes.some(b => b.x === boxNewX && b.y === boxNewY)) return;
      
      const newBoxes = [...boxes];
      newBoxes[boxIndex] = { x: boxNewX, y: boxNewY };
      setBoxes(newBoxes);

      // Check win
      if (newBoxes.every(b => targets.has(`${b.x},${b.y}`))) {
        setWon(true);
      }
    }

    setPlayer({ x: newX, y: newY });
    setMoves(m => m + 1);
  }, [player, boxes, won, walls, targets]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move(0, -1);
      if (e.key === 'ArrowDown') move(0, 1);
      if (e.key === 'ArrowLeft') move(-1, 0);
      if (e.key === 'ArrowRight') move(1, 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-blue-400">Moves: {moves}</span>
          <span className="text-purple-400">Level: {level + 1}</span>
        </div>

        <div className="bg-gray-900 p-2 rounded-lg">
          {map.map((row, y) => (
            <div key={y} className="flex">
              {row.split('').map((_, x) => {
                const isWall = walls.has(`${x},${y}`);
                const isTarget = targets.has(`${x},${y}`);
                const isBox = boxes.some(b => b.x === x && b.y === y);
                const isPlayer = player.x === x && player.y === y;
                const boxOnTarget = isBox && isTarget;

                return (
                  <div
                    key={x}
                    className={`w-10 h-10 flex items-center justify-center text-2xl
                      ${isWall ? 'bg-gray-700' : isTarget ? 'bg-green-900' : 'bg-gray-800'}
                    `}
                  >
                    {isPlayer && '🧑'}
                    {isBox && !isPlayer && (boxOnTarget ? '📦' : '📦')}
                    {isTarget && !isBox && !isPlayer && '⭕'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {won && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 Level Complete!</h2>
            <p>Solved in {moves} moves</p>
          </div>
        )}

        <button onClick={parseLevel} className="px-4 py-2 bg-purple-500 rounded-lg">
          {won ? 'Play Again' : 'Restart Level'}
        </button>

        <div className="text-gray-400 text-sm">Arrow keys to move • Push all boxes to green targets</div>
      </div>
    </GameWrapper>
  );
}
