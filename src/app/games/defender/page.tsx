'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('defender')!;

const tutorial = {
  overview: 'Defend the humanoids! Shoot aliens before they abduct people from the ground.',
  promptFlow: ['Horizontal scrolling', 'Shooting mechanics', 'Humanoid protection', 'Smart bomb'],
  codeHighlights: ['Wrap-around world', 'Alien abduction AI', 'Rescue mechanics'],
};

export default function DefenderGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [humanoids, setHumanoids] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setHumanoids(10);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    let player = { x: 100, y: 150, vx: 0, vy: 0, dir: 1 };
    let bullets: { x: number; y: number; dir: number }[] = [];
    let aliens: { x: number; y: number; vy: number; hasHuman: boolean }[] = [];
    let humans: { x: number; carried: boolean }[] = [];
    let scrollX = 0;
    let currentScore = 0;
    let currentHumanoids = 10;

    // Init humans
    for (let i = 0; i < 10; i++) {
      humans.push({ x: i * 200 + 100, carried: false });
    }

    // Spawn aliens
    for (let i = 0; i < 5; i++) {
      aliens.push({ x: Math.random() * 2000, y: Math.random() * 100 + 50, vy: 0, hasHuman: false });
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastShot = 0;

    function loop() {
      if (!ctx) return;

      // Player controls
      if (keys['ArrowUp']) player.vy -= 0.5;
      if (keys['ArrowDown']) player.vy += 0.5;
      if (keys['ArrowLeft']) { player.vx -= 0.3; player.dir = -1; }
      if (keys['ArrowRight']) { player.vx += 0.3; player.dir = 1; }

      if (keys[' '] && Date.now() - lastShot > 100) {
        bullets.push({ x: player.x + scrollX, y: player.y, dir: player.dir });
        lastShot = Date.now();
      }

      player.vy *= 0.95;
      player.vx *= 0.95;
      player.y = Math.max(20, Math.min(260, player.y + player.vy));
      scrollX += player.vx * 2;

      // Update bullets
      bullets = bullets.filter(b => {
        b.x += b.dir * 10;
        return Math.abs(b.x - scrollX - player.x) < 400;
      });

      // Update aliens
      aliens.forEach(alien => {
        if (!alien.hasHuman) {
          // Find nearest human
          const target = humans.find(h => !h.carried && Math.abs(h.x - alien.x) < 100);
          if (target) {
            alien.x += Math.sign(target.x - alien.x) * 0.5;
            if (alien.y < 250) alien.vy = 1;
          }
        } else {
          alien.vy = -1;
          if (alien.y < -50) {
            currentHumanoids--;
            setHumanoids(currentHumanoids);
            alien.hasHuman = false;
            alien.y = 50;
            if (currentHumanoids <= 0) setGameOver(true);
          }
        }
        alien.y += alien.vy;
        alien.y = Math.max(-50, Math.min(260, alien.y));

        // Grab human
        if (!alien.hasHuman && alien.y > 240) {
          const human = humans.find(h => !h.carried && Math.abs(h.x - alien.x) < 20);
          if (human) {
            human.carried = true;
            alien.hasHuman = true;
            alien.vy = -1;
          }
        }
      });

      // Bullet-alien collision
      bullets = bullets.filter(bullet => {
        for (let i = aliens.length - 1; i >= 0; i--) {
          if (Math.hypot(bullet.x - aliens[i].x, bullet.y - aliens[i].y) < 15) {
            if (aliens[i].hasHuman) {
              // Human falls
              const human = humans.find(h => h.carried);
              if (human) human.carried = false;
            }
            aliens.splice(i, 1);
            currentScore += 150;
            setScore(currentScore);
            
            // Respawn alien
            aliens.push({ x: scrollX + (Math.random() > 0.5 ? 700 : -700), y: Math.random() * 100 + 50, vy: 0, hasHuman: false });
            return false;
          }
        }
        return true;
      });

      // Draw
      ctx.fillStyle = '#001';
      ctx.fillRect(0, 0, 600, 300);

      // Stars
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(((i * 123 - scrollX * 0.2) % 600 + 600) % 600, (i * 47) % 280, 1, 1);
      }

      // Ground
      ctx.fillStyle = '#040';
      ctx.fillRect(0, 270, 600, 30);

      // Mountains
      ctx.fillStyle = '#020';
      for (let i = 0; i < 20; i++) {
        const mx = ((i * 150 - scrollX * 0.5) % 3000 + 3000) % 3000 - 500;
        ctx.beginPath();
        ctx.moveTo(mx, 270);
        ctx.lineTo(mx + 75, 200 + (i % 3) * 20);
        ctx.lineTo(mx + 150, 270);
        ctx.fill();
      }

      // Humans
      ctx.fillStyle = '#0ff';
      humans.forEach(human => {
        if (!human.carried) {
          const hx = human.x - scrollX + player.x;
          if (hx > -20 && hx < 620) {
            ctx.fillRect(hx - 3, 260, 6, 15);
          }
        }
      });

      // Aliens
      ctx.fillStyle = '#f0f';
      aliens.forEach(alien => {
        const ax = alien.x - scrollX + player.x;
        if (ax > -20 && ax < 620) {
          ctx.beginPath();
          ctx.arc(ax, alien.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Bullets
      ctx.fillStyle = '#ff0';
      bullets.forEach(b => {
        const bx = b.x - scrollX + player.x;
        ctx.fillRect(bx - 5, b.y - 1, 10, 2);
      });

      // Player
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(player.x + player.dir * 15, player.y);
      ctx.lineTo(player.x - player.dir * 10, player.y - 8);
      ctx.lineTo(player.x - player.dir * 10, player.y + 8);
      ctx.closePath();
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
          <span className="text-green-400">Score: {score}</span>
          <span className="text-cyan-400">Humanoids: {humanoids}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🛸 Defender</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to move • Space to shoot • Save the humanoids!</div>
      </div>
    </GameWrapper>
  );
}
