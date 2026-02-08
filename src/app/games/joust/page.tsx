'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { drawSprite, JOUST_PLAYER, JOUST_ENEMY } from '@/lib/sprites';

const game = getGameById('joust')!;

const tutorial = {
  overview: 'Classic 1982 arcade action! Mount your flying ostrich and defeat enemy knights in aerial jousting combat. The key to victory: always attack from above. When two knights collide, the one with higher altitude wins the joust.',
  howToPlay: [
    'Use LEFT/RIGHT arrows to move horizontally',
    'Press SPACE or UP to flap your wings and gain altitude',
    'Collide with enemies from ABOVE to defeat them',
    'If an enemy is higher than you, they win!',
    'Clear all enemies to advance to the next wave',
    'Land on platforms to rest and plan your attack',
  ],
  winCondition: 'Survive as long as possible and score points by defeating enemy knights. Each wave brings more enemies!',
  promptFlow: ['Flapping flight physics with gravity', 'Height-based combat resolution', 'Platform collision detection', 'Wave-based enemy spawning'],
  codeHighlights: [
    'Physics simulation with gravity and flap impulse',
    'Collision detection comparing Y positions (higher wins)',
    'Screen wrap-around for continuous movement',
    'Sprite-based rendering with pixel art',
    'Wave difficulty scaling',
  ],
  techStack: ['Canvas 2D', 'RequestAnimationFrame', 'Keyboard Events', 'Sprite System'],
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

    canvas.width = 512;
    canvas.height = 400;

    // Lava pit at bottom
    const lavaY = 380;
    
    // Platforms - floating rock formations
    const platforms = [
      { x: 0, y: lavaY, w: 512, h: 20 }, // Bottom (lava)
      { x: 50, y: 300, w: 120, h: 12 },
      { x: 350, y: 300, w: 120, h: 12 },
      { x: 180, y: 220, w: 150, h: 12 },
      { x: 0, y: 140, w: 100, h: 12 },
      { x: 412, y: 140, w: 100, h: 12 },
      { x: 200, y: 80, w: 112, h: 12 },
    ];

    let player = { x: 250, y: 350, vx: 0, vy: 0, facing: 1, flapping: false };
    let enemies: { x: number; y: number; vx: number; vy: number; facing: number }[] = [];
    let eggs: { x: number; y: number; vy: number; timer: number }[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let currentWave = 1;
    let flapFrame = 0;

    const spawnEnemies = () => {
      enemies = [];
      for (let i = 0; i < currentWave + 2; i++) {
        enemies.push({
          x: Math.random() * 400 + 50,
          y: Math.random() * 150 + 50,
          vx: (Math.random() - 0.5) * 3,
          vy: 0,
          facing: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };
    spawnEnemies();

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId: number;

    function loop() {
      if (!ctx) return;
      flapFrame++;

      // Player controls
      if (keys['ArrowLeft'] || keys['a']) {
        player.vx -= 0.4;
        player.facing = -1;
      }
      if (keys['ArrowRight'] || keys['d']) {
        player.vx += 0.4;
        player.facing = 1;
      }
      if (keys[' '] || keys['ArrowUp']) {
        player.vy -= 0.9;
        player.flapping = true;
      } else {
        player.flapping = false;
      }

      // Physics
      player.vy += 0.35; // Gravity
      player.vx *= 0.98; // Air resistance
      player.vy = Math.max(-8, Math.min(8, player.vy)); // Terminal velocity
      player.x += player.vx;
      player.y += player.vy;

      // Wrap screen
      if (player.x < -20) player.x = 530;
      if (player.x > 530) player.x = -20;

      // Platform collision
      platforms.forEach((p, i) => {
        if (i === 0) return; // Skip lava
        if (player.y >= p.y - 20 && player.y <= p.y && 
            player.x > p.x - 10 && player.x < p.x + p.w + 10 && player.vy > 0) {
          player.y = p.y - 20;
          player.vy = 0;
        }
      });

      // Lava death
      if (player.y > lavaY - 10) {
        currentLives--;
        setLives(currentLives);
        player = { x: 250, y: 200, vx: 0, vy: 0, facing: 1, flapping: false };
        if (currentLives <= 0) setGameOver(true);
      }

      player.y = Math.max(10, player.y);

      // Enemy AI
      enemies.forEach(enemy => {
        enemy.vy += 0.25;
        if (Math.random() < 0.06) {
          enemy.vy -= 4;
        }
        
        // Chase player somewhat
        if (Math.random() < 0.02) {
          enemy.vx += Math.sign(player.x - enemy.x) * 0.5;
        }
        
        enemy.vx *= 0.99;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        enemy.facing = enemy.vx > 0 ? 1 : -1;
        
        // Wrap
        if (enemy.x < -20) enemy.x = 530;
        if (enemy.x > 530) enemy.x = -20;

        // Platform collision
        platforms.forEach((p, i) => {
          if (i === 0) return;
          if (enemy.y >= p.y - 20 && enemy.y <= p.y && 
              enemy.x > p.x - 10 && enemy.x < p.x + p.w + 10 && enemy.vy > 0) {
            enemy.y = p.y - 20;
            enemy.vy = 0;
          }
        });

        enemy.y = Math.max(10, Math.min(lavaY - 20, enemy.y));
      });

      // Egg logic
      eggs = eggs.filter(egg => {
        egg.vy += 0.3;
        egg.y += egg.vy;
        egg.timer++;
        
        // Platform collision
        platforms.forEach((p, i) => {
          if (egg.y >= p.y - 5 && egg.y <= p.y && egg.vy > 0) {
            egg.y = p.y - 5;
            egg.vy = 0;
          }
        });
        
        // Hatch into enemy
        if (egg.timer > 180) {
          enemies.push({
            x: egg.x,
            y: egg.y,
            vx: (Math.random() - 0.5) * 2,
            vy: -3,
            facing: Math.random() > 0.5 ? 1 : -1,
          });
          return false;
        }
        
        // Collect egg
        const dist = Math.hypot(egg.x - player.x, egg.y - player.y);
        if (dist < 20) {
          currentScore += 250;
          setScore(currentScore);
          return false;
        }
        
        return egg.y < lavaY;
      });

      // Combat
      enemies = enemies.filter(enemy => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (dist < 28) {
          if (player.y < enemy.y - 8) {
            // Player wins - spawn egg
            currentScore += 100;
            setScore(currentScore);
            eggs.push({ x: enemy.x, y: enemy.y, vy: 0, timer: 0 });
            return false;
          } else if (player.y > enemy.y + 8) {
            // Enemy wins
            currentLives--;
            setLives(currentLives);
            player = { x: 250, y: 200, vx: 0, vy: 0, facing: 1, flapping: false };
            if (currentLives <= 0) setGameOver(true);
          }
        }
        return true;
      });

      // Next wave
      if (enemies.length === 0 && eggs.length === 0) {
        currentWave++;
        setWave(currentWave);
        spawnEnemies();
      }

      // === DRAW ===
      // Background - dark with stars
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 512, 400);
      
      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 73) % 512;
        const sy = (i * 41) % 350;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Lava
      ctx.fillStyle = '#f40';
      ctx.fillRect(0, lavaY, 512, 20);
      ctx.fillStyle = '#fa0';
      for (let i = 0; i < 512; i += 8) {
        const h = Math.sin(flapFrame * 0.1 + i * 0.1) * 3;
        ctx.fillRect(i, lavaY + h, 6, 8);
      }

      // Platforms - rocky look
      ctx.fillStyle = '#654';
      platforms.forEach((p, i) => {
        if (i === 0) return;
        // Main platform
        ctx.fillStyle = '#765';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        // Top edge
        ctx.fillStyle = '#987';
        ctx.fillRect(p.x, p.y, p.w, 3);
        // Bottom shadow
        ctx.fillStyle = '#432';
        ctx.fillRect(p.x, p.y + p.h - 3, p.w, 3);
      });

      // Eggs
      ctx.fillStyle = '#fff';
      eggs.forEach(egg => {
        ctx.beginPath();
        ctx.ellipse(egg.x, egg.y, 6, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemies with sprite
      enemies.forEach(e => {
        const flip = e.facing < 0;
        drawSprite(ctx, JOUST_ENEMY, e.x - 18, e.y - 14, 3, flip);
      });

      // Player with sprite
      const playerFlip = player.facing < 0;
      drawSprite(ctx, JOUST_PLAYER, player.x - 18, player.y - 14, 3, playerFlip);
      
      // Flap effect
      if (player.flapping && flapFrame % 4 < 2) {
        ctx.fillStyle = '#fa0';
        ctx.beginPath();
        ctx.moveTo(player.x - 10 * player.facing, player.y + 5);
        ctx.lineTo(player.x - 20 * player.facing, player.y + 15);
        ctx.lineTo(player.x, player.y + 10);
        ctx.fill();
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold font-mono">
          <span className="text-yellow-400">SCORE: {score.toString().padStart(6, '0')}</span>
          <span className="text-cyan-400">WAVE: {wave}</span>
          <span className="text-red-400">LIVES: {'🦅'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-purple-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">🦅⚔️🦅</div>
              <h2 className="text-4xl font-bold mb-2 text-yellow-400">JOUST</h2>
              <p className="text-gray-400 mb-6">Defeat enemies by attacking from above!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                INSERT COIN
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
              <p className="text-2xl text-yellow-400 mb-4">Final Score: {score}</p>
              <p className="text-lg text-gray-400 mb-6">Wave Reached: {wave}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️➡️ Move</span>
          <span>SPACE/⬆️ Flap</span>
          <span>⚔️ Attack from above!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
