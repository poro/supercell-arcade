'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { drawSprite, DIGDUG_PLAYER, DIGDUG_POOKA, DIGDUG_POOKA_INFLATED, DIGDUG_FYGAR } from '@/lib/sprites';

const game = getGameById('dig-dug')!;

const tutorial = {
  overview: 'The 1982 Namco classic! You are Dig Dug, an underground exterminator. Tunnel through the dirt and defeat Pookas (round orange monsters) and Fygars (green fire-breathing dragons) by inflating them with your pump until they pop!',
  howToPlay: [
    'Use ARROW KEYS or WASD to dig through the dirt',
    'Press SPACE to pump air into nearby enemies',
    'Hold SPACE to keep pumping until enemies pop (4 pumps)',
    'Enemies deflate if you stop pumping too early',
    'You can also drop rocks on enemies for bonus points',
    'Clear all enemies to advance to the next round',
  ],
  winCondition: 'Eliminate all enemies on each level. Score as many points as possible!',
  promptFlow: ['Grid-based terrain destruction', 'Enemy pathfinding through tunnels', 'Inflate mechanic with pump timing', 'Rock physics and crushing'],
  codeHighlights: [
    'Destructible terrain using 2D grid',
    'Enemy AI that follows player through dug tunnels',
    'Multi-stage inflation mechanic',
    'Sprite-based rendering with classic pixel art',
    'Collision detection for pump attack range',
  ],
  techStack: ['Canvas 2D', 'Grid System', 'Sprite Rendering', 'Game State Machine'],
};

