'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { drawSprite, FROG, CAR_RED, LOG } from '@/lib/sprites';

const game = getGameById('frogger')!;

const tutorial = {
  overview: 'The 1981 Konami classic! Help your frog cross a busy highway and treacherous river to reach the safety of home. Time your hops carefully - one wrong move means disaster!',
  howToPlay: [
    'Use ARROW KEYS to hop in any direction',
    'Avoid cars on the road - they will squash you!',
    'Jump onto logs in the river - falling in the water is fatal',
    'Ride the logs across the river',
    'Reach the 5 home slots at the top to win',
    'Each frog home gives you 100 points',
  ],
  winCondition: 'Get all 5 frogs safely home!',
  promptFlow: ['Grid-based hopping movement', 'Lane obstacles with different speeds', 'Log riding mechanics', 'Home slot collision'],
  codeHighlights: [
    'Lane-based obstacle system with varying speeds',
    'Log attachment physics for river crossing',
    'Collision detection for cars and water',
    'Home slot tracking for win condition',
  ],
  techStack: ['Canvas 2D', 'Sprite Rendering', 'Grid Movement', 'Collision Detection'],
};

interface Obstacle {
  x: number;
  speed: number;
  width: number;
  type: 'car' | 'truck' | 'log' | 'turtle';
}

