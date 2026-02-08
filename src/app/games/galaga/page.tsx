'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('galaga')!;

const tutorial = {
  overview: 'Classic space shooter! Destroy waves of attacking aliens with your ship.',
  promptFlow: ['Ship movement and shooting', 'Enemy wave patterns', 'Collision detection'],
  codeHighlights: ['Wave formation', 'Enemy attack patterns', 'Power-up system'],
};

interface Enemy { x: number; y: number; alive: boolean; attacking: boolean; attackY: number; }
interface Bullet { x: number; y: number; isPlayer: boolean; }

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

    canvas!.width = 500;
    canvas!.height = 600;

    let playerX = 250;
    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let currentWave = 1;
    let lastShot = 0;
    let formationX = 0;
    let formationDir = 1;

    const spawnWave = () => {
      enemies = [];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
          enemies.push({
            x: 60 + col * 50,
            y: 60 + row * 40,
            alive: true,
            attacking: false,
            attackY: 0,
          });
        }
      }
    };
    spawnWave();

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function loop() {
      if (!ctx) return;

      // Player movement
      if (keys['ArrowLeft'] && playerX > 20) playerX -= 5;
      if (keys['ArrowRight'] && playerX < 480) playerX += 5;
      if (keys[' '] && Date.now() - lastShot > 200) {
        bullets.push({ x: playerX, y: 550, isPlayer: true });
        lastShot = Date.now();
      }

      // Formation movement
      formationX += formationDir * 0.5;
      if (Math.abs(formationX) > 30) formationDir *= -1;

      // Enemy attacks
      if (Math.random() < 0.01) {
        const aliveEnemies = enemies.filter(e => e.alive && !e.attacking);
        if (aliveEnemies.length > 0) {
          const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          attacker.attacking = true;
          attacker.attackY = attacker.y;
        }
      }

      // Update attacking enemies
      enemies.forEach(e => {
        if (e.attacking && e.alive) {
          e.attackY += 4;
          if (e.attackY > 620) {
            e.attacking = false;
            e.attackY = e.y;
          }
        }
      });

      // Enemy shooting
      if (Math.random() < 0.02) {
        const shooters = enemies.filter(e => e.alive && e.attacking);
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          bullets.push({ x: shooter.x + formationX, y: shooter.attackY, isPlayer: false });
        }
      }

      // Update bullets
      bullets = bullets.filter(b => {
        b.y += b.isPlayer ? -10 : 5;
        return b.y > 0 && b.y < 600;
      });

      // Bullet-enemy collision
      bullets = bullets.filter(b => {
        if (!b.isPlayer) return true;
        for (const e of enemies) {
          if (e.alive) {
            const ex = e.attacking ? e.x + formationX : e.x + formationX;
            const ey = e.attacking ? e.attackY : e.y;
            if (Math.abs(b.x - ex) < 20 && Math.abs(b.y - ey) < 15) {
              e.alive = false;
              currentScore += 100;
              setScore(currentScore);
              return false;
            }
          }
        }
        return true;
      });

      // Bullet-player collision
      bullets = bullets.filter(b => {
        if (b.isPlayer) return true;
        if (Math.abs(b.x - playerX) < 20 && b.y > 530) {
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

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 500, 600);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        ctx.fillRect((i * 37) % 500, (i * 71 + Date.now() / 50) % 600, 1, 1);
      }

      // Enemies
      enemies.forEach(e => {
        if (!e.alive) return;
        const x = e.x + formationX;
        const y = e.attacking ? e.attackY : e.y;
        ctx.fillStyle = e.attacking ? '#f00' : '#0f0';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // Bullets
      bullets.forEach(b => {
        ctx.fillStyle = b.isPlayer ? '#ff0' : '#f00';
        ctx.fillRect(b.x - 2, b.y - 5, 4, 10);
      });

      // Player
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(playerX, 530);
      ctx.lineTo(playerX - 20, 570);
      ctx.lineTo(playerX + 20, 570);
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
          <span className="text-blue-400">Wave: {wave}</span>
          <span className="text-red-400">Lives: {lives}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">👽 Galaga</h2>
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

        <div className="text-gray-400 text-sm">← → to move • Space to shoot</div>
      </div>
    </GameWrapper>
  );
}
