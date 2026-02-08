'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('lunar-lander')!;

const tutorial = {
  overview: 'Land your spacecraft safely on the landing pad! Control thrust and rotation to touch down gently.',
  promptFlow: ['Physics simulation with gravity', 'Thrust and rotation controls', 'Fuel management', 'Safe landing detection'],
  codeHighlights: ['Realistic physics model', 'Velocity-based landing check', 'Terrain collision'],
};

export default function LunarLanderGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fuel, setFuel] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setFuel(100);
    setGameOver(false);
    setWon(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 500;

    let lander = { x: 250, y: 50, vx: 0, vy: 0, angle: 0 };
    let currentFuel = 100;
    const gravity = 0.02;
    const thrustPower = 0.08;
    const landingPad = { x: 200, y: 450, width: 100 };

    const terrain = [
      { x: 0, y: 400 },
      { x: 100, y: 420 },
      { x: 150, y: 380 },
      { x: 200, y: 450 },
      { x: 300, y: 450 },
      { x: 350, y: 400 },
      { x: 400, y: 430 },
      { x: 500, y: 410 },
    ];

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop() {
      if (!ctx) return;

      // Controls
      if (keys['ArrowLeft']) lander.angle -= 0.05;
      if (keys['ArrowRight']) lander.angle += 0.05;
      if (keys['ArrowUp'] && currentFuel > 0) {
        lander.vx += Math.sin(lander.angle) * thrustPower;
        lander.vy -= Math.cos(lander.angle) * thrustPower;
        currentFuel -= 0.3;
        setFuel(Math.round(currentFuel));
      }

      // Physics
      lander.vy += gravity;
      lander.x += lander.vx;
      lander.y += lander.vy;

      // Screen wrap
      if (lander.x < 0) lander.x = 500;
      if (lander.x > 500) lander.x = 0;

      // Landing check
      if (lander.y >= landingPad.y - 15) {
        if (lander.x >= landingPad.x && lander.x <= landingPad.x + landingPad.width) {
          if (Math.abs(lander.vy) < 1 && Math.abs(lander.vx) < 0.5 && Math.abs(lander.angle) < 0.3) {
            setWon(true);
            setGameOver(true);
            return;
          }
        }
        setGameOver(true);
        return;
      }

      // Terrain collision
      for (let i = 0; i < terrain.length - 1; i++) {
        const t1 = terrain[i];
        const t2 = terrain[i + 1];
        if (lander.x >= t1.x && lander.x <= t2.x) {
          const terrainY = t1.y + (t2.y - t1.y) * ((lander.x - t1.x) / (t2.x - t1.x));
          if (lander.y >= terrainY - 10) {
            setGameOver(true);
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 500, 500);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        ctx.fillRect((i * 73) % 500, (i * 37) % 400, 1, 1);
      }

      // Terrain
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(0, 500);
      terrain.forEach(t => ctx.lineTo(t.x, t.y));
      ctx.lineTo(500, 500);
      ctx.fill();

      // Landing pad
      ctx.fillStyle = '#0f0';
      ctx.fillRect(landingPad.x, landingPad.y, landingPad.width, 5);

      // Lander
      ctx.save();
      ctx.translate(lander.x, lander.y);
      ctx.rotate(lander.angle);
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-10, 10);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.fill();

      // Flame
      if (keys['ArrowUp'] && currentFuel > 0) {
        ctx.fillStyle = '#f80';
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(0, 25 + Math.random() * 10);
        ctx.lineTo(5, 10);
        ctx.fill();
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText(`VX: ${lander.vx.toFixed(2)}`, 10, 20);
      ctx.fillText(`VY: ${lander.vy.toFixed(2)}`, 10, 40);
      ctx.fillText(`Fuel: ${Math.round(currentFuel)}`, 10, 60);

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
          <span className="text-yellow-400">Fuel: {fuel}%</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🚀 Lunar Lander</h2>
              <p className="text-gray-400 mb-4">Land gently on the green pad!</p>
              <button onClick={resetGame} className="px-6 py-3 bg-blue-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{won ? '🎉 Safe Landing!' : '💥 Crashed!'}</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-blue-500 rounded-lg">Try Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">← → to rotate • ↑ to thrust • Land slowly on the green pad!</div>
      </div>
    </GameWrapper>
  );
}
