'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('runner')!;

const tutorial = {
  overview: 'Endless runner where you jump over obstacles. Simple one-button gameplay with increasing speed. How far can you run?',
  promptFlow: ['Implement running character with jump', 'Generate random obstacles', 'Increase speed over time', 'Track distance score'],
  codeHighlights: ['Jump physics with gravity', 'Obstacle spawning and recycling', 'Progressive difficulty'],
};

export default function RunnerGame() {
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
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas!.width = 800;
    canvas!.height = 300;

    let playerY = 250;
    let velocityY = 0;
    const gravity = 0.8;
    const jumpStrength = -15;
    let isJumping = false;
    let obstacles: { x: number; width: number; height: number }[] = [];
    let speed = 6;
    let distance = 0;
    let obstacleTimer = 0;

    const jump = () => {
      if (!isJumping) {
        velocityY = jumpStrength;
        isJumping = true;
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    const handleClick = () => jump();

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);

    function loop() {
      if (!ctx) return;

      // Physics
      velocityY += gravity;
      playerY += velocityY;
      if (playerY >= 250) { playerY = 250; isJumping = false; velocityY = 0; }

      // Obstacles
      obstacleTimer++;
      if (obstacleTimer > 80 + Math.random() * 60) {
        obstacles.push({ x: 800, width: 20 + Math.random() * 30, height: 30 + Math.random() * 40 });
        obstacleTimer = 0;
      }

      obstacles = obstacles.filter(o => {
        o.x -= speed;
        return o.x > -50;
      });

      // Collision
      for (const o of obstacles) {
        if (50 < o.x + o.width && 80 > o.x && playerY + 40 > 290 - o.height) {
          setGameOver(true);
          setHighScore(h => Math.max(h, Math.floor(distance)));
          return;
        }
      }

      distance += speed / 10;
      speed = 6 + distance / 500;
      setScore(Math.floor(distance));

      // Draw
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 800, 300);

      // Ground
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(0, 290, 800, 10);

      // Player
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(50, playerY, 30, 40);

      // Obstacles
      ctx.fillStyle = '#ef4444';
      for (const o of obstacles) {
        ctx.fillRect(o.x, 290 - o.height, o.width, o.height);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-green-400">Distance: {score}m</span>
          <span className="text-yellow-400">Best: {highScore}m</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-2 border-green-500/50" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🏃 Endless Runner</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Distance: {score}m</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg">Try Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Click or press Space to jump!</div>
      </div>
    </GameWrapper>
  );
}
