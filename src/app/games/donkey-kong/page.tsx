'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('donkey-kong')!;

const tutorial = {
  overview: 'Climb the platforms and dodge rolling barrels to rescue the princess! Jump over barrels for points.',
  promptFlow: ['Platform layout with ladders', 'Barrel spawning and rolling physics', 'Jump mechanics', 'Reach the top to win'],
  codeHighlights: ['Platform collision detection', 'Gravity and jumping', 'Barrel AI following platforms'],
};

export default function DonkeyKongGame() {
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

    canvas.width = 500;
    canvas.height = 500;

    const platforms = [
      { x: 0, y: 480, w: 500, h: 20 },
      { x: 50, y: 400, w: 400, h: 15 },
      { x: 50, y: 320, w: 400, h: 15 },
      { x: 50, y: 240, w: 400, h: 15 },
      { x: 50, y: 160, w: 400, h: 15 },
      { x: 100, y: 80, w: 300, h: 15 },
    ];

    const ladders = [
      { x: 420, y: 400, h: 80 },
      { x: 80, y: 320, h: 80 },
      { x: 400, y: 240, h: 80 },
      { x: 100, y: 160, h: 80 },
      { x: 350, y: 80, h: 80 },
    ];

    let player = { x: 50, y: 455, vy: 0, onGround: true, onLadder: false };
    let barrels: { x: number; y: number; vx: number; vy: number }[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let barrelTimer = 0;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop() {
      if (!ctx) return;

      // Player movement
      if (keys['ArrowLeft']) player.x -= 3;
      if (keys['ArrowRight']) player.x += 3;
      
      // Ladder climbing
      const onLadder = ladders.some(l => 
        player.x > l.x - 10 && player.x < l.x + 30 && 
        player.y > l.y - l.h && player.y < l.y + 20
      );
      
      if (onLadder && (keys['ArrowUp'] || keys['ArrowDown'])) {
        player.onLadder = true;
        player.vy = 0;
        if (keys['ArrowUp']) player.y -= 3;
        if (keys['ArrowDown']) player.y += 3;
      } else {
        player.onLadder = false;
      }

      // Jumping
      if (keys[' '] && player.onGround && !player.onLadder) {
        player.vy = -12;
        player.onGround = false;
      }

      // Gravity
      if (!player.onLadder) {
        player.vy += 0.5;
        player.y += player.vy;
      }

      // Platform collision
      player.onGround = false;
      for (const p of platforms) {
        if (player.y >= p.y - 25 && player.y <= p.y && 
            player.x > p.x - 20 && player.x < p.x + p.w) {
          player.y = p.y - 25;
          player.vy = 0;
          player.onGround = true;
        }
      }

      player.x = Math.max(20, Math.min(480, player.x));

      // Win condition
      if (player.y < 80) {
        setWon(true);
        setGameOver(true);
        return;
      }

      // Spawn barrels
      barrelTimer++;
      if (barrelTimer > 120) {
        barrelTimer = 0;
        barrels.push({ x: 120, y: 60, vx: 2, vy: 0 });
      }

      // Update barrels
      barrels = barrels.filter(b => {
        b.vy += 0.3;
        b.x += b.vx;
        b.y += b.vy;

        // Platform collision for barrels
        for (const p of platforms) {
          if (b.y >= p.y - 15 && b.y <= p.y + 5 && b.x > p.x && b.x < p.x + p.w) {
            b.y = p.y - 15;
            b.vy = 0;
            // Reverse at edges
            if (b.x <= p.x + 20 || b.x >= p.x + p.w - 20) {
              b.vx *= -1;
            }
          }
        }

        // Player collision
        if (Math.hypot(b.x - player.x, b.y - player.y) < 25) {
          if (player.vy < 0) {
            currentScore += 100;
            setScore(currentScore);
            return false;
          } else {
            currentLives--;
            setLives(currentLives);
            player = { x: 50, y: 455, vy: 0, onGround: true, onLadder: false };
            if (currentLives <= 0) {
              setGameOver(true);
            }
            return false;
          }
        }

        return b.y < 520;
      });

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 500, 500);

      // Platforms
      ctx.fillStyle = '#c44';
      platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

      // Ladders
      ctx.fillStyle = '#88f';
      ladders.forEach(l => ctx.fillRect(l.x, l.y - l.h, 20, l.h));

      // Princess
      ctx.fillStyle = '#f0f';
      ctx.fillRect(240, 40, 20, 30);

      // Kong
      ctx.fillStyle = '#840';
      ctx.fillRect(100, 45, 40, 35);

      // Barrels
      ctx.fillStyle = '#a52';
      barrels.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // Player
      ctx.fillStyle = '#f00';
      ctx.fillRect(player.x - 10, player.y - 25, 20, 25);

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
              <h2 className="text-3xl font-bold mb-4">🦍 Barrel Jumper</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-red-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{won ? '🎉 You Win!' : 'Game Over!'}</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-red-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to move • Space to jump • Up/Down on ladders</div>
      </div>
    </GameWrapper>
  );
}
