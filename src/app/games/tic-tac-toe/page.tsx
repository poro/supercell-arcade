'use client';

import { useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('tic-tac-toe')!;

const tutorial = {
  overview: 'The classic game of Xs and Os. Play against an AI opponent that uses the minimax algorithm to make optimal moves. Can you beat an unbeatable AI? (Hint: the best you can do is tie!)',
  promptFlow: [
    'Create 3x3 grid with click handlers',
    'Implement turn-based gameplay',
    'Add win detection for rows, columns, diagonals',
    'Implement minimax AI for optimal moves',
    'Detect draws when board is full',
  ],
  codeHighlights: [
    'Minimax algorithm for perfect AI play',
    'Win detection checking 8 possible lines',
    'Immediate state updates for responsive UI',
    'AI difficulty is unbeatable by design',
  ],
};

type Player = 'X' | 'O' | null;
type Board = Player[];

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export default function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });

  function checkWinner(b: Board): { winner: Player; line: number[] | null } {
    for (const line of WINNING_LINES) {
      const [a, b_, c] = line;
      if (b[a] && b[a] === b[b_] && b[a] === b[c]) {
        return { winner: b[a], line };
      }
    }
    return { winner: null, line: null };
  }

  function minimax(b: Board, isMaximizing: boolean): number {
    const { winner } = checkWinner(b);
    if (winner === 'O') return 10;
    if (winner === 'X') return -10;
    if (!b.includes(null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'O';
          best = Math.max(best, minimax(b, false));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!b[i]) {
          b[i] = 'X';
          best = Math.min(best, minimax(b, true));
          b[i] = null;
        }
      }
      return best;
    }
  }

  function getBestMove(b: Board): number {
    let bestScore = -Infinity;
    let bestMove = -1;
    
    for (let i = 0; i < 9; i++) {
      if (!b[i]) {
        b[i] = 'O';
        const score = minimax(b, false);
        b[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    
    return bestMove;
  }

  const handleClick = useCallback((index: number) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const { winner: w, line } = checkWinner(newBoard);
    if (w) {
      setWinner(w);
      setWinningLine(line);
      setGameOver(true);
      setScores(s => ({ ...s, player: s.player + 1 }));
      return;
    }

    if (!newBoard.includes(null)) {
      setGameOver(true);
      setScores(s => ({ ...s, draws: s.draws + 1 }));
      return;
    }

    setIsPlayerTurn(false);

    // AI move after delay
    setTimeout(() => {
      const aiMove = getBestMove(newBoard);
      if (aiMove !== -1) {
        newBoard[aiMove] = 'O';
        setBoard([...newBoard]);

        const { winner: w2, line: line2 } = checkWinner(newBoard);
        if (w2) {
          setWinner(w2);
          setWinningLine(line2);
          setGameOver(true);
          setScores(s => ({ ...s, ai: s.ai + 1 }));
          return;
        }

        if (!newBoard.includes(null)) {
          setGameOver(true);
          setScores(s => ({ ...s, draws: s.draws + 1 }));
          return;
        }
      }
      setIsPlayerTurn(true);
    }, 500);
  }, [board, gameOver, isPlayerTurn]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
    setWinningLine(null);
  }, []);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {/* Scores */}
        <div className="flex gap-8 text-lg">
          <div className="text-center">
            <div className="text-blue-400">You (X)</div>
            <div className="text-2xl font-bold">{scores.player}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Draws</div>
            <div className="text-2xl font-bold">{scores.draws}</div>
          </div>
          <div className="text-center">
            <div className="text-red-400">AI (O)</div>
            <div className="text-2xl font-bold">{scores.ai}</div>
          </div>
        </div>

        {/* Status */}
        <div className="text-xl">
          {gameOver ? (
            winner ? (
              <span className={winner === 'X' ? 'text-blue-400' : 'text-red-400'}>
                {winner === 'X' ? '🎉 You Win!' : '🤖 AI Wins!'}
              </span>
            ) : (
              <span className="text-yellow-400">🤝 It's a Draw!</span>
            )
          ) : (
            <span className={isPlayerTurn ? 'text-blue-400' : 'text-red-400'}>
              {isPlayerTurn ? 'Your Turn (X)' : 'AI Thinking...'}
            </span>
          )}
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-xl">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || gameOver || !isPlayerTurn}
              className={`w-24 h-24 text-5xl font-bold rounded-lg transition-all
                ${winningLine?.includes(i) ? 'bg-green-500/30' : 'bg-gray-700'}
                ${!cell && !gameOver && isPlayerTurn ? 'hover:bg-gray-600 cursor-pointer' : ''}
                ${cell === 'X' ? 'text-blue-400' : 'text-red-400'}
              `}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
        >
          {gameOver ? 'Play Again' : 'Reset'}
        </button>

        <div className="text-gray-500 text-sm">
          Try to beat the unbeatable AI! (Spoiler: you can't, but ties are possible)
        </div>
      </div>
    </GameWrapper>
  );
}
