'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { drawSprite, GALAGA_PLAYER, GALAGA_ENEMY } from '@/lib/sprites';

const game = getGameById('galaga')!;

const tutorial = {
  overview: 'The 1981 Namco sequel to Galaxian! Blast waves of diving alien fighters. Watch out for enemies that swoop down to attack - they\'re much deadlier during their attack runs!',
  howToPlay: [
    'Use LEFT/RIGHT arrows or A/D to move your fighter',
    'Press SPACE to fire at enemies',
    'Destroy all enemies to advance to the next wave',
    'Watch for diving enemies - they\'re faster and more dangerous!',
    'Enemies in formation sway side to side',
  ],
  winCondition: 'Survive and destroy as many waves of aliens as possible!',
  promptFlow: ['Ship movement and shooting', 'Enemy formation with swaying motion', 'Diving attack patterns', 'Collision detection'],
  codeHighlights: [
    'Formation movement with synchronized swaying',
    'Individual enemy attack dive patterns',
    'Double-fire rate compared to Space Invaders',
    'Starfield parallax background',
  ],
  techStack: ['Canvas 2D', 'Sprite Rendering', 'Formation AI', 'Wave System'],
};

interface Enemy { 
  x: number; 
  y: number; 
  alive: boolean; 
  attacking: boolean; 
  attackX: number;
  attackY: number;
  attackAngle: number;
  type: number;
}

interface Bullet { 
  x: number; 
  y: number; 
  isPlayer: boolean; 
}

