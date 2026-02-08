'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('breakout')!;

const tutorial = {
  overview: 'Breakout is a brick-breaking game where you control a paddle to keep a ball in play while destroying bricks. Features multiple brick rows, paddle physics for ball control, and progressive levels.',
  promptFlow: [
    'Create paddle with mouse/keyboard control',
    'Implement ball physics with angle deflection',
    'Generate brick grid with different hit points',
    'Add collision detection for ball-brick, ball-paddle, ball-wall',
    'Implement levels, lives, and power-ups (stretch goal)',
  ],
  codeHighlights: [
    'Mouse tracking for responsive paddle control',
    'Ball angle based on paddle hit position',
    'Brick grid with varying durability',
    '3 lives system with ball reset',
  ],
};

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  color: string;
}

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setWon(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 600;
    canvas!.width = width;
    canvas!.height = height;

    // Game objects
    const paddleWidth = 100;
    const paddleHeight = 15;
    let paddleX = width / 2 - paddleWidth / 2;
    
    let ballX = width / 2;
    let ballY = height - 50;
    let ballVX = 4;
    let ballVY = -4;
    const ballRadius = 8;
    let ballLaunched = false;

    let currentLives = 3;
    let currentScore = 0;

    // Brick setup
    const brickRows = 5;
    const brickCols = 10;
    const brickWidth = 70;
    const brickHeight = 25;
    const brickPadding = 5;
    const brickOffsetX = 35;
    const brickOffsetY = 50;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

    let bricks: Brick[] = [];
    
    function createBricks() {
      bricks = [];
      for (let row = 0; row < brickRows; row++) {
        for (let col = 0; col < brickCols; col++) {
          bricks.push({
            x: brickOffsetX + col * (brickWidth + brickPadding),
            y: brickOffsetY + row * (brickHeight + brickPadding),
            width: brickWidth,
            height: brickHeight,
            hits: brickRows - row, // Top rows need more hits
            color: colors[row],
          });
        }
      }
    }
    createBricks();

    // Mouse control
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      paddleX = e.clientX - rect.left - paddleWidth / 2;
      paddleX = Math.max(0, Math.min(width - paddleWidth, paddleX));
      
      if (!ballLaunched) {
        ballX = paddleX + paddleWidth / 2;
      }
    };

    const handleClick = () => {
      if (!ballLaunched && gameStarted && !gameOver) {
        ballLaunched = true;
        ballVY = -Math.abs(ballVY);
      }
    };

    // Keyboard control
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === ' ' && !ballLaunched && gameStarted && !gameOver) {
        ballLaunched = true;
        ballVY = -Math.abs(ballVY);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function resetBall() {
      ballX = paddleX + paddleWidth / 2;
      ballY = height - 50;
      ballVX = (Math.random() - 0.5) * 8;
      ballVY = -5;
      ballLaunched = false;
    }

    function gameLoop() {
      if (!ctx || gameOver) return;

      // Keyboard paddle movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        paddleX = Math.max(0, paddleX - 10);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        paddleX = Math.min(width - paddleWidth, paddleX + 10);
      }

      if (!ballLaunched) {
        ballX = paddleX + paddleWidth / 2;
      }

      if (ballLaunched) {
        ballX += ballVX;
        ballY += ballVY;

        // Wall collision
        if (ballX <= ballRadius || ballX >= width - ballRadius) {
          ballVX *= -1;
        }
        if (ballY <= ballRadius) {
          ballVY *= -1;
        }

        // Paddle collision
        if (
          ballY + ballRadius >= height - paddleHeight - 10 &&
          ballY <= height - 10 &&
          ballX >= paddleX &&
          ballX <= paddleX + paddleWidth
        ) {
          ballVY = -Math.abs(ballVY);
          // Angle based on hit position
          const hitPos = (ballX - paddleX) / paddleWidth;
          ballVX = (hitPos - 0.5) * 10;
        }

        // Brick collision
        for (let i = bricks.length - 1; i >= 0; i--) {
          const brick = bricks[i];
          if (
            ballX + ballRadius > brick.x &&
            ballX - ballRadius < brick.x + brick.width &&
            ballY + ballRadius > brick.y &&
            ballY - ballRadius < brick.y + brick.height
          ) {
            ballVY *= -1;
            brick.hits--;
            if (brick.hits <= 0) {
              bricks.splice(i, 1);
              currentScore += 10;
              setScore(currentScore);
            }
            break;
          }
        }

        // Check win
        if (bricks.length === 0) {
          setWon(true);
          setGameOver(true);
          return;
        }

        // Ball out of bounds
        if (ballY >= height) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          }
          resetBall();
        }
      }

      // Draw
      ctx.fillStyle = '#0f0a1e';
      ctx.fillRect(0, 0, width, height);

      // Bricks
      bricks.forEach(brick => {
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();
        
        // Hit indicator
        if (brick.hits > 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
        }
      });

      // Paddle
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.roundRect(paddleX, height - paddleHeight - 10, paddleWidth, paddleHeight, 8);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      // Launch instruction
      if (!ballLaunched) {
        ctx.fillStyle = '#888';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click or press SPACE to launch', width / 2, height / 2);
      }

      requestAnimationFrame(gameLoop);
    }

    if (gameStarted && !gameOver) {
      requestAnimationFrame(gameLoop);
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        {/* Stats */}
        <div className="flex gap-8 text-2xl font-bold">
          <span className="text-purple-400">Score: {score}</span>
          <span className="text-red-400">{'❤️'.repeat(lives)}</span>
          <span className="text-blue-400">Level: {level}</span>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-purple-500/50 cursor-none"
          />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🧱 Breakout</h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl"
              >
                Start Game
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">
                {won ? '🎉 You Win!' : '💀 Game Over'}
              </h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-gray-400 text-sm">
          Controls: Mouse or Arrow Keys to move • Click or Space to launch
        </div>
      </div>
    </GameWrapper>
  );
}
