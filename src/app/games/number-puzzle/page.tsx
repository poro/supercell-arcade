'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('number-puzzle')!;

const tutorial = {
  overview: '2048 is a sliding puzzle game where you combine tiles with the same numbers. Slide all tiles in a direction, and when two tiles of the same value collide, they merge! Reach 2048 to win, but you can keep going for higher scores.',
  promptFlow: [
    'Create 4x4 grid with spawning tiles (2 or 4)',
    'Implement slide mechanics in 4 directions',
    'Merge matching tiles and update score',
    'Spawn new tile after each move',
    'Detect win (2048) and game over (no moves left)',
  ],
  codeHighlights: [
    'Grid state management with tile merging logic',
    'Slide algorithm that handles cascading merges',
    'Score calculation based on merged tile values',
    'Game over detection by checking all possible moves',
  ],
};

type Grid = (number | null)[][];

export default function NumberPuzzleGame() {
  const [grid, setGrid] = useState<Grid>(() => createEmptyGrid());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  function createEmptyGrid(): Grid {
    return Array(4).fill(null).map(() => Array(4).fill(null));
  }

  function addRandomTile(currentGrid: Grid): Grid {
    const newGrid = currentGrid.map(row => [...row]);
    const emptyCells: [number, number][] = [];
    
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!newGrid[r][c]) emptyCells.push([r, c]);
      }
    }
    
    if (emptyCells.length > 0) {
      const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    
    return newGrid;
  }

  const startGame = useCallback(() => {
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  function slide(row: (number | null)[]): { newRow: (number | null)[]; points: number } {
    // Remove nulls
    let filtered = row.filter(x => x !== null) as number[];
    let points = 0;
    
    // Merge
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        points += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    
    // Pad with nulls
    while (filtered.length < 4) {
      filtered.push(null as unknown as number);
    }
    
    return { newRow: filtered, points };
  }

  function move(direction: 'up' | 'down' | 'left' | 'right') {
    if (gameOver && !keepPlaying) return;

    let newGrid = grid.map(row => [...row]);
    let totalPoints = 0;
    let moved = false;

    if (direction === 'left') {
      for (let r = 0; r < 4; r++) {
        const { newRow, points } = slide(newGrid[r]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[r])) moved = true;
        newGrid[r] = newRow;
        totalPoints += points;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < 4; r++) {
        const { newRow, points } = slide([...newGrid[r]].reverse());
        newRow.reverse();
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[r])) moved = true;
        newGrid[r] = newRow;
        totalPoints += points;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < 4; c++) {
        const column = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        const { newRow, points } = slide(column);
        if (JSON.stringify(newRow) !== JSON.stringify(column)) moved = true;
        for (let r = 0; r < 4; r++) newGrid[r][c] = newRow[r];
        totalPoints += points;
      }
    } else if (direction === 'down') {
      for (let c = 0; c < 4; c++) {
        const column = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
        const { newRow, points } = slide(column);
        newRow.reverse();
        const origColumn = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
        if (JSON.stringify(newRow) !== JSON.stringify(origColumn)) moved = true;
        for (let r = 0; r < 4; r++) newGrid[r][c] = newRow[r];
        totalPoints += points;
      }
    }

    if (moved) {
      newGrid = addRandomTile(newGrid);
      const newScore = score + totalPoints;
      setScore(newScore);
      setBestScore(b => Math.max(b, newScore));
      setGrid(newGrid);

      // Check win
      if (!won && !keepPlaying) {
        for (const row of newGrid) {
          if (row.includes(2048)) {
            setWon(true);
            return;
          }
        }
      }

      // Check game over
      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    }
  }

  function canMove(g: Grid): boolean {
    // Check for empty cells
    for (const row of g) {
      if (row.includes(null)) return true;
    }
    // Check for possible merges
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && g[r][c] === g[r][c + 1]) return true;
        if (r < 3 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('up');
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('down');
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('left');
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function getTileColor(value: number | null): string {
    const colors: Record<number, string> = {
      2: 'bg-gray-200 text-gray-800',
      4: 'bg-gray-300 text-gray-800',
      8: 'bg-orange-300 text-white',
      16: 'bg-orange-400 text-white',
      32: 'bg-orange-500 text-white',
      64: 'bg-orange-600 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-yellow-700 text-white',
      2048: 'bg-yellow-500 text-white',
    };
    return value ? colors[value] || 'bg-purple-600 text-white' : 'bg-gray-700';
  }

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {/* Scores */}
        <div className="flex gap-8">
          <div className="bg-gray-800 px-6 py-3 rounded-lg text-center">
            <div className="text-gray-400 text-sm">SCORE</div>
            <div className="text-2xl font-bold text-white">{score}</div>
          </div>
          <div className="bg-gray-800 px-6 py-3 rounded-lg text-center">
            <div className="text-gray-400 text-sm">BEST</div>
            <div className="text-2xl font-bold text-yellow-400">{bestScore}</div>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
          >
            New Game
          </button>
        </div>

        {/* Grid */}
        <div className="relative">
          <div className="grid grid-cols-4 gap-3 bg-gray-800 p-4 rounded-xl">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-20 h-20 flex items-center justify-center rounded-lg font-bold text-2xl transition-all ${getTileColor(cell)}`}
                >
                  {cell}
                </div>
              ))
            )}
          </div>

          {/* Win overlay */}
          {won && !keepPlaying && (
            <div className="absolute inset-0 bg-yellow-500/90 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-4xl font-bold text-black mb-4">🎉 You Win!</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setKeepPlaying(true)}
                  className="px-6 py-3 bg-black text-white rounded-lg font-bold"
                >
                  Keep Playing
                </button>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-white text-black rounded-lg font-bold"
                >
                  New Game
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && !won && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
              <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-gray-400 text-sm text-center">
          Use arrow keys or WASD to slide tiles<br />
          Combine matching numbers to reach 2048!
        </div>
      </div>
    </GameWrapper>
  );
}
