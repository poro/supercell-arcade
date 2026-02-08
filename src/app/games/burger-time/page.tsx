'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('burger-time')!;

const tutorial = {
  overview: 'Walk over burger ingredients to drop them down! Complete burgers while avoiding enemies.',
  promptFlow: ['Platform movement', 'Ingredient dropping', 'Enemy avoidance', 'Level completion'],
  codeHighlights: ['Ingredient state tracking', 'Multi-level dropping', 'Enemy AI'],
};

export default function BurgerTimeGame() {
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

    canvas.width = 400;
    canvas.height = 400;

    const platforms = [
      { x: 0, y: 380, w: 400, h: 20 },
      { x: 50, y: 300, w: 120, h: 10 },
      { x: 230, y: 300, w: 120, h: 10 },
      { x: 50, y: 220, w: 120, h: 10 },
      { x: 230, y: 220, w: 120, h: 10 },
      { x: 50, y: 140, w: 120, h: 10 },
      { x: 230, y: 140, w: 120, h: 10 },
      { x: 140, y: 60, w: 120, h: 10 },
    ];

    const ladders = [
      { x: 100, y: 300, h: 80 },
      { x: 300, y: 300, h: 80 },
      { x: 100, y: 220, h: 80 },
      { x: 300, y: 220, h: 80 },
      { x: 100, y: 140, h: 80 },
      { x: 300, y: 140, h: 80 },
      { x: 200, y: 60, h: 80 },
    ];

    interface Ingredient { x: number; y: number; targetY: number; walked: number; }
    const ingredients: Ingredient[] = [
      { x: 60, y: 130, targetY: 370, walked: 0 },
      { x: 240, y: 130, targetY: 370, walked: 0 },
      { x: 150, y: 50, targetY: 370, walked: 0 },
    ];

    let player = { x: 200, y: 350, onLadder: false };
    let enemies = [{ x: 80, y: 270 }, { x: 320, y: 190 }];
    let currentScore = 0;
    let currentLives = 3;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop() {
      if (!ctx) return;

      // Player on ladder check
      const onLadder = ladders.some(l => 
        Math.abs(player.x - l.x) < 15 && player.y >= l.y - l.h && player.y <= l.y + 10
      );

      // Player movement
      if (onLadder && keys['ArrowUp']) player.y -= 2;
      if (onLadder && keys['ArrowDown']) player.y += 2;
      if (keys['ArrowLeft']) player.x -= 2;
      if (keys['ArrowRight']) player.x += 2;

      // Keep on platforms
      if (!onLadder) {
        const onPlatform = platforms.find(p => 
          player.y >= p.y - 20 && player.y <= p.y && player.x >= p.x && player.x <= p.x + p.w
        );
        if (onPlatform) player.y = onPlatform.y - 15;
      }

      player.x = Math.max(10, Math.min(390, player.x));
      player.y = Math.max(30, Math.min(365, player.y));

      // Walk on ingredients
      ingredients.forEach(ing => {
        if (Math.abs(player.x - ing.x - 50) < 60 && Math.abs(player.y - ing.y + 10) < 20) {
          ing.walked = Math.min(100, ing.walked + 2);
          if (ing.walked >= 100 && ing.y < ing.targetY) {
            ing.y += 80;
            ing.walked = 0;
            currentScore += 100;
            setScore(currentScore);
          }
        }
      });

      // Enemy movement
      enemies.forEach(enemy => {
        if (Math.random() < 0.02) {
          enemy.x += (Math.random() - 0.5) * 40;
        }
        enemy.x = Math.max(50, Math.min(350, enemy.x));
      });

      // Enemy collision
      enemies.forEach(enemy => {
        if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 20) {
          currentLives--;
          setLives(currentLives);
          player = { x: 200, y: 350, onLadder: false };
          if (currentLives <= 0) setGameOver(true);
        }
      });

      // Win check
      if (ingredients.every(i => i.y >= i.targetY)) {
        setWon(true);
        setGameOver(true);
        return;
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 400, 400);

      // Platforms
      ctx.fillStyle = '#840';
      platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

      // Ladders
      ctx.fillStyle = '#0af';
      ladders.forEach(l => {
        ctx.fillRect(l.x - 5, l.y - l.h, 3, l.h);
        ctx.fillRect(l.x + 15, l.y - l.h, 3, l.h);
      });

      // Ingredients
      ingredients.forEach(ing => {
        ctx.fillStyle = '#fa0';
        ctx.fillRect(ing.x, ing.y, 100, 15);
        // Walk progress
        ctx.fillStyle = '#0f0';
        ctx.fillRect(ing.x, ing.y - 5, ing.walked, 3);
      });

      // Enemies
      ctx.fillStyle = '#f00';
      enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
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
              <h2 className="text-3xl font-bold mb-4">🍔 Burger Time</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-orange-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{won ? '🎉 Burgers Complete!' : 'Game Over!'}</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-orange-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to move • Walk over ingredients to drop them!</div>
      </div>
    </GameWrapper>
  );
}
