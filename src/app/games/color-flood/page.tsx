'use client';

import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('color-flood')!;

const tutorial = {
  overview: 'Fill the entire board with one color! Start from top-left and flood-fill by selecting colors. Win in as few moves as possible.',
  promptFlow: ['Generate random color grid', 'Flood fill from corner', 'Track moves', 'Win when all same color'],
  codeHighlights: ['Flood fill algorithm', 'Move counting', 'Win detection'],
};

const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#f97316'];
const SIZE = 14;
const MAX_MOVES = 25;

export default function ColorFloodGame() {
  const [grid, setGrid] = useState<number[][]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const createGrid = useCallback(() => {
    return Array(SIZE).fill(null).map(() =>
      Array(SIZE).fill(null).map(() => Math.floor(Math.random() * COLORS.length))
    );
  }, []);

  useEffect(() => {
    setGrid(createGrid());
  }, [createGrid]);

  const floodFill = (g: number[][], newColor: number) => {
    const oldColor = g[0][0];
    if (oldColor === newColor) return g;

    const newGrid = g.map(row => [...row]);
    const stack: [number, number][] = [[0, 0]];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;
      
      if (visited.has(key)) continue;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) continue;
      if (newGrid[r][c] !== oldColor) continue;

      visited.add(key);
      newGrid[r][c] = newColor;

      stack.push([r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]);
    }

    return newGrid;
  };

  const handleColorClick = (colorIndex: number) => {
    if (won || moves >= MAX_MOVES) return;
    if (grid[0]?.[0] === colorIndex) return;

    const newGrid = floodFill(grid, colorIndex);
    setGrid(newGrid);
    setMoves(m => m + 1);

    // Check win
    if (newGrid.every(row => row.every(cell => cell === colorIndex))) {
      setWon(true);
    }
  };

  const reset = () => {
    setGrid(createGrid());
    setMoves(0);
    setWon(false);
  };

  const lost = moves >= MAX_MOVES && !won;

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className={moves > MAX_MOVES - 5 ? 'text-red-400' : 'text-blue-400'}>
            Moves: {moves}/{MAX_MOVES}
          </span>
        </div>

        <div className="bg-gray-800 p-2 rounded-lg">
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <div
                  key={c}
                  className="w-5 h-5"
                  style={{ backgroundColor: COLORS[cell] }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {COLORS.map((color, i) => (
            <button
              key={i}
              onClick={() => handleColorClick(i)}
              disabled={won || lost}
              className="w-12 h-12 rounded-lg transition-all hover:scale-110 disabled:opacity-50"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {won && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 You Win!</h2>
            <p>Completed in {moves} moves</p>
          </div>
        )}

        {lost && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-2">Out of Moves!</h2>
          </div>
        )}

        <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">
          {won || lost ? 'Play Again' : 'Reset'}
        </button>
      </div>
    </GameWrapper>
  );
}
