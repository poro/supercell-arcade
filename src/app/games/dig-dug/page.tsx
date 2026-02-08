'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('dig-dug')!;

const tutorial = {
  overview: 'Dig through dirt and defeat enemies by inflating them or dropping rocks on them!',
  promptFlow: ['Grid-based digging', 'Enemy AI', 'Inflate mechanic', 'Rock dropping'],
  codeHighlights: ['Terrain destruction', 'Enemy pathfinding', 'Physics for falling rocks'],
};

export default function DigDugGame() {
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
    const COLS = 20;
    const ROWS = 20;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    const dirt = Array(ROWS).fill(null).map((_, y) => 
      Array(COLS).fill(y > 2)
    );

    let player = { x: 10, y: 1 };
    let enemies = [
      { x: 5, y: 10, inflating: 0 },
      { x: 15, y: 15, inflating: 0 },
    ];
    let currentScore = 0;
    let currentLives = 3;
    let attacking = false;
    let attackDir = { x: 1, y: 0 };

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true;
      if (e.key === ' ') attacking = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      keys[e.key] = false;
      if (e.key === ' ') attacking = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;

    function loop() {
      if (!ctx) return;
      frame++;

      // Player movement
      if (frame % 8 === 0) {
        let dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a']) { dx = -1; attackDir = { x: -1, y: 0 }; }
        if (keys['ArrowRight'] || keys['d']) { dx = 1; attackDir = { x: 1, y: 0 }; }
        if (keys['ArrowUp'] || keys['w']) { dy = -1; attackDir = { x: 0, y: -1 }; }
        if (keys['ArrowDown'] || keys['s']) { dy = 1; attackDir = { x: 0, y: 1 }; }

        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
          player.x = newX;
          player.y = newY;
          if (dirt[newY][newX]) {
            dirt[newY][newX] = false;
            currentScore += 10;
            setScore(currentScore);
          }
        }
      }

      // Enemy movement and inflation
      if (frame % 20 === 0) {
        enemies.forEach(enemy => {
          if (enemy.inflating > 0) {
            enemy.inflating++;
            if (enemy.inflating > 4) {
              currentScore += 200;
              setScore(currentScore);
              enemy.x = -100;
            }
          } else {
            // Move toward player through dug tunnels
            const dx = Math.sign(player.x - enemy.x);
            const dy = Math.sign(player.y - enemy.y);
            
            if (!dirt[enemy.y][enemy.x + dx]) enemy.x += dx;
            else if (!dirt[enemy.y + dy]?.[enemy.x]) enemy.y += dy;
          }
        });
      }

      // Attack
      if (attacking) {
        for (let i = 1; i <= 3; i++) {
          const ax = player.x + attackDir.x * i;
          const ay = player.y + attackDir.y * i;
          enemies.forEach(enemy => {
            if (enemy.x === ax && enemy.y === ay && enemy.inflating === 0) {
              enemy.inflating = 1;
            }
          });
        }
      }

      // Player-enemy collision
      enemies.forEach(enemy => {
        if (enemy.inflating === 0 && enemy.x === player.x && enemy.y === player.y) {
          currentLives--;
          setLives(currentLives);
          player = { x: 10, y: 1 };
          if (currentLives <= 0) setGameOver(true);
        }
      });

      // Remove dead enemies and check win
      enemies = enemies.filter(e => e.x >= 0);
      if (enemies.length === 0) {
        enemies = [
          { x: 5, y: 10 + Math.floor(currentScore / 500), inflating: 0 },
          { x: 15, y: 15, inflating: 0 },
        ];
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      // Dirt
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (dirt[y][x]) {
            ctx.fillStyle = '#840';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }

      // Enemies
      enemies.forEach(enemy => {
        const size = CELL - 4 + enemy.inflating * 3;
        ctx.fillStyle = enemy.inflating > 0 ? '#f88' : '#f00';
        ctx.beginPath();
        ctx.arc(enemy.x * CELL + CELL / 2, enemy.y * CELL + CELL / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#00f';
      ctx.beginPath();
      ctx.arc(player.x * CELL + CELL / 2, player.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Attack line
      if (attacking) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x * CELL + CELL / 2, player.y * CELL + CELL / 2);
        ctx.lineTo((player.x + attackDir.x * 3) * CELL + CELL / 2, (player.y + attackDir.y * 3) * CELL + CELL / 2);
        ctx.stroke();
      }

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
              <h2 className="text-3xl font-bold mb-4">⛏️ Dig Dug</h2>
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

        <div className="text-gray-400 text-sm">Arrow keys to dig • Space to inflate enemies</div>
      </div>
    </GameWrapper>
  );
}
