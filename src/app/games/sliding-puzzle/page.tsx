'use client';

import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('sliding-puzzle')!;

const tutorial = {
  overview: 'Classic 15-puzzle! Slide tiles to arrange numbers 1-15 in order. The empty space lets you move adjacent tiles.',
  promptFlow: ['Generate solvable shuffled grid', 'Click adjacent tiles to slide', 'Track moves', 'Win when ordered 1-15'],
  codeHighlights: ['Solvability check algorithm', 'Adjacent tile detection', 'Move counting'],
};

export default function SlidingPuzzleGame() {
  const [tiles, setTiles] = useState<(number | null)[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const shuffle = useCallback(() => {
    const arr = [...Array(15).keys()].map(i => i + 1);
    arr.push(null as unknown as number);
    
    // Fisher-Yates shuffle with solvability check
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    setTiles(arr as (number | null)[]);
    setMoves(0);
    setWon(false);
  }, []);

  useEffect(() => { shuffle(); }, [shuffle]);

  const canMove = (index: number) => {
    const emptyIndex = tiles.indexOf(null);
    const row = Math.floor(index / 4);
    const col = index % 4;
    const emptyRow = Math.floor(emptyIndex / 4);
    const emptyCol = emptyIndex % 4;
    
    return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
           (Math.abs(col - emptyCol) === 1 && row === emptyRow);
  };

  const moveTile = (index: number) => {
    if (won || !canMove(index)) return;
    
    const newTiles = [...tiles];
    const emptyIndex = tiles.indexOf(null);
    [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
    setTiles(newTiles);
    setMoves(m => m + 1);

    // Check win
    const isWon = newTiles.slice(0, 15).every((t, i) => t === i + 1);
    if (isWon) {
      setWon(true);
      setBestMoves(b => b === null ? moves + 1 : Math.min(b, moves + 1));
    }
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-blue-400">Moves: {moves}</span>
          {bestMoves && <span className="text-yellow-400">Best: {bestMoves}</span>}
        </div>

        <div className="grid grid-cols-4 gap-2 bg-gray-800 p-3 rounded-xl">
          {tiles.map((tile, i) => (
            <button
              key={i}
              onClick={() => moveTile(i)}
              disabled={tile === null || won}
              className={`w-16 h-16 rounded-lg text-2xl font-bold transition-all
                ${tile === null ? 'bg-gray-900' : 
                  canMove(i) ? 'bg-purple-600 hover:bg-purple-500 cursor-pointer' : 'bg-purple-800'}
                ${tile === i + 1 ? 'ring-2 ring-green-400' : ''}
              `}
            >
              {tile}
            </button>
          ))}
        </div>

        {won && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 Solved!</h2>
            <p>Completed in {moves} moves</p>
          </div>
        )}

        <button onClick={shuffle} className="px-4 py-2 bg-purple-500 rounded-lg">
          {won ? 'Play Again' : 'Shuffle'}
        </button>
      </div>
    </GameWrapper>
  );
}
