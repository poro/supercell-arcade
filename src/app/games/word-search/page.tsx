'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('word-search')!;

const tutorial = {
  overview: 'Find all hidden Wonderland words in the grid! Words can be horizontal, vertical, or diagonal.',
  promptFlow: ['Generate grid with hidden words', 'Click and drag to select', 'Highlight found words'],
  codeHighlights: ['Word placement algorithm', 'Selection detection', 'Direction validation'],
};

const WORDS = ['RABBIT', 'QUEEN', 'HATTER', 'ALICE', 'TEA', 'CAT', 'CARD'];
const SIZE = 10;

export default function WordSearchGame() {
  const [grid, setGrid] = useState<string[][]>([]);
  const [wordPositions, setWordPositions] = useState<Map<string, [number, number][]>>(new Map());
  const [found, setFound] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<[number, number][]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const createGrid = useCallback(() => {
    const newGrid: string[][] = Array(SIZE).fill(null).map(() => Array(SIZE).fill(''));
    const positions = new Map<string, [number, number][]>();

    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const word of WORDS) {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startR = Math.floor(Math.random() * SIZE);
        const startC = Math.floor(Math.random() * SIZE);

        let canPlace = true;
        const cells: [number, number][] = [];

        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;

          if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
            canPlace = false;
            break;
          }

          if (newGrid[r][c] !== '' && newGrid[r][c] !== word[i]) {
            canPlace = false;
            break;
          }

          cells.push([r, c]);
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const [r, c] = cells[i];
            newGrid[r][c] = word[i];
          }
          positions.set(word, cells);
          placed = true;
        }
      }
    }

    // Fill empty cells
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }

    setWordPositions(positions);
    return newGrid;
  }, []);

  useEffect(() => {
    setGrid(createGrid());
  }, [createGrid]);

  const handleCellDown = (r: number, c: number) => {
    setIsSelecting(true);
    setSelection([[r, c]]);
  };

  const handleCellEnter = (r: number, c: number) => {
    if (!isSelecting || selection.length === 0) return;
    
    const [startR, startC] = selection[0];
    const dr = r === startR ? 0 : r > startR ? 1 : -1;
    const dc = c === startC ? 0 : c > startC ? 1 : -1;

    if (dr === 0 && dc === 0) return;

    const newSelection: [number, number][] = [];
    let cr = startR, cc = startC;

    while (true) {
      newSelection.push([cr, cc]);
      if (cr === r && cc === c) break;
      cr += dr;
      cc += dc;
      if (cr < 0 || cr >= SIZE || cc < 0 || cc >= SIZE) break;
    }

    setSelection(newSelection);
  };

  const handleCellUp = () => {
    if (selection.length >= 2) {
      const selectedWord = selection.map(([r, c]) => grid[r]?.[c] || '').join('');
      
      for (const [word, positions] of wordPositions) {
        if (found.has(word)) continue;
        
        const wordMatch = positions.map(([r, c]) => grid[r][c]).join('');
        if (selectedWord === wordMatch || selectedWord === wordMatch.split('').reverse().join('')) {
          setFound(f => new Set([...f, word]));
          break;
        }
      }
    }
    
    setIsSelecting(false);
    setSelection([]);
  };

  const isSelected = (r: number, c: number) => selection.some(([sr, sc]) => sr === r && sc === c);
  const isFound = (r: number, c: number) => {
    for (const [word, positions] of wordPositions) {
      if (found.has(word) && positions.some(([pr, pc]) => pr === r && pc === c)) return true;
    }
    return false;
  };

  const reset = () => {
    setGrid(createGrid());
    setFound(new Set());
    setSelection([]);
  };

  const allFound = found.size === WORDS.filter(w => wordPositions.has(w)).length;

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex gap-8">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="bg-gray-800 p-2 rounded-lg select-none"
            onMouseUp={handleCellUp}
            onMouseLeave={handleCellUp}
          >
            {grid.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => (
                  <div
                    key={c}
                    onMouseDown={() => handleCellDown(r, c)}
                    onMouseEnter={() => handleCellEnter(r, c)}
                    className={`w-8 h-8 flex items-center justify-center font-mono font-bold cursor-pointer
                      ${isSelected(r, c) ? 'bg-blue-500' : ''}
                      ${isFound(r, c) ? 'bg-green-600' : ''}
                    `}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {allFound && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 All Words Found!</h2>
              <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="w-40">
          <h3 className="font-bold mb-2">Find these words:</h3>
          <ul className="space-y-1">
            {WORDS.map(word => (
              <li key={word} className={found.has(word) ? 'text-green-400 line-through' : ''}>
                {word}
              </li>
            ))}
          </ul>
          <div className="mt-4 text-sm text-gray-400">
            Found: {found.size}/{wordPositions.size}
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}
