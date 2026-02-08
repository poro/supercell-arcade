'use client';

import { useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('connect-four')!;

const tutorial = {
  overview: 'Drop colored discs to get four in a row - horizontally, vertically, or diagonally. Play against an AI that uses smart heuristics to block your moves and find winning opportunities.',
  promptFlow: [
    'Create 7x6 grid with gravity-based disc dropping',
    'Implement win detection in all 4 directions',
    'Add AI opponent with strategic move selection',
    'Handle column full and draw conditions',
  ],
  codeHighlights: [
    'Gravity simulation - discs fall to lowest empty row',
    'Win detection checking 4 directions from each cell',
    'AI evaluates potential winning moves and blocks',
  ],
};

type Cell = 'R' | 'Y' | null;
const ROWS = 6;
const COLS = 7;

export default function ConnectFourGame() {
  const [board, setBoard] = useState<Cell[][]>(() => 
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Cell>(null);
  const [isDraw, setIsDraw] = useState(false);

  function checkWin(b: Cell[][], row: number, col: number, player: Cell): boolean {
    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i, c = col + dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === player) count++;
        else break;
      }
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i, c = col - dc * i;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS && b[r][c] === player) count++;
        else break;
      }
      if (count >= 4) return true;
    }
    return false;
  }

  function getLowestRow(b: Cell[][], col: number): number {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!b[row][col]) return row;
    }
    return -1;
  }

  function aiMove(b: Cell[][]): number {
    // Check for winning move
    for (let c = 0; c < COLS; c++) {
      const r = getLowestRow(b, c);
      if (r >= 0) {
        b[r][c] = 'Y';
        if (checkWin(b, r, c, 'Y')) { b[r][c] = null; return c; }
        b[r][c] = null;
      }
    }
    // Block player win
    for (let c = 0; c < COLS; c++) {
      const r = getLowestRow(b, c);
      if (r >= 0) {
        b[r][c] = 'R';
        if (checkWin(b, r, c, 'R')) { b[r][c] = null; return c; }
        b[r][c] = null;
      }
    }
    // Prefer center
    if (getLowestRow(b, 3) >= 0) return 3;
    // Random valid
    const valid = [];
    for (let c = 0; c < COLS; c++) if (getLowestRow(b, c) >= 0) valid.push(c);
    return valid[Math.floor(Math.random() * valid.length)];
  }

  const dropDisc = useCallback((col: number) => {
    if (winner || isDraw || !isPlayerTurn) return;

    const row = getLowestRow(board, col);
    if (row < 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 'R';
    setBoard(newBoard);

    if (checkWin(newBoard, row, col, 'R')) {
      setWinner('R');
      return;
    }

    if (newBoard.flat().every(c => c)) {
      setIsDraw(true);
      return;
    }

    setIsPlayerTurn(false);

    setTimeout(() => {
      const aiCol = aiMove(newBoard);
      const aiRow = getLowestRow(newBoard, aiCol);
      if (aiRow >= 0) {
        newBoard[aiRow][aiCol] = 'Y';
        setBoard([...newBoard.map(r => [...r])]);

        if (checkWin(newBoard, aiRow, aiCol, 'Y')) {
          setWinner('Y');
          return;
        }

        if (newBoard.flat().every(c => c)) {
          setIsDraw(true);
          return;
        }
      }
      setIsPlayerTurn(true);
    }, 500);
  }, [board, winner, isDraw, isPlayerTurn]);

  const reset = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setWinner(null);
    setIsDraw(false);
    setIsPlayerTurn(true);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-xl font-bold">
          {winner ? (
            <span className={winner === 'R' ? 'text-red-400' : 'text-yellow-400'}>
              {winner === 'R' ? '🎉 You Win!' : '🤖 AI Wins!'}
            </span>
          ) : isDraw ? (
            <span className="text-gray-400">🤝 Draw!</span>
          ) : (
            <span className={isPlayerTurn ? 'text-red-400' : 'text-yellow-400'}>
              {isPlayerTurn ? 'Your Turn (🔴)' : 'AI Thinking...'}
            </span>
          )}
        </div>

        <div className="bg-blue-600 p-3 rounded-xl">
          {board.map((row, r) => (
            <div key={r} className="flex gap-2">
              {row.map((cell, c) => (
                <button
                  key={c}
                  onClick={() => dropDisc(c)}
                  className="w-12 h-12 rounded-full bg-blue-800 flex items-center justify-center"
                >
                  {cell && (
                    <div className={`w-10 h-10 rounded-full ${
                      cell === 'R' ? 'bg-red-500' : 'bg-yellow-400'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">
          {winner || isDraw ? 'Play Again' : 'Reset'}
        </button>
      </div>
    </GameWrapper>
  );
}
