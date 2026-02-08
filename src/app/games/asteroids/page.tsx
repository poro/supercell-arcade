'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('asteroids')!;

const tutorial = {
  overview: 'Navigate your ship through an asteroid field! Rotate, thrust, and shoot to survive.',
  promptFlow: ['Ship rotation and thrust', 'Wrap-around screen edges', 'Asteroid splitting', 'Collision detection'],
  codeHighlights: ['Vector physics', 'Screen wrapping', 'Asteroid spawning'],
};

export default function AsteroidsGame() {
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

    canvas!.width = 700;
    canvas!.height = 500;

    let ship = { x: 350, y: 250, angle: 0, vx: 0, vy: 0 };
    let bullets: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let asteroids: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    let currentScore = 0;
    let currentLives = 3;

    // Spawn initial asteroids
    for (let i = 0; i < 5; i++) {
      asteroids.push({
        x: Math.random() * 700,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        size: 40,
      });
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastShot = 0;

    function loop() {
      if (!ctx) return;

      // Controls
      if (keys['ArrowLeft'] || keys['a']) ship.angle -= 0.1;
      if (keys['ArrowRight'] || keys['d']) ship.angle += 0.1;
      if (keys['ArrowUp'] || keys['w']) {
        ship.vx += Math.sin(ship.angle) * 0.2;
        ship.vy -= Math.cos(ship.angle) * 0.2;
      }
      if (keys[' '] && Date.now() - lastShot > 200) {
        bullets.push({
          x: ship.x,
          y: ship.y,
          vx: Math.sin(ship.angle) * 8,
          vy: -Math.cos(ship.angle) * 8,
          life: 50,
        });
        lastShot = Date.now();
      }

      // Update ship
      ship.x += ship.vx;
      ship.y += ship.vy;
      ship.vx *= 0.99;
      ship.vy *= 0.99;

      // Wrap
      if (ship.x < 0) ship.x = 700;
      if (ship.x > 700) ship.x = 0;
      if (ship.y < 0) ship.y = 500;
      if (ship.y > 500) ship.y = 0;

      // Update bullets
      bullets = bullets.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.x < 0) b.x = 700;
        if (b.x > 700) b.x = 0;
        if (b.y < 0) b.y = 500;
        if (b.y > 500) b.y = 0;
        return b.life > 0;
      });

      // Update asteroids
      asteroids.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -50) a.x = 750;
        if (a.x > 750) a.x = -50;
        if (a.y < -50) a.y = 550;
        if (a.y > 550) a.y = -50;
      });

      // Bullet-asteroid collision
      bullets = bullets.filter(b => {
        for (let i = asteroids.length - 1; i >= 0; i--) {
          const a = asteroids[i];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist < a.size) {
            currentScore += Math.round(100 / a.size);
            setScore(currentScore);
            
            if (a.size > 15) {
              asteroids.push(
                { x: a.x, y: a.y, vx: a.vy, vy: -a.vx, size: a.size / 2 },
                { x: a.x, y: a.y, vx: -a.vy, vy: a.vx, size: a.size / 2 }
              );
            }
            asteroids.splice(i, 1);
            return false;
          }
        }
        return true;
      });

      // Ship-asteroid collision
      for (const a of asteroids) {
        const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
        if (dist < a.size + 10) {
          currentLives--;
          setLives(currentLives);
          ship = { x: 350, y: 250, angle: 0, vx: 0, vy: 0 };
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          }
          break;
        }
      }

      // Spawn more asteroids
      if (asteroids.length < 3) {
        asteroids.push({
          x: Math.random() > 0.5 ? 0 : 700,
          y: Math.random() * 500,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: 40,
        });
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 700, 500);

      // Ship
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(10, 15);
      ctx.lineTo(-10, 15);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Bullets
      ctx.fillStyle = '#ff0';
      bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Asteroids
      ctx.strokeStyle = '#888';
      asteroids.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.stroke();
      });

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-red-400">Lives: {'🚀'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border border-gray-600" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🚀 Asteroids</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg">Try Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to move • Space to shoot</div>
      </div>
    </GameWrapper>
  );
}