export default function GalagaGame() {
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

    canvas.width = 480;
    canvas.height = 600;

    let playerX = 240;
    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let currentWave = 1;
    let lastShot = 0;
    let formationX = 0;
    let formationDir = 1;
    let frame = 0;

    const spawnWave = () => {
      enemies = [];
      // Top row - boss type
      for (let col = 0; col < 4; col++) {
        enemies.push({
          x: 120 + col * 60,
          y: 60,
          alive: true,
          attacking: false,
          attackX: 0,
          attackY: 0,
          attackAngle: 0,
          type: 2,
        });
      }
      // Middle rows
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
          enemies.push({
            x: 60 + col * 45,
            y: 100 + row * 35,
            alive: true,
            attacking: false,
            attackX: 0,
            attackY: 0,
            attackAngle: 0,
            type: 1,
          });
        }
      }
      // Bottom rows
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 10; col++) {
          enemies.push({
            x: 40 + col * 40,
            y: 170 + row * 35,
            alive: true,
            attacking: false,
            attackX: 0,
            attackY: 0,
            attackAngle: 0,
            type: 0,
          });
        }
      }
    };
    spawnWave();

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationId: number;

    function loop() {
      if (!ctx) return;
      frame++;

      // Player movement
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        playerX = Math.max(25, playerX - 6);
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        playerX = Math.min(455, playerX + 6);
      }
      if (keys[' '] && Date.now() - lastShot > 150) {
        bullets.push({ x: playerX, y: 540, isPlayer: true });
        lastShot = Date.now();
      }

      // Formation movement
      formationX += formationDir * 0.8;
      if (Math.abs(formationX) > 40) formationDir *= -1;

      // Start enemy attacks
      if (frame % 60 === 0 && Math.random() < 0.4 + currentWave * 0.1) {
        const aliveEnemies = enemies.filter(e => e.alive && !e.attacking);
        if (aliveEnemies.length > 0) {
          const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          attacker.attacking = true;
          attacker.attackX = attacker.x + formationX;
          attacker.attackY = attacker.y;
          attacker.attackAngle = Math.random() * Math.PI * 2;
        }
      }

      // Update attacking enemies with swooping pattern
      enemies.forEach(e => {
        if (e.attacking && e.alive) {
          e.attackAngle += 0.05;
          e.attackX += Math.sin(e.attackAngle) * 3;
          e.attackY += 4;
          
          // Return to formation when off screen
          if (e.attackY > 620) {
            e.attacking = false;
            e.attackY = e.y;
            e.attackX = e.x;
          }
        }
      });

      // Enemy shooting
      if (frame % 30 === 0 && Math.random() < 0.3) {
        const shooters = enemies.filter(e => e.alive);
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          const sx = shooter.attacking ? shooter.attackX : shooter.x + formationX;
          const sy = shooter.attacking ? shooter.attackY : shooter.y;
          bullets.push({ x: sx, y: sy + 15, isPlayer: false });
        }
      }

      // Update bullets
      bullets = bullets.filter(b => {
        b.y += b.isPlayer ? -12 : 6;
        return b.y > 0 && b.y < 600;
      });

      // Bullet-enemy collision
      bullets = bullets.filter(b => {
        if (!b.isPlayer) return true;
        for (const e of enemies) {
          if (e.alive) {
            const ex = e.attacking ? e.attackX : e.x + formationX;
            const ey = e.attacking ? e.attackY : e.y;
            if (Math.abs(b.x - ex) < 18 && Math.abs(b.y - ey) < 14) {
              e.alive = false;
              currentScore += (e.type + 1) * 50 * (e.attacking ? 2 : 1);
              setScore(currentScore);
              return false;
            }
          }
        }
        return true;
      });

      // Enemy-player collision
      enemies.forEach(e => {
        if (e.alive && e.attacking) {
          if (Math.abs(e.attackX - playerX) < 25 && e.attackY > 520 && e.attackY < 570) {
            e.alive = false;
            currentLives--;
            setLives(currentLives);
            if (currentLives <= 0) {
              setGameOver(true);
            }
          }
        }
      });

      // Bullet-player collision
      bullets = bullets.filter(b => {
        if (b.isPlayer) return true;
        if (Math.abs(b.x - playerX) < 18 && b.y > 530 && b.y < 570) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) {
            setGameOver(true);
          }
          return false;
        }
        return true;
      });

      // Check wave clear
      if (enemies.every(e => !e.alive)) {
        currentWave++;
        setWave(currentWave);
        spawnWave();
      }

      // === DRAW ===
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 480, 600);

      // Scrolling starfield
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 80; i++) {
        const sx = (i * 37) % 480;
        const sy = (i * 71 + frame * (0.5 + (i % 3) * 0.3)) % 600;
        const size = (i % 3) === 0 ? 2 : 1;
        ctx.fillRect(sx, sy, size, size);
      }

      // Enemies with sprites
      enemies.forEach(e => {
        if (!e.alive) return;
        const x = e.attacking ? e.attackX : e.x + formationX;
        const y = e.attacking ? e.attackY : e.y;
        
        // Different colors for different types
        const colors = ['#0ff', '#ff0', '#f00'];
        ctx.fillStyle = colors[e.type];
        
        // Draw enemy sprite
        drawSprite(ctx, GALAGA_ENEMY, x - 14, y - 10, 4);
      });

      // Bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.isPlayer ? '#0ff' : '#f44';
        if (b.isPlayer) {
          ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
        } else {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Player with sprite
      drawSprite(ctx, GALAGA_PLAYER, playerX - 17, 535, 5);

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
          <span className="text-cyan-400">SCORE: {score.toString().padStart(6, '0')}</span>
          <span className="text-yellow-400">WAVE: {wave}</span>
          <span className="text-red-400">SHIPS: {'🚀'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-blue-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">🛸👾🚀</div>
              <h2 className="text-4xl font-bold mb-2 text-cyan-400">GALAGA</h2>
              <p className="text-gray-400 mb-6">Destroy the alien fleet!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                START
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
              <p className="text-2xl text-cyan-400 mb-4">Score: {score}</p>
              <p className="text-lg text-gray-400 mb-6">Wave Reached: {wave}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️➡️ Move</span>
          <span>SPACE Fire</span>
          <span>👾 Clear all waves!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
