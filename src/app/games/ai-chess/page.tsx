'use client';

import { useState } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('ai-chess')!;

const tutorial = {
  overview: 'Play chess against the Cheshire Cat! The mischievous cat comments on your moves via Neocortex AI.',
  promptFlow: ['Standard chess rules', 'AI move calculation', 'Cheshire Cat commentary', 'Win/lose detection'],
  codeHighlights: ['Chess move validation', 'Simple AI evaluation', 'AI-powered trash talk'],
};

const PIECES: Record<string, string> = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

const INITIAL_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

export default function AIChessGame() {
  const [board, setBoard] = useState(INITIAL_BOARD.map(r => [...r]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [catMessage, setCatMessage] = useState("Shall we play a game? I promise not to disappear... much. 😺");
  const [gameOver, setGameOver] = useState(false);

  const isValidMove = (board: string[][], from: [number, number], to: [number, number], piece: string): boolean => {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const dr = tr - fr;
    const dc = tc - fc;
    const target = board[tr][tc];
    
    // Can't capture own piece
    if (target && target[0] === piece[0]) return false;
    
    const type = piece[1];
    const isWhite = piece[0] === 'w';
    
    switch (type) {
      case 'P':
        const dir = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;
        if (dc === 0 && !target) {
          if (dr === dir) return true;
          if (fr === startRow && dr === dir * 2 && !board[fr + dir][fc]) return true;
        }
        if (Math.abs(dc) === 1 && dr === dir && target) return true;
        return false;
      case 'R':
        if (dr !== 0 && dc !== 0) return false;
        return isPathClear(board, from, to);
      case 'N':
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'B':
        if (Math.abs(dr) !== Math.abs(dc)) return false;
        return isPathClear(board, from, to);
      case 'Q':
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;
        return isPathClear(board, from, to);
      case 'K':
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    }
    return false;
  };

  const isPathClear = (board: string[][], from: [number, number], to: [number, number]): boolean => {
    const [fr, fc] = from;
    const [tr, tc] = to;
    const dr = Math.sign(tr - fr);
    const dc = Math.sign(tc - fc);
    let r = fr + dr, c = fc + dc;
    while (r !== tr || c !== tc) {
      if (board[r][c]) return false;
      r += dr;
      c += dc;
    }
    return true;
  };

  const getCatComment = async (move: string, captured: boolean) => {
    try {
      const prompt = captured 
        ? `The player just captured one of my chess pieces with the move ${move}! React with playful indignation (1 sentence).`
        : `The player made the chess move ${move}. Make a cryptic or teasing comment (1 sentence).`;
      const response = await chat(CHARACTERS.CHESHIRE_CAT, prompt, [], "You're playing chess. Be mischievous!");
      setCatMessage(response.message);
    } catch {
      setCatMessage(captured ? "Interesting... very interesting... 😺" : "Hmm, let me think... 🤔");
    }
  };

  const makeAIMove = (currentBoard: string[][]) => {
    // Simple AI: find any valid move
    const moves: { from: [number, number]; to: [number, number]; score: number }[] = [];
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece[0] === 'b') {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (isValidMove(currentBoard, [r, c], [tr, tc], piece)) {
                const target = currentBoard[tr][tc];
                let score = Math.random();
                if (target) score += 10;
                if (target && target[1] === 'Q') score += 50;
                moves.push({ from: [r, c], to: [tr, tc], score });
              }
            }
          }
        }
      }
    }

    if (moves.length > 0) {
      moves.sort((a, b) => b.score - a.score);
      const best = moves[0];
      const newBoard = currentBoard.map(r => [...r]);
      newBoard[best.to[0]][best.to[1]] = newBoard[best.from[0]][best.from[1]];
      newBoard[best.from[0]][best.from[1]] = '';
      setBoard(newBoard);
      setIsWhiteTurn(true);
    }
  };

  const handleClick = async (r: number, c: number) => {
    if (gameOver || !isWhiteTurn) return;

    if (selected) {
      const piece = board[selected[0]][selected[1]];
      if (isValidMove(board, selected, [r, c], piece)) {
        const captured = !!board[r][c];
        const move = `${piece[1]} to ${String.fromCharCode(97 + c)}${8 - r}`;
        
        const newBoard = board.map(row => [...row]);
        newBoard[r][c] = piece;
        newBoard[selected[0]][selected[1]] = '';
        setBoard(newBoard);
        setSelected(null);
        setIsWhiteTurn(false);

        await getCatComment(move, captured);
        
        setTimeout(() => makeAIMove(newBoard), 1000);
      } else {
        setSelected(null);
      }
    } else if (board[r][c] && board[r][c][0] === 'w') {
      setSelected([r, c]);
    }
  };

  const reset = () => {
    setBoard(INITIAL_BOARD.map(r => [...r]));
    setSelected(null);
    setIsWhiteTurn(true);
    setGameOver(false);
    setCatMessage("A new game! How delightful... 😺");
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="text-xl font-bold">
          {isWhiteTurn ? "Your Turn (White)" : "Cheshire Cat is thinking..."}
        </div>

        {catMessage && (
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg max-w-md">
            <span className="text-2xl">😺</span>
            <span className="italic">{catMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-8 gap-0 border-2 border-gray-600">
          {board.map((row, r) =>
            row.map((piece, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                className={`w-12 h-12 flex items-center justify-center text-3xl
                  ${(r + c) % 2 === 0 ? 'bg-amber-100' : 'bg-amber-800'}
                  ${selected?.[0] === r && selected?.[1] === c ? 'ring-2 ring-blue-500' : ''}
                  ${piece && piece[0] === 'b' ? 'text-gray-900' : 'text-gray-100'}
                `}
              >
                {piece ? PIECES[piece] : ''}
              </button>
            ))
          )}
        </div>

        <button onClick={reset} className="px-4 py-2 bg-purple-500 rounded-lg">
          New Game
        </button>
      </div>
    </GameWrapper>
  );
}
