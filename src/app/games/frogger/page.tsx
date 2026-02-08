'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('frogger')!;

const tutorial = {
  overview: 'Help the frog cross the busy road and river to reach home! Avoid cars and jump on logs.',
  promptFlow: ['Hopping movement', 'Car and log lanes', 'Collision detection', 'Home slots'],
  codeHighlights: ['Lane-based obstacles', 'Log riding mechanics', 'Multiple lives'],
};

interface Obstacle {
  x: number;
  speed: number;
  width: number;
  type: 'car' | 'log';
}

export default function FroggerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas!.width = 500;
    canvas!.height = 500;

    const CELL = 50;
    let frogX = 4;
    let frogY = 9;
    let onLog = false;
    let logSpeed = 0;
    let currentLives = 3;
    let currentScore = 0;

    // Lane definitions
    const lanes: { y: number; obstacles: Obstacle[]; isWater: boolean }[] = [
      { y: 8, obstacles: [{ x: 0, speed: 2, width: 80, type: 'car' }, { x: 300, speed: 2, width: 80, type: 'car' }], isWater: false },
      { y: 7, obstacles: [{ x: 100, speed: -3, width: 60, type: 'car' }, { x: 350, speed: -3, width: 60, type: 'car' }], isWater: false },
      { y: 6, obstacles: [{ x: 50, speed: 1.5, width: 100, type: 'car' }], isWater: false },
      { y: 5, obstacles: [{ x: 200, speed: -2, width: 70, type: 'car' }, { x: 400, speed: -2, width: 70, type: 'car' }], isWater: false },
      { y: 3, obstacles: [{ x: 0, speed: 1, width: 120, type: 'log' }, { x: 250, speed: 1, width: 120, type: 'log' }], isWater: true },
      { y: 2, obstacles: [{ x: 100, speed: -1.5, width: 100, type: 'log' }], isWater: true },
      { y: 1, obstacles: [{ x: 0, speed: 2, width: 150, type: 'log' }, { x: 300, speed: 2, width: 100, type: 'log' }], isWater: true },
    ];

    const homes = [false, false, false, false, false];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && frogY > 0) frogY--;
      if (e.key === 'ArrowDown' && frogY < 9) frogY++;
      if (e.key === 'ArrowLeft' && frogX > 0) frogX--;
      if (e.key === 'ArrowRight' && frogX < 9) frogX++;
    };
    window.addEventListener('keydown', handleKeyDown);

    function respawn() {
      frogX = 4;
      frogY = 9;
      onLog = false;
      logSpeed = 0;
    }

    function loop() {
      if (!ctx) return;

      // Update obstacles
      lanes.forEach(lane => {
        lane.obstacles.forEach(obs => {
          obs.x += obs.speed;
          if (obs.x > 500) obs.x = -obs.width;
          if (obs.x < -obs.width) obs.x = 500;
        });
      });

      // Check collisions
      const frogPixelX = frogX * CELL;
      const frogPixelY = frogY * CELL;
      onLog = false;
      logSpeed = 0;

      for (const lane of lanes) {
        if (lane.y !== frogY) continue;

        if (lane.isWater) {
          // Must be on a log
          let onAnyLog = false;
          for (const obs of lane.obstacles) {
            if (frogPixelX + 20 > obs.x && frogPixelX + 30 < obs.x + obs.width) {
              onAnyLog = true;
              logSpeed = obs.speed;
              break;
            }
          }
          if (!onAnyLog) {
            currentLives--;
            setLives(currentLives);
            if (currentLives <= 0) { setGameOver(true); return; }
            respawn();
          } else {
            onLog = true;
          }
        } else {
          // Avoid cars
          for (const obs of lane.obstacles) {
            if (frogPixelX + 40 > obs.x && frogPixelX + 10 < obs.x + obs.width) {
              currentLives--;
              setLives(currentLives);
              if (currentLives <= 0) { setGameOver(true); return; }
              respawn();
              break;
            }
          }
        }
      }

      // Move with log
      if (onLog) {
        frogX += logSpeed / CELL;
        if (frogX < 0 || frogX > 9) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) { setGameOver(true); return; }
          respawn();
        }
      }

      // Check home
      if (frogY === 0) {
        const homeIndex = Math.floor(frogX / 2);
        if (homeIndex >= 0 && homeIndex < 5 && !homes[homeIndex]) {
          homes[homeIndex] = true;
          currentScore += 100;
          setScore(currentScore);
          respawn();
          
          if (homes.every(h => h)) {
            setGameOver(true);
            return;
          }
        } else {
          respawn();
        }
      }

      // Draw
      // Safe zone
      ctx.fillStyle = '#4a0';
      ctx.fillRect(0, 0, 500, CELL);
      ctx.fillRect(0, 4 * CELL, 500, CELL);
      ctx.fillRect(0, 9 * CELL, 500, CELL);

      // Road
      ctx.fillStyle = '#333';
      for (let y = 5; y <= 8; y++) {
        ctx.fillRect(0, y * CELL, 500, CELL);
      }

      // Water
      ctx.fillStyle = '#06f';
      for (let y = 1; y <= 3; y++) {
        ctx.fillRect(0, y * CELL, 500, CELL);
      }

      // Homes
      homes.forEach((filled, i) => {
        ctx.fillStyle = filled ? '#0f0' : '#040';
        ctx.fillRect(i * 100 + 10, 5, 80, CELL - 10);
      });

      // Obstacles
      lanes.forEach(lane => {
        lane.obstacles.forEach(obs => {
          ctx.fillStyle = obs.type === 'car' ? '#f00' : '#840';
          ctx.fillRect(obs.x, lane.y * CELL + 5, obs.width, CELL - 10);
        });
      });

      // Frog
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.arc(frogX * CELL + CELL / 2, frogY * CELL + CELL / 2, 20, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-red-400">Lives: {'🐸'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🐸 Frogger</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{lives > 0 ? '🎉 You Win!' : 'Game Over!'}</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to hop</div>
      </div>
    </GameWrapper>
  );
}
