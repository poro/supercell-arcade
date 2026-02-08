'use client';

import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('lights-out')!;

const tutorial = {
  overview: 'Turn off all the lights! Clicking a light toggles it AND its adjacent lights. Solve the puzzle in minimum moves.',
  promptFlow: ['Create grid with toggle mechanics', 'Clicking affects adjacent cells', 'Track moves', 'Win when all lights off'],
  codeHighlights: ['Adjacent cell toggling', 'Solvable puzzle generation', 'Move optimization'],
};

const SIZE = 5;

export default function LightsOutGame() {
  const [lights, setLights] = useState<boolean[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const generatePuzzle = useCallback(() => {
    const grid = Array(SIZE * SIZE).fill(false);
    // Random clicks to ensure solvable
    for (let i = 0; i < 10 + Math.floor(Math.random() * 10); i++) {
      const idx = Math.floor(Math.random() * SIZE * SIZE);
      toggleAt(grid, idx);
    }
    setLights(grid);
    setMoves(0);
    setWon(false);
  }, []);

  const toggleAt = (grid: boolean[], index: number) => {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    
    grid[index] = !grid[index];
    if (row > 0) grid[index - SIZE] = !grid[index - SIZE];
    if (row < SIZE - 1) grid[index + SIZE] = !grid[index + SIZE];
    if (col > 0) grid[index - 1] = !grid[index - 1];
    if (col < SIZE - 1) grid[index + 1] = !grid[index + 1];
  };

  useEffect(() => { generatePuzzle(); }, [generatePuzzle]);

  const handleClick = (index: number) => {
    if (won) return;
    
    const newLights = [...lights];
    toggleAt(newLights, index);
    setLights(newLights);
    setMoves(m => m + 1);

    if (newLights.every(l => !l)) {
      setWon(true);
    }
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-yellow-400">Moves: {moves}</span>
          <span className="text-blue-400">Lights On: {lights.filter(l => l).length}</span>
        </div>

        <div className="grid grid-cols-5 gap-2 bg-gray-900 p-4 rounded-xl">
          {lights.map((isOn, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`w-14 h-14 rounded-lg transition-all
                ${isOn ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 'bg-gray-700 hover:bg-gray-600'}
              `}
            />
          ))}
        </div>

        {won && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 All Lights Out!</h2>
            <p>Solved in {moves} moves</p>
          </div>
        )}

        <button onClick={generatePuzzle} className="px-4 py-2 bg-purple-500 rounded-lg">
          {won ? 'Play Again' : 'New Puzzle'}
        </button>

        <div className="text-gray-400 text-sm">Click a light to toggle it and adjacent lights</div>
      </div>
    </GameWrapper>
  );
}
