'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { drawSprite, INVADER_1, INVADER_2, PLAYER_SHIP } from '@/lib/sprites';

const game = getGameById('space-invaders')!;

const tutorial = {
  overview: 'The 1978 arcade legend that started it all! Defend Earth from waves of descending alien invaders. Shoot them before they reach the bottom, and take cover behind your shields!',
  howToPlay: [
    'Use LEFT/RIGHT arrows or A/D to move your cannon',
    'Press SPACE to fire at the aliens',
    'Destroy all aliens to advance to the next wave',
    'Hide behind shields to block enemy fire',
    'Watch out - aliens speed up as you destroy more of them!',
    'Bonus points for hitting the mystery UFO at the top',
  ],
  winCondition: 'Destroy all aliens in each wave. Survive as long as possible for a high score!',
  promptFlow: [
    'Grid of enemies moves side-to-side, drops down at edges',
    'Player shoots bullets upward, enemies shoot downward',
    'Collision detection for all bullets and entities',
    'Speed increases as fewer enemies remain',
  ],
  codeHighlights: [
    'Synchronized enemy grid movement',
    'Difficulty scaling based on remaining enemies',
    'Shield degradation system',
    'Mystery ship bonus spawning',
  ],
  techStack: ['Canvas 2D', 'Sprite Rendering', 'Collision Detection', 'Wave System'],
};

interface Enemy {
  x: number;
  y: number;
  alive: boolean;
  type: number;
}

interface Bullet {
  x: number;
  y: number;
  isPlayer: boolean;
}

interface Shield {
  x: number;
  y: number;
  health: number;
}

