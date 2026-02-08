'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('bomberman')!;

const tutorial = {
  overview: 'Place bombs to destroy walls and enemies! Clear the level to advance.',
  promptFlow: ['Grid movement', 'Bomb placement and explosion', 'Chain reactions', 'Power-ups'],
  codeHighlights: ['Explosion propagation', 'Destructible vs solid walls', 'Enemy AI'],
};

export default function BombermanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

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

    const CELL = 30;
    const COLS = 15;
    const ROWS = 13;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    // 0=empty, 1=solid, 2=destructible
    const map = Array(ROWS).fill(null).map((_, y) =>
      Array(COLS).fill(null).map((_, x) => {
        if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) return 1;
        if (y % 2 === 0 && x % 2 === 0) return 1;
        if ((x <= 2 && y <= 2) || (x >= COLS - 3 && y >= ROWS - 3)) return 0;
        return Math.random() < 0.7 ? 2 : 0;
      })
    );

    let player = { x: 1, y: 1 };
    let enemies = [{ x: COLS - 2, y: ROWS - 2 }, { x: COLS - 2, y: 1 }];
    let bombs: { x: number; y: number; timer: number }[] = [];
    let explosions: { x: number; y: number; timer: number }[] = [];
    let currentScore = 0;
    let currentLives = 3;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;

    function loop() {
      if (!ctx) return;
      frame++;

      // Player movement
      if (frame % 10 === 0) {
        let nx = player.x, ny = player.y;
        if (keys['ArrowLeft'] || keys['a']) nx--;
        if (keys['ArrowRight'] || keys['d']) nx++;
        if (keys['ArrowUp'] || keys['w']) ny--;
        if (keys['ArrowDown'] || keys['s']) ny++;
        if (map[ny]?.[nx] === 0 && !bombs.some(b => b.x === nx && b.y === ny)) {
          player = { x: nx, y: ny };
        }
      }

      // Place bomb
      if (keys[' '] && !bombs.some(b => b.x === player.x && b.y === player.y)) {
        bombs.push({ x: player.x, y: player.y, timer: 180 });
        keys[' '] = false;
      }

      // Update bombs
      bombs = bombs.filter(bomb => {
        bomb.timer--;
        if (bomb.timer <= 0) {
          // Explode in 4 directions
          [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(([dx, dy]) => {
            const ex = bomb.x + dx;
            const ey = bomb.y + dy;
            if (map[ey]?.[ex] !== 1) {
              explosions.push({ x: ex, y: ey, timer: 30 });
              if (map[ey]?.[ex] === 2) {
                map[ey][ex] = 0;
                currentScore += 10;
                setScore(currentScore);
              }
            }
          });
          return false;
        }
        return true;
      });

      // Update explosions
      explosions = explosions.filter(e => {
        e.timer--;
        // Kill enemies
        enemies = enemies.filter(enemy => {
          if (enemy.x === e.x && enemy.y === e.y) {
            currentScore += 100;
            setScore(currentScore);
            return false;
          }
          return true;
        });
        // Kill player
        if (player.x === e.x && player.y === e.y) {
          currentLives--;
          setLives(currentLives);
          player = { x: 1, y: 1 };
          if (currentLives <= 0) setGameOver(true);
        }
        return e.timer > 0;
      });

      // Move enemies
      if (frame % 30 === 0) {
        enemies.forEach(enemy => {
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => 
            map[enemy.y + dy]?.[enemy.x + dx] === 0
          );
          if (dirs.length > 0) {
            const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
            enemy.x += dx;
            enemy.y += dy;
          }
        });
      }

      // Enemy collision
      enemies.forEach(enemy => {
        if (enemy.x === player.x && enemy.y === player.y) {
          currentLives--;
          setLives(currentLives);
          player = { x: 1, y: 1 };
          if (currentLives <= 0) setGameOver(true);
        }
      });

      // Win check
      if (enemies.length === 0) {
        setWon(true);
        setGameOver(true);
        return;
      }

      // Draw
      ctx.fillStyle = '#1a1';
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Map
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (map[y][x] === 1) {
            ctx.fillStyle = '#444';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          } else if (map[y][x] === 2) {
            ctx.fillStyle = '#a52';
            ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
          }
        }
      }

      // Bombs
      ctx.fillStyle = '#000';
      bombs.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x * CELL + CELL / 2, b.y * CELL + CELL / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Explosions
      ctx.fillStyle = '#f80';
      explosions.forEach(e => {
        ctx.fillRect(e.x * CELL + 2, e.y * CELL + 2, CELL - 4, CELL - 4);
      });

      // Enemies
      ctx.fillStyle = '#f00';
      enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x * CELL + CELL / 2, e.y * CELL + CELL / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(player.x * CELL + CELL / 2, player.y * CELL + CELL / 2, 10, 0, Math.PI * 2);
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
          <span className="text-red-400">Lives: {lives}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">💣 Bomberman</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-orange-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{won ? '🎉 You Win!' : 'Game Over!'}</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-orange-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">WASD to move • Space to place bomb</div>
      </div>
    </GameWrapper>
  );
}
