'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('tetris')!;

const tutorial = {
  overview: 'Tetromino is a falling-block puzzle game. Arrange pieces to complete horizontal lines which then clear. The game speeds up as you progress. Features all 7 classic tetromino shapes with rotation.',
  promptFlow: [
    'Define 7 tetromino shapes with rotation states',
    'Implement gravity-based falling with soft/hard drop',
    'Add collision detection with board and other pieces',
    'Line clearing with score multiplier for multiple lines',
    'Ghost piece preview showing drop position',
  ],
  codeHighlights: [
    '7 tetromino types (I, O, T, S, Z, J, L) with 4 rotation states each',
    'Super Rotation System (SRS) style wall kicks',
    'Line clear scoring: 1=100, 2=300, 3=500, 4=800',
    'Level-based speed increase every 10 lines',
  ],
};

const TETROMINOES = {
  I: { shape: [[1,1,1,1]], color: '#06b6d4' },
  O: { shape: [[1,1],[1,1]], color: '#eab308' },
  T: { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
  S: { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
  Z: { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
  J: { shape: [[1,0,0],[1,1,1]], color: '#3b82f6' },
  L: { shape: [[0,0,1],[1,1,1]], color: '#f97316' },
};

type TetrominoType = keyof typeof TETROMINOES;

export default function TetrisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nextPiece, setNextPiece] = useState<TetrominoType>('T');

  const COLS = 10;
  const ROWS = 20;
  const CELL_SIZE = 28;

  const resetGame = useCallback(() => {
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas!.width = COLS * CELL_SIZE;
    canvas!.height = ROWS * CELL_SIZE;

    // Board state
    const board: (string | null)[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    
    // Current piece
    let currentType: TetrominoType = 'T';
    let currentShape: number[][] = [];
    let currentColor = '';
    let currentX = 0;
    let currentY = 0;
    let nextType: TetrominoType = 'T';
    
    let currentScore = 0;
    let currentLines = 0;
    let currentLevel = 1;
    let dropInterval = 1000;
    let lastDrop = Date.now();

    function getRandomPiece(): TetrominoType {
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      return types[Math.floor(Math.random() * types.length)];
    }

    function spawnPiece() {
      currentType = nextType;
      const piece = TETROMINOES[currentType];
      currentShape = piece.shape.map(row => [...row]);
      currentColor = piece.color;
      currentX = Math.floor(COLS / 2) - Math.floor(currentShape[0].length / 2);
      currentY = 0;
      
      nextType = getRandomPiece();
      setNextPiece(nextType);

      if (!canMove(0, 0)) {
        setGameOver(true);
      }
    }

    function rotate() {
      const newShape: number[][] = [];
      for (let x = 0; x < currentShape[0].length; x++) {
        newShape.push([]);
        for (let y = currentShape.length - 1; y >= 0; y--) {
          newShape[x].push(currentShape[y][x]);
        }
      }
      
      const oldShape = currentShape;
      currentShape = newShape;
      
      // Wall kicks
      if (!canMove(0, 0)) {
        if (canMove(-1, 0)) currentX--;
        else if (canMove(1, 0)) currentX++;
        else if (canMove(-2, 0)) currentX -= 2;
        else if (canMove(2, 0)) currentX += 2;
        else currentShape = oldShape; // Revert
      }
    }

    function canMove(dx: number, dy: number): boolean {
      for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
          if (currentShape[y][x]) {
            const newX = currentX + x + dx;
            const newY = currentY + y + dy;
            
            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY >= 0 && board[newY][newX]) return false;
          }
        }
      }
      return true;
    }

    function lockPiece() {
      for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
          if (currentShape[y][x]) {
            const boardY = currentY + y;
            if (boardY >= 0) {
              board[boardY][currentX + x] = currentColor;
            }
          }
        }
      }
      clearLines();
      spawnPiece();
    }

    function clearLines() {
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== null)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          cleared++;
          y++; // Check same row again
        }
      }
      
      if (cleared > 0) {
        const points = [0, 100, 300, 500, 800][cleared] * currentLevel;
        currentScore += points;
        currentLines += cleared;
        setScore(currentScore);
        setLines(currentLines);
        
        // Level up every 10 lines
        const newLevel = Math.floor(currentLines / 10) + 1;
        if (newLevel !== currentLevel) {
          currentLevel = newLevel;
          setLevel(currentLevel);
          dropInterval = Math.max(100, 1000 - (currentLevel - 1) * 100);
        }
      }
    }

    function getGhostY(): number {
      let ghostY = currentY;
      while (true) {
        let canMoveDown = true;
        for (let y = 0; y < currentShape.length; y++) {
          for (let x = 0; x < currentShape[y].length; x++) {
            if (currentShape[y][x]) {
              const newY = ghostY + y + 1;
              const newX = currentX + x;
              if (newY >= ROWS || (newY >= 0 && board[newY][newX])) {
                canMoveDown = false;
              }
            }
          }
        }
        if (!canMoveDown) break;
        ghostY++;
      }
      return ghostY;
    }

    function draw() {
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#0f0a1e';
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      // Grid
      ctx.strokeStyle = '#1a1530';
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
        ctx.stroke();
      }

      // Board pieces
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) {
            ctx.fillStyle = board[y][x] as string;
            ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }

      // Ghost piece
      const ghostY = getGhostY();
      ctx.globalAlpha = 0.3;
      for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
          if (currentShape[y][x]) {
            ctx.fillStyle = currentColor;
            ctx.fillRect(
              (currentX + x) * CELL_SIZE + 1,
              (ghostY + y) * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        }
      }
      ctx.globalAlpha = 1;

      // Current piece
      for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
          if (currentShape[y][x] && currentY + y >= 0) {
            ctx.fillStyle = currentColor;
            ctx.fillRect(
              (currentX + x) * CELL_SIZE + 1,
              (currentY + y) * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        }
      }
    }

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || !gameStarted) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (canMove(-1, 0)) currentX--;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (canMove(1, 0)) currentX++;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (canMove(0, 1)) {
            currentY++;
            currentScore += 1;
            setScore(currentScore);
          }
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotate();
          break;
        case ' ':
          // Hard drop
          while (canMove(0, 1)) {
            currentY++;
            currentScore += 2;
          }
          setScore(currentScore);
          lockPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initialize
    nextType = getRandomPiece();
    spawnPiece();

    function gameLoop() {
      if (gameOver) return;

      const now = Date.now();
      if (now - lastDrop > dropInterval) {
        if (canMove(0, 1)) {
          currentY++;
        } else {
          lockPiece();
        }
        lastDrop = now;
      }

      draw();
      requestAnimationFrame(gameLoop);
    }

    if (gameStarted && !gameOver) {
      requestAnimationFrame(gameLoop);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex gap-8 justify-center">
        {/* Game Area */}
        <div className="flex flex-col items-center gap-4">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-purple-500/50"
          />
          
          {!gameStarted && (
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl"
            >
              Start Game
            </button>
          )}
          
          {gameOver && (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4 w-40">
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">SCORE</div>
            <div className="text-2xl font-bold text-yellow-400">{score}</div>
          </div>
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">LINES</div>
            <div className="text-2xl font-bold text-blue-400">{lines}</div>
          </div>
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="text-gray-400 text-sm">LEVEL</div>
            <div className="text-2xl font-bold text-green-400">{level}</div>
          </div>
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-2">NEXT</div>
            <div className="flex justify-center">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: TETROMINOES[nextPiece].color }}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-4">
            <div>← → Move</div>
            <div>↑ Rotate</div>
            <div>↓ Soft Drop</div>
            <div>Space Hard Drop</div>
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}
