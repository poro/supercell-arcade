'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('tempest')!;

const tutorial = {
  overview: 'Shoot down enemies climbing up a 3D tube! Move around the rim and blast them.',
  promptFlow: ['Tube perspective rendering', 'Enemy climbing', 'Rapid fire shooting', 'Level progression'],
  codeHighlights: ['Pseudo-3D tube effect', 'Segment-based movement', 'Enemy wave patterns'],
};

export default function TempestGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;

    const SEGMENTS = 16;
    let playerSegment = 0;
    let bullets: { segment: number; depth: number }[] = [];
    let enemies: { segment: number; depth: number }[] = [];
    let currentScore = 0;
    let currentLevel = 1;

    // Spawn enemies
    for (let i = 0; i < 5 + currentLevel; i++) {
      enemies.push({ segment: Math.floor(Math.random() * SEGMENTS), depth: 0.1 + Math.random() * 0.3 });
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastShot = 0;

    function getSegmentPos(segment: number, depth: number) {
      const angle = (segment / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
      const radius = 50 + depth * 150;
      return {
        x: 200 + Math.cos(angle) * radius,
        y: 200 + Math.sin(angle) * radius,
      };
    }

    function loop() {
      if (!ctx) return;

      // Controls
      if (keys['ArrowLeft']) playerSegment = (playerSegment - 1 + SEGMENTS) % SEGMENTS;
      if (keys['ArrowRight']) playerSegment = (playerSegment + 1) % SEGMENTS;
      if (keys[' '] && Date.now() - lastShot > 100) {
        bullets.push({ segment: playerSegment, depth: 1 });
        lastShot = Date.now();
      }

      // Update bullets
      bullets = bullets.filter(b => {
        b.depth -= 0.05;
        return b.depth > 0;
      });

      // Update enemies
      enemies.forEach(e => {
        e.depth += 0.005 * currentLevel;
      });

      // Bullet-enemy collision
      bullets = bullets.filter(bullet => {
        for (let i = enemies.length - 1; i >= 0; i--) {
          if (enemies[i].segment === bullet.segment && Math.abs(enemies[i].depth - bullet.depth) < 0.1) {
            enemies.splice(i, 1);
            currentScore += 100;
            setScore(currentScore);
            return false;
          }
        }
        return true;
      });

      // Enemy reaches rim
      enemies = enemies.filter(e => {
        if (e.depth >= 1) {
          if (e.segment === playerSegment) {
            setGameOver(true);
          }
          return false;
        }
        return true;
      });

      // Next level
      if (enemies.length === 0) {
        currentLevel++;
        setLevel(currentLevel);
        for (let i = 0; i < 5 + currentLevel; i++) {
          enemies.push({ segment: Math.floor(Math.random() * SEGMENTS), depth: 0.1 + Math.random() * 0.3 });
        }
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 400, 400);

      // Tube segments
      for (let i = 0; i < SEGMENTS; i++) {
        const inner = getSegmentPos(i, 0);
        const outer = getSegmentPos(i, 1);
        const nextInner = getSegmentPos((i + 1) % SEGMENTS, 0);
        const nextOuter = getSegmentPos((i + 1) % SEGMENTS, 1);

        ctx.strokeStyle = i === playerSegment ? '#ff0' : '#00f';
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(outer.x, outer.y);
        ctx.lineTo(nextOuter.x, nextOuter.y);
        ctx.stroke();
      }

      // Enemies
      ctx.fillStyle = '#f00';
      enemies.forEach(e => {
        const pos = getSegmentPos(e.segment, e.depth);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bullets
      ctx.fillStyle = '#0ff';
      bullets.forEach(b => {
        const pos = getSegmentPos(b.segment, b.depth);
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
      });

      // Player
      const playerPos = getSegmentPos(playerSegment, 1);
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
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
          <span className="text-blue-400">Level: {level}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🌀 Tempest</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-blue-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-blue-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">← → to move around tube • Space to shoot</div>
      </div>
    </GameWrapper>
  );
}