export default function DigDugGame() {
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

    const CELL = 16;
    const COLS = 28;
    const ROWS = 24;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    // Create dirt grid - top rows are sky
    const dirt: boolean[][] = Array(ROWS).fill(null).map((_, y) => 
      Array(COLS).fill(y > 3)
    );

    // Pre-dig some tunnels for variety
    for (let x = 12; x < 16; x++) dirt[4][x] = false;
    for (let y = 4; y < 8; y++) dirt[y][14] = false;

    let player = { x: 14, y: 4, dir: { x: 1, y: 0 }, moving: false };
    let enemies: { x: number; y: number; type: 'pooka' | 'fygar'; inflating: number; deflateTimer: number; dir: { x: number; y: number } }[] = [
      { x: 5, y: 10, type: 'pooka', inflating: 0, deflateTimer: 0, dir: { x: 1, y: 0 } },
      { x: 22, y: 8, type: 'pooka', inflating: 0, deflateTimer: 0, dir: { x: -1, y: 0 } },
      { x: 8, y: 16, type: 'fygar', inflating: 0, deflateTimer: 0, dir: { x: 1, y: 0 } },
      { x: 20, y: 18, type: 'pooka', inflating: 0, deflateTimer: 0, dir: { x: -1, y: 0 } },
    ];
    
    let rocks: { x: number; y: number; falling: boolean; vy: number }[] = [
      { x: 6, y: 6, falling: false, vy: 0 },
      { x: 20, y: 12, falling: false, vy: 0 },
    ];

    let currentScore = 0;
    let currentLives = 3;
    let currentLevel = 1;
    let pumping = false;
    let pumpExtend = 0;

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true;
      if (e.key === ' ') {
        pumping = true;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      keys[e.key] = false;
      if (e.key === ' ') {
        pumping = false;
        pumpExtend = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let frame = 0;
    let animationId: number;

    function loop() {
      if (!ctx) return;
      frame++;

      // Player movement (every 4 frames for smooth but controlled movement)
      if (frame % 4 === 0) {
        let dx = 0, dy = 0;
        if (keys['ArrowLeft'] || keys['a']) { dx = -1; player.dir = { x: -1, y: 0 }; }
        else if (keys['ArrowRight'] || keys['d']) { dx = 1; player.dir = { x: 1, y: 0 }; }
        else if (keys['ArrowUp'] || keys['w']) { dy = -1; player.dir = { x: 0, y: -1 }; }
        else if (keys['ArrowDown'] || keys['s']) { dy = 1; player.dir = { x: 0, y: 1 }; }

        const newX = player.x + dx;
        const newY = player.y + dy;
        
        if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
          player.x = newX;
          player.y = newY;
          player.moving = dx !== 0 || dy !== 0;
          
          if (newY > 3 && dirt[newY]?.[newX]) {
            dirt[newY][newX] = false;
            currentScore += 10;
            setScore(currentScore);
          }
        }
      }

      // Pump attack
      if (pumping) {
        pumpExtend = Math.min(pumpExtend + 0.3, 3);
        
        // Check for enemies in pump range
        for (let i = 1; i <= 3; i++) {
          const ax = Math.round(player.x + player.dir.x * i);
          const ay = Math.round(player.y + player.dir.y * i);
          
          enemies.forEach(enemy => {
            const ex = Math.round(enemy.x);
            const ey = Math.round(enemy.y);
            if (ex === ax && ey === ay && pumpExtend >= i) {
              enemy.inflating++;
              enemy.deflateTimer = 0;
            }
          });
        }
      }

      // Enemy logic
      enemies.forEach(enemy => {
        // Deflation
        if (enemy.inflating > 0 && !pumping) {
          enemy.deflateTimer++;
          if (enemy.deflateTimer > 30) {
            enemy.inflating = Math.max(0, enemy.inflating - 1);
            enemy.deflateTimer = 0;
          }
        }
        
        // Pop!
        if (enemy.inflating >= 16) {
          currentScore += enemy.type === 'fygar' ? 400 : 200;
          setScore(currentScore);
          enemy.x = -100;
        }

        // Movement (only if not inflating)
        if (enemy.inflating === 0 && frame % 12 === 0) {
          const ex = Math.round(enemy.x);
          const ey = Math.round(enemy.y);
          
          // Simple AI: move toward player through tunnels
          const dx = Math.sign(player.x - ex);
          const dy = Math.sign(player.y - ey);
          
          // Try horizontal first
          if (dx !== 0 && !dirt[ey]?.[ex + dx]) {
            enemy.x += dx * 0.5;
            enemy.dir = { x: dx, y: 0 };
          } else if (dy !== 0 && !dirt[ey + dy]?.[ex]) {
            enemy.y += dy * 0.5;
            enemy.dir = { x: 0, y: dy };
          } else if (Math.random() < 0.1) {
            // Random dig through dirt
            if (!dirt[ey]?.[ex + enemy.dir.x]) {
              enemy.x += enemy.dir.x * 0.5;
            }
          }
        }
      });

      // Rock physics
      rocks.forEach(rock => {
        const rx = Math.round(rock.x);
        const ry = Math.round(rock.y);
        
        // Check if should fall (no dirt below and tunnel exists)
        if (!rock.falling && !dirt[ry + 1]?.[rx]) {
          rock.falling = true;
          rock.vy = 0;
        }
        
        if (rock.falling) {
          rock.vy += 0.15;
          rock.y += rock.vy;
          
          const newRy = Math.round(rock.y);
          
          // Hit ground or dirt
          if (newRy >= ROWS - 1 || dirt[newRy + 1]?.[rx]) {
            rock.falling = false;
            rock.vy = 0;
            rock.y = newRy;
          }
          
          // Crush enemies
          enemies.forEach(enemy => {
            const ex = Math.round(enemy.x);
            const ey = Math.round(enemy.y);
            if (Math.abs(ex - rx) < 1 && Math.abs(ey - rock.y) < 1.5 && rock.vy > 0.5) {
              currentScore += 1000;
              setScore(currentScore);
              enemy.x = -100;
            }
          });
          
          // Crush player
          const px = Math.round(player.x);
          const py = Math.round(player.y);
          if (Math.abs(px - rx) < 1 && Math.abs(py - rock.y) < 1.5 && rock.vy > 0.5) {
            currentLives--;
            setLives(currentLives);
            player = { x: 14, y: 4, dir: { x: 1, y: 0 }, moving: false };
            if (currentLives <= 0) setGameOver(true);
          }
        }
      });

      // Player-enemy collision
      enemies.forEach(enemy => {
        if (enemy.inflating === 0) {
          const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
          if (dist < 0.8) {
            currentLives--;
            setLives(currentLives);
            player = { x: 14, y: 4, dir: { x: 1, y: 0 }, moving: false };
            if (currentLives <= 0) setGameOver(true);
          }
        }
      });

      // Remove dead enemies and check win
      enemies = enemies.filter(e => e.x >= 0);
      if (enemies.length === 0) {
        currentLevel++;
        setLevel(currentLevel);
        // Spawn new enemies
        enemies = [
          { x: 5, y: 10, type: 'pooka', inflating: 0, deflateTimer: 0, dir: { x: 1, y: 0 } },
          { x: 22, y: 8, type: Math.random() > 0.5 ? 'fygar' : 'pooka', inflating: 0, deflateTimer: 0, dir: { x: -1, y: 0 } },
          { x: 8, y: 16, type: 'fygar', inflating: 0, deflateTimer: 0, dir: { x: 1, y: 0 } },
          { x: 20, y: 18, type: 'pooka', inflating: 0, deflateTimer: 0, dir: { x: -1, y: 0 } },
        ];
      }

      // === DRAW ===
      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 4 * CELL);
      gradient.addColorStop(0, '#4af');
      gradient.addColorStop(1, '#28f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, COLS * CELL, 4 * CELL);

      // Ground layers with different colors
      const layerColors = ['#da4', '#c84', '#a62', '#842'];
      for (let y = 4; y < ROWS; y++) {
        const layerIndex = Math.min(3, Math.floor((y - 4) / 5));
        for (let x = 0; x < COLS; x++) {
          if (dirt[y][x]) {
            ctx.fillStyle = layerColors[layerIndex];
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
            
            // Add texture
            ctx.fillStyle = layerColors[Math.min(3, layerIndex + 1)];
            if ((x + y) % 3 === 0) {
              ctx.fillRect(x * CELL + 4, y * CELL + 4, 4, 4);
            }
          } else {
            // Tunnel background
            ctx.fillStyle = '#000';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }

      // Tunnel borders
      ctx.strokeStyle = '#630';
      ctx.lineWidth = 2;
      for (let y = 4; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!dirt[y][x]) {
            // Draw borders where tunnel meets dirt
            if (dirt[y - 1]?.[x]) {
              ctx.beginPath();
              ctx.moveTo(x * CELL, y * CELL);
              ctx.lineTo((x + 1) * CELL, y * CELL);
              ctx.stroke();
            }
            if (dirt[y + 1]?.[x]) {
              ctx.beginPath();
              ctx.moveTo(x * CELL, (y + 1) * CELL);
              ctx.lineTo((x + 1) * CELL, (y + 1) * CELL);
              ctx.stroke();
            }
          }
        }
      }

      // Rocks
      rocks.forEach(rock => {
        const rx = rock.x * CELL;
        const ry = rock.y * CELL;
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(rx + CELL / 2, ry + CELL / 2, CELL * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(rx + CELL / 2 - 3, ry + CELL / 2 - 3, CELL * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Enemies with sprites
      enemies.forEach(enemy => {
        const ex = enemy.x * CELL - 4;
        const ey = enemy.y * CELL - 4;
        const flip = enemy.dir.x < 0;
        
        if (enemy.type === 'pooka') {
          if (enemy.inflating > 0) {
            const scale = 2 + enemy.inflating * 0.15;
            drawSprite(ctx, DIGDUG_POOKA_INFLATED, ex - (scale - 2) * 4, ey - (scale - 2) * 4, scale, flip);
          } else {
            drawSprite(ctx, DIGDUG_POOKA, ex, ey, 2, flip);
          }
        } else {
          if (enemy.inflating > 0) {
            const scale = 2 + enemy.inflating * 0.15;
            drawSprite(ctx, DIGDUG_POOKA_INFLATED, ex - (scale - 2) * 4, ey - (scale - 2) * 4, scale, flip);
          } else {
            drawSprite(ctx, DIGDUG_FYGAR, ex, ey, 2, flip);
          }
        }
      });

      // Player with sprite
      const px = player.x * CELL - 4;
      const py = player.y * CELL - 6;
      const playerFlip = player.dir.x < 0;
      drawSprite(ctx, DIGDUG_PLAYER, px, py, 2, playerFlip);

      // Pump hose
      if (pumping && pumpExtend > 0) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x * CELL + CELL / 2, player.y * CELL + CELL / 2);
        ctx.lineTo(
          player.x * CELL + CELL / 2 + player.dir.x * pumpExtend * CELL,
          player.y * CELL + CELL / 2 + player.dir.y * pumpExtend * CELL
        );
        ctx.stroke();
        
        // Pump head
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(
          player.x * CELL + CELL / 2 + player.dir.x * pumpExtend * CELL,
          player.y * CELL + CELL / 2 + player.dir.y * pumpExtend * CELL,
          4, 0, Math.PI * 2
        );
        ctx.fill();
      }

      // Flowers on top
      for (let x = 2; x < COLS; x += 5) {
        ctx.fillStyle = '#0a0';
        ctx.fillRect(x * CELL + 4, 3.5 * CELL, 4, 8);
        ctx.fillStyle = ['#f00', '#ff0', '#f0f', '#0ff'][x % 4];
        ctx.beginPath();
        ctx.arc(x * CELL + 6, 3.3 * CELL, 5, 0, Math.PI * 2);
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
          <span className="text-cyan-400">ROUND: {level}</span>
          <span className="text-red-400">LIVES: {'⛏️'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-amber-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">⛏️🐡🐉</div>
              <h2 className="text-4xl font-bold mb-2 text-yellow-400">DIG DUG</h2>
              <p className="text-gray-400 mb-6">Inflate enemies until they pop!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                START
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
              <p className="text-2xl text-yellow-400 mb-4">Final Score: {score}</p>
              <p className="text-lg text-gray-400 mb-6">Round Reached: {level}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️⬆️⬇️➡️ Dig</span>
          <span>SPACE Hold to pump!</span>
          <span>💨 Pop enemies!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
