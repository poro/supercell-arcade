'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('centipede')!;

const tutorial = {
  overview: 'Shoot the descending centipede! When hit, segments split. Clear mushrooms and avoid the spider!',
  promptFlow: ['Centipede movement', 'Segment splitting', 'Mushroom obstacles', 'Spider enemy'],
  codeHighlights: ['Linked segment behavior', 'Collision with mushrooms', 'Multi-enemy management'],
};

export default function CentipedeGame() {
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

    const CELL = 20;
    const COLS = 25;
    const ROWS = 25;
    canvas!.width = COLS * CELL;
    canvas!.height = ROWS * CELL;

    let playerX = 12;
    let playerY = 23;
    let bullets: { x: number; y: number }[] = [];
    let mushrooms: Set<string> = new Set();
    let currentScore = 0;
    let currentLives = 3;

    // Spawn mushrooms
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.random() * COLS);
      const y = 2 + Math.floor(Math.random() * 18);
      mushrooms.add(`${x},${y}`);
    }

    // Centipede segments
    let centipede = Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: 0,
      dir: 1,
      descending: false,
    }));

    // Spider
    let spider = { x: 0, y: 20, vx: 2, vy: 0 };

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;
    let lastShot = 0;

    function loop() {
      if (!ctx) return;
      frame++;

      // Player movement
      if (keys['ArrowLeft'] && playerX > 0) playerX -= 0.3;
      if (keys['ArrowRight'] && playerX < COLS - 1) playerX += 0.3;
      if (keys['ArrowUp'] && playerY > 20) playerY -= 0.3;
      if (keys['ArrowDown'] && playerY < ROWS - 1) playerY += 0.3;
      if (keys[' '] && Date.now() - lastShot > 150) {
        bullets.push({ x: Math.round(playerX), y: playerY - 1 });
        lastShot = Date.now();
      }

      // Update bullets
      bullets = bullets.filter(b => {
        b.y -= 0.5;
        return b.y > 0;
      });

      // Move centipede
      if (frame % 5 === 0) {
        centipede.forEach(seg => {
          if (seg.descending) {
            seg.y++;
            seg.descending = false;
          } else {
            seg.x += seg.dir;
            if (seg.x <= 0 || seg.x >= COLS - 1 || mushrooms.has(`${seg.x + seg.dir},${seg.y}`)) {
              seg.dir *= -1;
              seg.descending = true;
            }
          }

          if (seg.y >= ROWS) {
            seg.y = 0;
            seg.x = Math.floor(Math.random() * COLS);
          }
        });
      }

      // Move spider
      spider.x += spider.vx * 0.1;
      spider.y += Math.sin(frame / 20) * 0.3;
      if (spider.x <= 0 || spider.x >= COLS - 1) spider.vx *= -1;

      // Bullet collisions
      bullets = bullets.filter(b => {
        // Hit mushroom
        const mKey = `${Math.round(b.x)},${Math.round(b.y)}`;
        if (mushrooms.has(mKey)) {
          mushrooms.delete(mKey);
          currentScore += 1;
          setScore(currentScore);
          return false;
        }

        // Hit centipede
        for (let i = centipede.length - 1; i >= 0; i--) {
          if (Math.abs(b.x - centipede[i].x) < 1 && Math.abs(b.y - centipede[i].y) < 1) {
            mushrooms.add(`${centipede[i].x},${centipede[i].y}`);
            centipede.splice(i, 1);
            currentScore += 10;
            setScore(currentScore);
            return false;
          }
        }

        // Hit spider
        if (Math.abs(b.x - spider.x) < 2 && Math.abs(b.y - spider.y) < 2) {
          spider.x = Math.random() > 0.5 ? 0 : COLS - 1;
          spider.y = 20;
          currentScore += 50;
          setScore(currentScore);
          return false;
        }

        return true;
      });

      // Respawn centipede
      if (centipede.length === 0) {
        centipede = Array.from({ length: 10 }, (_, i) => ({
          x: i,
          y: 0,
          dir: 1,
          descending: false,
        }));
      }

      // Player collision
      for (const seg of centipede) {
        if (Math.abs(playerX - seg.x) < 1 && Math.abs(playerY - seg.y) < 1) {
          currentLives--;
          setLives(currentLives);
          playerX = 12;
          playerY = 23;
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          }
        }
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Mushrooms
      ctx.fillStyle = '#0a0';
      mushrooms.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
      });

      // Centipede
      centipede.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#f00' : '#f80';
        ctx.beginPath();
        ctx.arc(seg.x * CELL + CELL / 2, seg.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spider
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(spider.x * CELL + CELL / 2, spider.y * CELL + CELL / 2, CELL / 2, 0, Math.PI * 2);
      ctx.fill();

      // Bullets
      ctx.fillStyle = '#ff0';
      bullets.forEach(b => {
        ctx.fillRect(b.x * CELL + 8, b.y * CELL, 4, 10);
      });

      // Player
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(playerX * CELL + CELL / 2, playerY * CELL);
      ctx.lineTo(playerX * CELL, playerY * CELL + CELL);
      ctx.lineTo(playerX * CELL + CELL, playerY * CELL + CELL);
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
          <span className="text-red-400">Lives: {lives}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border border-gray-600" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🐛 Centipede</h2>
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

        <div className="text-gray-400 text-sm">Arrow keys to move • Space to shoot</div>
      </div>
    </GameWrapper>
  );
}
