'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('joust')!;

const tutorial = {
  overview: 'Flap to fly and defeat enemies by landing on them from above! Be higher to win the joust.',
  promptFlow: ['Flapping flight physics', 'Height-based combat', 'Platform landing', 'Wave enemies'],
  codeHighlights: ['Gravity with flap impulse', 'Collision from above wins', 'Wrap-around screen'],
};

export default function JoustGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setWave(1);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 400;

    const platforms = [
      { x: 0, y: 380, w: 500, h: 20 },
      { x: 50, y: 280, w: 150, h: 15 },
      { x: 300, y: 280, w: 150, h: 15 },
      { x: 175, y: 180, w: 150, h: 15 },
    ];

    let player = { x: 250, y: 350, vx: 0, vy: 0 };
    let enemies: { x: number; y: number; vx: number; vy: number }[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let currentWave = 1;

    const spawnEnemies = () => {
      enemies = [];
      for (let i = 0; i < currentWave + 2; i++) {
        enemies.push({
          x: Math.random() * 400 + 50,
          y: Math.random() * 200 + 50,
          vx: (Math.random() - 0.5) * 2,
          vy: 0,
        });
      }
    };
    spawnEnemies();

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop() {
      if (!ctx) return;

      // Player controls
      if (keys['ArrowLeft']) player.vx -= 0.3;
      if (keys['ArrowRight']) player.vx += 0.3;
      if (keys[' '] || keys['ArrowUp']) player.vy -= 0.8;

      // Physics
      player.vy += 0.3;
      player.vx *= 0.98;
      player.x += player.vx;
      player.y += player.vy;

      // Wrap screen
      if (player.x < 0) player.x = 500;
      if (player.x > 500) player.x = 0;

      // Platform collision
      platforms.forEach(p => {
        if (player.y >= p.y - 15 && player.y <= p.y && 
            player.x > p.x && player.x < p.x + p.w && player.vy > 0) {
          player.y = p.y - 15;
          player.vy = 0;
        }
      });

      player.y = Math.max(10, Math.min(370, player.y));

      // Enemy AI
      enemies.forEach(enemy => {
        enemy.vy += 0.2;
        if (Math.random() < 0.05) enemy.vy -= 3;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        if (enemy.x < 0) enemy.x = 500;
        if (enemy.x > 500) enemy.x = 0;

        platforms.forEach(p => {
          if (enemy.y >= p.y - 15 && enemy.y <= p.y && 
              enemy.x > p.x && enemy.x < p.x + p.w && enemy.vy > 0) {
            enemy.y = p.y - 15;
            enemy.vy = 0;
          }
        });

        enemy.y = Math.max(10, Math.min(370, enemy.y));
      });

      // Combat
      enemies = enemies.filter(enemy => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < 25) {
          if (player.y < enemy.y - 5) {
            // Player wins
            currentScore += 100;
            setScore(currentScore);
            return false;
          } else if (player.y > enemy.y + 5) {
            // Enemy wins
            currentLives--;
            setLives(currentLives);
            player = { x: 250, y: 350, vx: 0, vy: 0 };
            if (currentLives <= 0) setGameOver(true);
          }
        }
        return true;
      });

      // Next wave
      if (enemies.length === 0) {
        currentWave++;
        setWave(currentWave);
        spawnEnemies();
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 500, 400);

      // Platforms
      ctx.fillStyle = '#654';
      platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

      // Enemies
      ctx.fillStyle = '#f00';
      enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 12, 0, Math.PI * 2);
      ctx.fill();

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
          <span className="text-yellow-400">Score: {score}</span>
          <span className="text-blue-400">Wave: {wave}</span>
          <span className="text-red-400">Lives: {lives}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🦅 Joust</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-yellow-500 rounded-lg text-xl text-black">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-yellow-500 rounded-lg text-black">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">← → to move • Space/↑ to flap • Be ABOVE enemies to defeat them!</div>
      </div>
    </GameWrapper>
  );
}