export default function SpaceInvadersGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 560;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Game state
    let playerX = width / 2 - 20;
    const playerY = height - 40;
    const playerWidth = 36;
    const playerSpeed = 5;

    const enemies: Enemy[] = [];
    const enemyRows = 5;
    const enemyCols = 11;
    const enemyWidth = 32;
    const enemyHeight = 24;
    const enemyPadding = 8;
    let enemyDirection = 1;
    let enemyMoveTimer = 0;
    let enemyMoveDelay = 30;
    const enemyDropAmount = 16;

    // Initialize enemies
    for (let row = 0; row < enemyRows; row++) {
      for (let col = 0; col < enemyCols; col++) {
        enemies.push({
          x: 40 + col * (enemyWidth + enemyPadding),
          y: 60 + row * (enemyHeight + enemyPadding),
          alive: true,
          type: row < 1 ? 2 : row < 3 ? 1 : 0,
        });
      }
    }

    // Shields
    const shields: Shield[] = [
      { x: 70, y: height - 100, health: 10 },
      { x: 180, y: height - 100, health: 10 },
      { x: 290, y: height - 100, health: 10 },
      { x: 400, y: height - 100, health: 10 },
    ];

    // Mystery ship
    let mysteryShip: { x: number; active: boolean } | null = null;
    let mysteryTimer = 0;

    let bullets: Bullet[] = [];
    let lastShot = 0;
    const shootCooldown = 400;
    let currentScore = 0;
    let currentLives = 3;
    let frame = 0;

    // Controls - using object to track pressed keys
    const keys: Record<string, boolean> = {};
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      // Prevent default for game keys to stop page scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
      }
      // Shoot on space press
      if (e.key === ' ') {
        const now = Date.now();
        if (now - lastShot > shootCooldown) {
          bullets.push({
            x: playerX + playerWidth / 2,
            y: playerY - 5,
            isPlayer: true,
          });
          lastShot = now;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId: number;

    function gameLoop() {
      if (!ctx) return;
      frame++;

      // Player movement - check each direction independently
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        playerX -= playerSpeed;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        playerX += playerSpeed;
      }
      // Clamp to bounds
      playerX = Math.max(10, Math.min(width - playerWidth - 10, playerX));

      // Move enemies (every N frames based on difficulty)
      const aliveCount = enemies.filter(e => e.alive).length;
      enemyMoveDelay = Math.max(5, 30 - Math.floor((55 - aliveCount) / 2));
      
      enemyMoveTimer++;
      if (enemyMoveTimer >= enemyMoveDelay) {
        enemyMoveTimer = 0;
        
        let hitEdge = false;
        let minX = width, maxX = 0, maxY = 0;
        
        enemies.forEach(enemy => {
          if (enemy.alive) {
            minX = Math.min(minX, enemy.x);
            maxX = Math.max(maxX, enemy.x + enemyWidth);
            maxY = Math.max(maxY, enemy.y + enemyHeight);
          }
        });

        if ((enemyDirection > 0 && maxX >= width - 20) || (enemyDirection < 0 && minX <= 20)) {
          hitEdge = true;
        }

        if (hitEdge) {
          enemyDirection *= -1;
          enemies.forEach(enemy => {
            if (enemy.alive) {
              enemy.y += enemyDropAmount;
            }
          });
        } else {
          enemies.forEach(enemy => {
            if (enemy.alive) {
              enemy.x += 8 * enemyDirection;
            }
          });
        }

        // Check if enemies reached bottom
        if (maxY >= playerY - 30) {
          setGameOver(true);
          return;
        }
      }

      // Mystery ship logic
      mysteryTimer++;
      if (!mysteryShip && mysteryTimer > 600 && Math.random() < 0.01) {
        mysteryShip = { x: -40, active: true };
        mysteryTimer = 0;
      }
      if (mysteryShip?.active) {
        mysteryShip.x += 2;
        if (mysteryShip.x > width + 40) {
          mysteryShip = null;
        }
      }

      // Move bullets
      bullets = bullets.filter(bullet => {
        bullet.y += bullet.isPlayer ? -8 : 3;
        return bullet.y > 0 && bullet.y < height;
      });

      // Enemy shooting
      if (frame % 60 === 0 && Math.random() < 0.5) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
          // Only bottom enemies can shoot
          const bottomEnemies: Enemy[] = [];
          for (let col = 0; col < enemyCols; col++) {
            for (let row = enemyRows - 1; row >= 0; row--) {
              const idx = row * enemyCols + col;
              if (enemies[idx]?.alive) {
                bottomEnemies.push(enemies[idx]);
                break;
              }
            }
          }
          if (bottomEnemies.length > 0) {
            const shooter = bottomEnemies[Math.floor(Math.random() * bottomEnemies.length)];
            bullets.push({
              x: shooter.x + enemyWidth / 2,
              y: shooter.y + enemyHeight,
              isPlayer: false,
            });
          }
        }
      }

      // Bullet collision with enemies
      bullets = bullets.filter(bullet => {
        if (!bullet.isPlayer) return true;
        
        // Check mystery ship
        if (mysteryShip?.active && 
            bullet.x > mysteryShip.x && bullet.x < mysteryShip.x + 40 &&
            bullet.y < 35) {
          currentScore += 100 + Math.floor(Math.random() * 200);
          setScore(currentScore);
          mysteryShip = null;
          return false;
        }
        
        for (const enemy of enemies) {
          if (enemy.alive &&
              bullet.x > enemy.x &&
              bullet.x < enemy.x + enemyWidth &&
              bullet.y > enemy.y &&
              bullet.y < enemy.y + enemyHeight) {
            enemy.alive = false;
            currentScore += (enemy.type + 1) * 10;
            setScore(currentScore);
            return false;
          }
        }
        return true;
      });

      // Bullet collision with shields
      bullets = bullets.filter(bullet => {
        for (const shield of shields) {
          if (shield.health > 0 &&
              bullet.x > shield.x && bullet.x < shield.x + 50 &&
              bullet.y > shield.y && bullet.y < shield.y + 30) {
            shield.health--;
            return false;
          }
        }
        return true;
      });

      // Bullet collision with player
      bullets = bullets.filter(bullet => {
        if (bullet.isPlayer) return true;
        
        if (bullet.x > playerX &&
            bullet.x < playerX + playerWidth &&
            bullet.y > playerY - 10 &&
            bullet.y < playerY + 20) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) {
            setGameOver(true);
          }
          return false;
        }
        return true;
      });

      // Check win
      if (enemies.every(e => !e.alive)) {
        setLevel(l => l + 1);
        enemies.forEach((enemy, i) => {
          enemy.alive = true;
          enemy.x = 40 + (i % enemyCols) * (enemyWidth + enemyPadding);
          enemy.y = 60 + Math.floor(i / enemyCols) * (enemyHeight + enemyPadding);
        });
        shields.forEach(s => s.health = 10);
        enemyMoveDelay = Math.max(10, 25 - level * 2);
      }

      // === DRAW ===
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const sx = (i * 127 + frame * 0.1) % width;
        const sy = (i * 73) % height;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Mystery ship
      if (mysteryShip?.active) {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.ellipse(mysteryShip.x + 20, 25, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f88';
        ctx.beginPath();
        ctx.ellipse(mysteryShip.x + 20, 22, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Dome
        ctx.fillStyle = '#0ff';
        ctx.beginPath();
        ctx.arc(mysteryShip.x + 20, 18, 6, Math.PI, 0);
        ctx.fill();
      }

      // Draw enemies with sprites
      enemies.forEach(enemy => {
        if (enemy.alive) {
          const sprite = enemy.type >= 1 ? INVADER_1 : INVADER_2;
          const wobble = frame % 30 < 15 ? 0 : 2;
          drawSprite(ctx, sprite, enemy.x, enemy.y + wobble, 3);
        }
      });

      // Draw shields
      shields.forEach(shield => {
        if (shield.health > 0) {
          const alpha = shield.health / 10;
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
          // Shield shape
          ctx.beginPath();
          ctx.moveTo(shield.x, shield.y + 30);
          ctx.lineTo(shield.x, shield.y + 10);
          ctx.quadraticCurveTo(shield.x, shield.y, shield.x + 10, shield.y);
          ctx.lineTo(shield.x + 40, shield.y);
          ctx.quadraticCurveTo(shield.x + 50, shield.y, shield.x + 50, shield.y + 10);
          ctx.lineTo(shield.x + 50, shield.y + 30);
          ctx.lineTo(shield.x + 35, shield.y + 30);
          ctx.lineTo(shield.x + 35, shield.y + 20);
          ctx.lineTo(shield.x + 15, shield.y + 20);
          ctx.lineTo(shield.x + 15, shield.y + 30);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw player with sprite
      drawSprite(ctx, PLAYER_SHIP, playerX, playerY, 5);

      // Draw bullets
      bullets.forEach(bullet => {
        ctx.fillStyle = bullet.isPlayer ? '#0f0' : '#fff';
        ctx.fillRect(bullet.x - 2, bullet.y, 4, bullet.isPlayer ? 12 : 8);
      });

      // Ground line
      ctx.fillStyle = '#0f0';
      ctx.fillRect(0, height - 5, width, 2);

      animationId = requestAnimationFrame(gameLoop);
    }

    animationId = requestAnimationFrame(gameLoop);

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
          <span className="text-green-400">SCORE: {score.toString().padStart(5, '0')}</span>
          <span className="text-red-400">LIVES: {'🚀'.repeat(lives)}</span>
          <span className="text-cyan-400">WAVE: {level}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-green-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">👾👾👾</div>
              <h2 className="text-4xl font-bold mb-2 text-green-400">SPACE INVADERS</h2>
              <p className="text-gray-400 mb-6">Defend Earth from the alien invasion!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                START
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
              <p className="text-2xl text-green-400 mb-4">Score: {score}</p>
              <p className="text-lg text-gray-400 mb-6">Wave Reached: {level}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️➡️ Move</span>
          <span>SPACE Shoot</span>
          <span>👾 Clear all aliens!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
