'use client';

import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('match-three')!;

const tutorial = {
  overview: 'Swap adjacent gems to make matches of 3 or more. Matches disappear and new gems fall down. Create chain reactions for bonus points!',
  promptFlow: ['Create gem grid with different colors', 'Implement swap mechanics', 'Detect and remove matches', 'Handle gravity and refill'],
  codeHighlights: ['Match detection in rows and columns', 'Cascade/gravity system', 'Chain reaction scoring'],
};

const GEMS = ['🔴', '🟢', '🔵', '🟡', '🟣', '🟠'];
const SIZE = 8;

export default function MatchThreeGame() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);

  const createGrid = useCallback(() => {
    const newGrid: string[][] = [];
    for (let r = 0; r < SIZE; r++) {
      newGrid.push([]);
      for (let c = 0; c < SIZE; c++) {
        let gem;
        do {
          gem = GEMS[Math.floor(Math.random() * GEMS.length)];
        } while (
          (c >= 2 && newGrid[r][c-1] === gem && newGrid[r][c-2] === gem) ||
          (r >= 2 && newGrid[r-1]?.[c] === gem && newGrid[r-2]?.[c] === gem)
        );
        newGrid[r].push(gem);
      }
    }
    return newGrid;
  }, []);

  useEffect(() => {
    setGrid(createGrid());
  }, [createGrid]);

  const findMatches = (g: string[][]) => {
    const matches = new Set<string>();
    
    // Horizontal
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE - 2; c++) {
        if (g[r][c] && g[r][c] === g[r][c+1] && g[r][c] === g[r][c+2]) {
          matches.add(`${r},${c}`);
          matches.add(`${r},${c+1}`);
          matches.add(`${r},${c+2}`);
        }
      }
    }
    
    // Vertical
    for (let r = 0; r < SIZE - 2; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] && g[r][c] === g[r+1][c] && g[r][c] === g[r+2][c]) {
          matches.add(`${r},${c}`);
          matches.add(`${r+1},${c}`);
          matches.add(`${r+2},${c}`);
        }
      }
    }
    
    return matches;
  };

  const removeAndFill = (g: string[][], matches: Set<string>) => {
    const newGrid = g.map(row => [...row]);
    
    // Remove matches
    matches.forEach(key => {
      const [r, c] = key.split(',').map(Number);
      newGrid[r][c] = '';
    });
    
    // Gravity
    for (let c = 0; c < SIZE; c++) {
      let empty = SIZE - 1;
      for (let r = SIZE - 1; r >= 0; r--) {
        if (newGrid[r][c]) {
          [newGrid[empty][c], newGrid[r][c]] = [newGrid[r][c], newGrid[empty][c]];
          empty--;
        }
      }
      // Fill empty
      for (let r = empty; r >= 0; r--) {
        newGrid[r][c] = GEMS[Math.floor(Math.random() * GEMS.length)];
      }
    }
    
    return newGrid;
  };

  const handleClick = (r: number, c: number) => {
    if (moves <= 0) return;

    if (!selected) {
      setSelected([r, c]);
    } else {
      const [sr, sc] = selected;
      const isAdjacent = (Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r);
      
      if (isAdjacent) {
        // Swap
        const newGrid = grid.map(row => [...row]);
        [newGrid[r][c], newGrid[sr][sc]] = [newGrid[sr][sc], newGrid[r][c]];
        
        const matches = findMatches(newGrid);
        if (matches.size > 0) {
          setMoves(m => m - 1);
          
          // Process matches
          let currentGrid = newGrid;
          let totalScore = 0;
          let multiplier = 1;
          
          const processMatches = () => {
            const m = findMatches(currentGrid);
            if (m.size > 0) {
              totalScore += m.size * 10 * multiplier;
              multiplier++;
              currentGrid = removeAndFill(currentGrid, m);
              setGrid([...currentGrid]);
              setScore(s => s + m.size * 10 * (multiplier - 1));
              setTimeout(processMatches, 300);
            }
          };
          
          setGrid(newGrid);
          setTimeout(() => {
            currentGrid = removeAndFill(newGrid, matches);
            setGrid([...currentGrid]);
            setScore(s => s + matches.size * 10);
            setTimeout(processMatches, 300);
          }, 100);
        }
      }
      setSelected(null);
    }
  };

  const reset = () => {
    setGrid(createGrid());
    setScore(0);
    setMoves(30);
    setSelected(null);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-purple-400">Score: {score}</span>
          <span className="text-blue-400">Moves: {moves}</span>
        </div>

        <div className="bg-gray-800 p-2 rounded-xl">
          {grid.map((row, r) => (
            <div key={r} className="flex">
              {row.map((gem, c) => (
                <button
                  key={c}
                  onClick={() => handleClick(r, c)}
                  className={`w-10 h-10 text-2xl rounded transition-all
                    ${selected?.[0] === r && selected?.[1] === c ? 'bg-white/30 scale-110' : 'hover:bg-white/10'}
                  `}
                >
                  {gem}
                </button>
              ))}
            </div>
          ))}
        </div>

        {moves <= 0 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Game Over! Score: {score}</h2>
            <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">Play Again</button>
          </div>
        )}

        {moves > 0 && (
          <button onClick={reset} className="px-4 py-2 bg-gray-600 rounded-lg text-sm">Reset</button>
        )}
      </div>
    </GameWrapper>
  );
}
