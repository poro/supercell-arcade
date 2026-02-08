'use client';

import { useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('minesweeper')!;

const tutorial = {
  overview: 'Classic Minesweeper - uncover all safe tiles without hitting a mine. Numbers indicate how many mines are adjacent. Right-click to flag suspected mines.',
  promptFlow: [
    'Generate grid with randomly placed mines',
    'Calculate adjacent mine counts for each cell',
    'Handle left-click to reveal, right-click to flag',
    'Implement flood-fill for empty cells',
    'Detect win (all non-mines revealed) and loss (mine clicked)',
  ],
  codeHighlights: [
    'Recursive flood-fill algorithm for empty cells',
    'First click is always safe (mines placed after)',
    'Right-click context menu prevention for flagging',
    'Win detection by counting revealed safe cells',
  ],
};

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

const GRID_SIZE = 10;
const MINE_COUNT = 15;

export default function MinesweeperGame() {
  const [grid, setGrid] = useState<Cell[][]>(() => createEmptyGrid());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [firstClick, setFirstClick] = useState(true);
  const [flagCount, setFlagCount] = useState(0);

  function createEmptyGrid(): Cell[][] {
    return Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
  }

  function placeMines(grid: Cell[][], safeRow: number, safeCol: number): Cell[][] {
    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    let placed = 0;

    while (placed < MINE_COUNT) {
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);
      
      if (!newGrid[r][c].isMine && !(Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1)) {
        newGrid[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate adjacent mines
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].adjacentMines = count;
        }
      }
    }

    return newGrid;
  }

  function reveal(grid: Cell[][], row: number, col: number): Cell[][] {
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return grid;
    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return grid;

    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    newGrid[row][col].isRevealed = true;

    if (newGrid[row][col].adjacentMines === 0 && !newGrid[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            const result = reveal(newGrid, row + dr, col + dc);
            for (let r = 0; r < GRID_SIZE; r++) {
              for (let c = 0; c < GRID_SIZE; c++) {
                newGrid[r][c] = result[r][c];
              }
            }
          }
        }
      }
    }

    return newGrid;
  }

  const handleClick = useCallback((row: number, col: number) => {
    if (gameOver || won) return;

    let currentGrid = grid;
    
    if (firstClick) {
      currentGrid = placeMines(grid, row, col);
      setFirstClick(false);
    }

    if (currentGrid[row][col].isFlagged) return;

    if (currentGrid[row][col].isMine) {
      // Game over - reveal all
      const revealedGrid = currentGrid.map(r => r.map(c => ({ ...c, isRevealed: true })));
      setGrid(revealedGrid);
      setGameOver(true);
      return;
    }

    const newGrid = reveal(currentGrid, row, col);
    setGrid(newGrid);

    // Check win
    const safeCount = GRID_SIZE * GRID_SIZE - MINE_COUNT;
    const revealedCount = newGrid.flat().filter(c => c.isRevealed && !c.isMine).length;
    if (revealedCount === safeCount) {
      setWon(true);
    }
  }, [grid, gameOver, won, firstClick]);

  const handleRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameOver || won || grid[row][col].isRevealed) return;

    setGrid(g => {
      const newGrid = g.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
      return newGrid;
    });
    setFlagCount(c => grid[row][col].isFlagged ? c - 1 : c + 1);
  }, [grid, gameOver, won]);

  const resetGame = () => {
    setGrid(createEmptyGrid());
    setGameOver(false);
    setWon(false);
    setFirstClick(true);
    setFlagCount(0);
  };

  const getColor = (count: number) => {
    const colors = ['', 'text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-gray-400', 'text-white'];
    return colors[count] || '';
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-red-400">💣 {MINE_COUNT - flagCount}</span>
          <span className="text-blue-400">🚩 {flagCount}</span>
        </div>

        <div className="bg-gray-800 p-2 rounded-lg">
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <button
                  key={c}
                  onClick={() => handleClick(r, c)}
                  onContextMenu={(e) => handleRightClick(e, r, c)}
                  className={`w-8 h-8 text-sm font-bold border border-gray-700 flex items-center justify-center
                    ${cell.isRevealed 
                      ? cell.isMine ? 'bg-red-600' : 'bg-gray-600' 
                      : 'bg-gray-500 hover:bg-gray-400'}
                    ${getColor(cell.adjacentMines)}
                  `}
                >
                  {cell.isRevealed 
                    ? cell.isMine ? '💣' : cell.adjacentMines || ''
                    : cell.isFlagged ? '🚩' : ''
                  }
                </button>
              ))}
            </div>
          ))}
        </div>

        {(gameOver || won) && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {won ? '🎉 You Win!' : '💥 Game Over!'}
            </h2>
            <button onClick={resetGame} className="px-4 py-2 bg-purple-500 rounded-lg">
              Play Again
            </button>
          </div>
        )}

        <div className="text-gray-500 text-sm">
          Left-click to reveal • Right-click to flag
        </div>
      </div>
    </GameWrapper>
  );
}
