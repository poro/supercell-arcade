'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('flappy')!;

const tutorial = {
  overview: 'Navigate a bird through gaps in pipes by tapping/clicking to flap. Simple one-button gameplay with challenging physics. Features parallax scrolling and high score tracking.',
  promptFlow: [
    'Implement gravity-based bird physics',
    'Create scrolling pipe obstacles with random gaps',
    'Add collision detection for pipes and boundaries',
    'Score points for passing through pipes',
    'Track and display high score',
  ],
  codeHighlights: [
    'Physics simulation with gravity and impulse jumps',
    'Procedural pipe generation with random gap positions',
    'Simple collision detection using rectangles',
    'Parallax background scrolling effect',
  ],
};

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 400;
    const height = 600;
    canvas!.width = width;
    canvas!.height = height;

    // Bird
    let birdY = height / 2;
    let birdVelocity = 0;
    const birdX = 80;
    const birdSize = 30;
    const gravity = 0.5;
    const jumpStrength = -8;

    // Pipes
    let pipes: Pipe[] = [];
    const pipeWidth = 60;
    const pipeGap = 150;
    const pipeSpeed = 3;
    let pipeTimer = 0;
    const pipeInterval = 100;

    let currentScore = 0;
    let isGameOver = false;

    // Controls
    const flap = () => {
      if (gameStarted && !isGameOver) {
        birdVelocity = jumpStrength;
      }
    };

    const handleClick = () => flap();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };

    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    function gameLoop() {
      if (!ctx) return;

      if (gameStarted && !isGameOver) {
        // Update bird
        birdVelocity += gravity;
        birdY += birdVelocity;

        // Ground/ceiling collision
        if (birdY < 0 || birdY > height - birdSize) {
          isGameOver = true;
          setGameOver(true);
          setHighScore(h => Math.max(h, currentScore));
        }

        // Spawn pipes
        pipeTimer++;
        if (pipeTimer >= pipeInterval) {
          pipeTimer = 0;
          pipes.push({
            x: width,
            gapY: 100 + Math.random() * (height - pipeGap - 200),
            passed: false,
          });
        }

        // Update pipes
        pipes = pipes.filter(pipe => {
          pipe.x -= pipeSpeed;

          // Score
          if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            pipe.passed = true;
            currentScore++;
            setScore(currentScore);
          }

          // Collision
          if (
            birdX + birdSize > pipe.x &&
            birdX < pipe.x + pipeWidth &&
            (birdY < pipe.gapY || birdY + birdSize > pipe.gapY + pipeGap)
          ) {
            isGameOver = true;
            setGameOver(true);
            setHighScore(h => Math.max(h, currentScore));
          }

          return pipe.x > -pipeWidth;
        });
      }

      // Draw background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1e3a5f');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw clouds
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      [50, 150, 280, 350].forEach((y, i) => {
        ctx.beginPath();
        ctx.arc((Date.now() / 50 + i * 100) % (width + 100) - 50, y, 30 + i * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw pipes
      pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(pipe.x - 5, pipe.gapY - 20, pipeWidth + 10, 20);

        // Bottom pipe
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(pipe.x, pipe.gapY + pipeGap, pipeWidth, height - pipe.gapY - pipeGap);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(pipe.x - 5, pipe.gapY + pipeGap, pipeWidth + 10, 20);
      });

      // Draw bird
      ctx.save();
      ctx.translate(birdX + birdSize / 2, birdY + birdSize / 2);
      ctx.rotate(Math.min(Math.max(birdVelocity * 0.05, -0.5), 0.5));
      
      // Body
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, 0, birdSize / 2, birdSize / 2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(-5, 2, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(8, -5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(10, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(22, 3);
      ctx.lineTo(15, 6);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Draw score
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(currentScore.toString(), width / 2, 80);

      // Start message
      if (!gameStarted) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('Click or Press Space', width / 2, height / 2);
        ctx.font = '16px sans-serif';
        ctx.fillText('to Start', width / 2, height / 2 + 30);
      }

      if (!isGameOver) {
        requestAnimationFrame(gameLoop);
      }
    }

    requestAnimationFrame(gameLoop);

    return () => {
      canvas.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        {/* Score Display */}
        <div className="flex gap-8 text-2xl font-bold">
          <span className="text-yellow-400">High Score: {highScore}</span>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-green-500/50 cursor-pointer"
          />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-1">Score: {score}</p>
              <p className="text-lg text-yellow-400 mb-4">Best: {highScore}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-xl text-black font-bold"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-gray-400 text-sm">
          Click or press Space to flap • Avoid the pipes!
        </div>
      </div>
    </GameWrapper>
  );
}