export default function FroggerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [won, setWon] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 560;
    canvas.height = 520;

    const CELL = 52;
    const ROWS = 10;
    let frogX = 4.5;
    let frogY = 9;
    let onLog = false;
    let logSpeed = 0;
    let currentLives = 3;
    let currentScore = 0;
    let frame = 0;
    let moveDelay = 0;

    // Lane definitions with more realistic speeds
    const lanes: { y: number; obstacles: Obstacle[]; isWater: boolean }[] = [
      // Road lanes (y = 5-8)
      { y: 8, obstacles: [
        { x: 0, speed: 1.5, width: 60, type: 'car' }, 
        { x: 200, speed: 1.5, width: 60, type: 'car' },
        { x: 400, speed: 1.5, width: 60, type: 'car' }
      ], isWater: false },
      { y: 7, obstacles: [
        { x: 100, speed: -2.5, width: 100, type: 'truck' }, 
        { x: 400, speed: -2.5, width: 100, type: 'truck' }
      ], isWater: false },
      { y: 6, obstacles: [
        { x: 50, speed: 2, width: 60, type: 'car' },
        { x: 250, speed: 2, width: 60, type: 'car' }
      ], isWater: false },
      { y: 5, obstacles: [
        { x: 0, speed: -3, width: 60, type: 'car' }, 
        { x: 180, speed: -3, width: 60, type: 'car' },
        { x: 360, speed: -3, width: 60, type: 'car' }
      ], isWater: false },
      // Water lanes (y = 1-3)
      { y: 3, obstacles: [
        { x: 0, speed: 1.2, width: 130, type: 'log' }, 
        { x: 280, speed: 1.2, width: 130, type: 'log' }
      ], isWater: true },
      { y: 2, obstacles: [
        { x: 50, speed: -1.8, width: 90, type: 'log' },
        { x: 250, speed: -1.8, width: 90, type: 'log' },
        { x: 450, speed: -1.8, width: 90, type: 'log' }
      ], isWater: true },
      { y: 1, obstacles: [
        { x: 0, speed: 1.5, width: 160, type: 'log' }, 
        { x: 350, speed: 1.5, width: 120, type: 'log' }
      ], isWater: true },
    ];

    const homes = [false, false, false, false, false];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (moveDelay > 0) return;
      
      if (e.key === 'ArrowUp' && frogY > 0) { frogY--; moveDelay = 8; }
      if (e.key === 'ArrowDown' && frogY < 9) { frogY++; moveDelay = 8; }
      if (e.key === 'ArrowLeft' && frogX > 0) { frogX--; moveDelay = 8; }
      if (e.key === 'ArrowRight' && frogX < 9) { frogX++; moveDelay = 8; }
    };
    window.addEventListener('keydown', handleKeyDown);

    function respawn() {
      frogX = 4.5;
      frogY = 9;
      onLog = false;
      logSpeed = 0;
    }

    let animationId: number;

    function loop() {
      if (!ctx) return;
      frame++;
      if (moveDelay > 0) moveDelay--;

      // Update obstacles
      lanes.forEach(lane => {
        lane.obstacles.forEach(obs => {
          obs.x += obs.speed;
          if (obs.x > 560) obs.x = -obs.width;
          if (obs.x < -obs.width) obs.x = 560;
        });
      });

      // Check collisions
      const frogPixelX = frogX * CELL;
      const frogPixelY = frogY * CELL;
      onLog = false;
      logSpeed = 0;

      for (const lane of lanes) {
        if (lane.y !== Math.round(frogY)) continue;

        if (lane.isWater) {
          // Must be on a log
          let onAnyLog = false;
          for (const obs of lane.obstacles) {
            if (frogPixelX + 15 > obs.x && frogPixelX + 35 < obs.x + obs.width) {
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
            if (frogPixelX + 35 > obs.x && frogPixelX + 15 < obs.x + obs.width) {
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
        if (frogX < -0.5 || frogX > 10) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) { setGameOver(true); return; }
          respawn();
        }
      }

      // Check home
      if (frogY === 0) {
        const homeSlots = [0.5, 2.5, 4.5, 6.5, 8.5];
        let foundHome = false;
        
        for (let i = 0; i < 5; i++) {
          if (Math.abs(frogX - homeSlots[i]) < 0.8 && !homes[i]) {
            homes[i] = true;
            currentScore += 100;
            setScore(currentScore);
            foundHome = true;
            respawn();
            
            if (homes.every(h => h)) {
              setWon(true);
              setGameOver(true);
              return;
            }
            break;
          }
        }
        
        if (!foundHome) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) { setGameOver(true); return; }
          respawn();
        }
      }

      // === DRAW ===
      // Water background
      ctx.fillStyle = '#1a5fb4';
      ctx.fillRect(0, 0, 560, 4 * CELL);
      
      // Safe zone (median)
      ctx.fillStyle = '#4a9';
      ctx.fillRect(0, 4 * CELL, 560, CELL);
      
      // Road
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 5 * CELL, 560, 4 * CELL);
      
      // Road lines
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      for (let y = 5.5; y < 9; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL + CELL / 2);
        ctx.lineTo(560, y * CELL + CELL / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      // Safe zone (start)
      ctx.fillStyle = '#4a9';
      ctx.fillRect(0, 9 * CELL, 560, CELL);

      // Home slots
      for (let i = 0; i < 5; i++) {
        const hx = i * 112 + 15;
        if (homes[i]) {
          // Filled home - show frog
          ctx.fillStyle = '#4a9';
          ctx.fillRect(hx, 5, 80, CELL - 10);
          drawSprite(ctx, FROG, hx + 20, 8, 4);
        } else {
          // Empty home
          ctx.fillStyle = '#1a3';
          ctx.fillRect(hx, 5, 80, CELL - 10);
        }
      }

      // Draw obstacles
      lanes.forEach(lane => {
        lane.obstacles.forEach(obs => {
          const oy = lane.y * CELL;
          
          if (obs.type === 'log') {
            // Draw log
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.roundRect(obs.x, oy + 8, obs.width, CELL - 16, 8);
            ctx.fill();
            ctx.fillStyle = '#654321';
            ctx.fillRect(obs.x + 10, oy + 15, 8, CELL - 30);
            ctx.fillRect(obs.x + obs.width - 25, oy + 12, 6, CELL - 24);
          } else if (obs.type === 'truck') {
            // Draw truck
            ctx.fillStyle = '#fff';
            ctx.fillRect(obs.x, oy + 8, obs.width, CELL - 16);
            ctx.fillStyle = '#f44';
            ctx.fillRect(obs.x, oy + 8, 25, CELL - 16);
            ctx.fillStyle = '#333';
            ctx.fillRect(obs.x + 5, oy + CELL - 14, 12, 8);
            ctx.fillRect(obs.x + obs.width - 20, oy + CELL - 14, 12, 8);
          } else {
            // Draw car
            const colors = ['#e53935', '#1e88e5', '#fdd835', '#7cb342'];
            ctx.fillStyle = colors[Math.floor(obs.x / 100) % colors.length];
            ctx.beginPath();
            ctx.roundRect(obs.x, oy + 10, obs.width, CELL - 20, 6);
            ctx.fill();
            // Windows
            ctx.fillStyle = '#4fc3f7';
            ctx.fillRect(obs.x + 10, oy + 14, 15, CELL - 28);
            ctx.fillRect(obs.x + obs.width - 25, oy + 14, 15, CELL - 28);
            // Wheels
            ctx.fillStyle = '#333';
            ctx.fillRect(obs.x + 5, oy + CELL - 14, 10, 6);
            ctx.fillRect(obs.x + obs.width - 15, oy + CELL - 14, 10, 6);
          }
        });
      });

      // Draw frog
      const fx = frogX * CELL;
      const fy = frogY * CELL;
      drawSprite(ctx, FROG, fx + 10, fy + 8, 4);

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold font-mono">
          <span className="text-green-400">SCORE: {score.toString().padStart(5, '0')}</span>
          <span className="text-red-400">LIVES: {'🐸'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-green-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">🐸🚗🪵</div>
              <h2 className="text-4xl font-bold mb-2 text-green-400">FROGGER</h2>
              <p className="text-gray-400 mb-6">Cross the road and river safely!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                START
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2">{won ? '🎉 YOU WIN! 🎉' : 'GAME OVER'}</h2>
              <p className="text-2xl text-green-400 mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️⬆️⬇️➡️ Hop</span>
          <span>🐸 Get all frogs home!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
