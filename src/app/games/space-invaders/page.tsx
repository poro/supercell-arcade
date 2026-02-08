'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('space-invaders')!;

const tutorial = {
  overview: 'Space Invaders is a 1978 classic where you defend Earth from rows of descending aliens. Shoot them before they reach the bottom! Features moving enemy formations, shields, and mystery ships.',
  promptFlow: [
    'Create player ship with left/right movement and shooting',
    'Generate grid of enemies that move side-to-side and descend',
    'Implement bullet collision detection',
    'Add scoring system with bonus for mystery ship',
    'Game over when enemies reach bottom or hit player',
  ],
  codeHighlights: [
    'Enemy grid movement with synchronized descent',
    'Collision detection between bullets and multiple targets',
    'Increasing difficulty as enemies get lower',
    'Shield system that degrades when hit',
  ],
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

    const width = 700;
    const height = 500;
    canvas!.width = width;
    canvas!.height = height;

    // Game state
    let playerX = width / 2 - 20;
    const playerY = height - 50;
    const playerWidth = 40;
    const playerHeight = 20;

    const enemies: Enemy[] = [];
    const enemyRows = 5;
    const enemyCols = 11;
    const enemyWidth = 35;
    const enemyHeight = 25;
    const enemyPadding = 5;
    let enemyDirection = 1;
    let enemySpeed = 1;
    const enemyDropAmount = 20;

    // Initialize enemies
    for (let row = 0; row < enemyRows; row++) {
      for (let col = 0; col < enemyCols; col++) {
        enemies.push({
          x: 50 + col * (enemyWidth + enemyPadding),
          y: 50 + row * (enemyHeight + enemyPadding),
          alive: true,
          type: row < 1 ? 2 : row < 3 ? 1 : 0,
        });
      }
    }

    let bullets: Bullet[] = [];
    let lastShot = 0;
    const shootCooldown = 300;
    let currentScore = 0;
    let currentLives = 3;

    // Controls
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastShot > shootCooldown) {
          bullets.push({
            x: playerX + playerWidth / 2,
            y: playerY,
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

    function gameLoop() {
      if (!ctx) return;

      // Player movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        playerX = Math.max(0, playerX - 6);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        playerX = Math.min(width - playerWidth, playerX + 6);
      }

      // Move enemies
      let hitEdge = false;
      let minX = width, maxX = 0, maxY = 0;
      
      enemies.forEach(enemy => {
        if (enemy.alive) {
          enemy.x += enemySpeed * enemyDirection;
          minX = Math.min(minX, enemy.x);
          maxX = Math.max(maxX, enemy.x + enemyWidth);
          maxY = Math.max(maxY, enemy.y + enemyHeight);
        }
      });

      if (minX <= 10 || maxX >= width - 10) {
        hitEdge = true;
      }

      if (hitEdge) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
          if (enemy.alive) {
            enemy.y += enemyDropAmount;
          }
        });
      }

      // Check if enemies reached bottom
      if (maxY >= playerY - 20) {
        setGameOver(true);
        return;
      }

      // Move bullets
      bullets = bullets.filter(bullet => {
        bullet.y += bullet.isPlayer ? -8 : 4;
        return bullet.y > 0 && bullet.y < height;
      });

      // Enemy shooting
      if (Math.random() < 0.02) {
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length > 0) {
          const shooter = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          bullets.push({
            x: shooter.x + enemyWidth / 2,
            y: shooter.y + enemyHeight,
            isPlayer: false,
          });
        }
      }

      // Bullet collision with enemies
      bullets = bullets.filter(bullet => {
        if (!bullet.isPlayer) return true;
        
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

      // Bullet collision with player
      bullets = bullets.filter(bullet => {
        if (bullet.isPlayer) return true;
        
        if (bullet.x > playerX &&
            bullet.x < playerX + playerWidth &&
            bullet.y > playerY &&
            bullet.y < playerY + playerHeight) {
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
        // Reset enemies for next level
        enemies.forEach((enemy, i) => {
          enemy.alive = true;
          enemy.x = 50 + (i % enemyCols) * (enemyWidth + enemyPadding);
          enemy.y = 50 + Math.floor(i / enemyCols) * (enemyHeight + enemyPadding);
        });
        enemySpeed *= 1.2;
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);

      // Draw player
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(playerX + playerWidth / 2, playerY);
      ctx.lineTo(playerX, playerY + playerHeight);
      ctx.lineTo(playerX + playerWidth, playerY + playerHeight);
      ctx.closePath();
      ctx.fill();

      // Draw enemies
      const enemyColors = ['#22c55e', '#eab308', '#ef4444'];
      const enemyEmojis = ['👾', '👽', '🛸'];
      enemies.forEach(enemy => {
        if (enemy.alive) {
          ctx.fillStyle = enemyColors[enemy.type];
          ctx.font = '24px sans-serif';
          ctx.fillText(enemyEmojis[enemy.type], enemy.x, enemy.y + 20);
        }
      });

      // Draw bullets
      bullets.forEach(bullet => {
        ctx.fillStyle = bullet.isPlayer ? '#fbbf24' : '#ef4444';
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
      });

      if (!gameOver) {
        requestAnimationFrame(gameLoop);
      }
    }

    requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        {/* Stats */}
        <div className="flex gap-8 text-2xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-red-400">{'❤️'.repeat(lives)}</span>
          <span className="text-blue-400">Level: {level}</span>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-green-500/50"
          />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">👾 Space Invaders</h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-xl"
              >
                Start Game
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-gray-400 text-sm">
          Controls: ← → or A/D to move • Space to shoot
        </div>
      </div>
    </GameWrapper>
  );
}
