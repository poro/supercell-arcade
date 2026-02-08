'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('tower-defense')!;

const tutorial = {
  overview: 'Build towers to stop waves of enemies! Place towers strategically along the path.',
  promptFlow: ['Path-based enemy movement', 'Tower placement', 'Targeting and shooting', 'Wave system'],
  codeHighlights: ['Pathfinding for enemies', 'Tower range detection', 'Economy management'],
};

export default function TowerDefenseGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [money, setMoney] = useState(100);
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setMoney(100);
    setLives(20);
    setWave(1);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    const path = [
      { x: 0, y: 200 },
      { x: 150, y: 200 },
      { x: 150, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 300 },
      { x: 450, y: 300 },
      { x: 450, y: 200 },
      { x: 600, y: 200 },
    ];

    interface Enemy { x: number; y: number; hp: number; maxHp: number; pathIndex: number; speed: number; }
    interface Tower { x: number; y: number; range: number; damage: number; cooldown: number; lastShot: number; }
    interface Bullet { x: number; y: number; tx: number; ty: number; }

    let enemies: Enemy[] = [];
    let towers: Tower[] = [];
    let bullets: Bullet[] = [];
    let currentMoney = 100;
    let currentLives = 20;
    let currentWave = 1;
    let enemiesSpawned = 0;
    let spawnTimer = 0;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if on path
      const onPath = path.some((p, i) => {
        if (i === 0) return false;
        const prev = path[i - 1];
        const minX = Math.min(prev.x, p.x) - 20;
        const maxX = Math.max(prev.x, p.x) + 20;
        const minY = Math.min(prev.y, p.y) - 20;
        const maxY = Math.max(prev.y, p.y) + 20;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      });

      if (!onPath && currentMoney >= 50) {
        towers.push({ x, y, range: 80, damage: 10, cooldown: 30, lastShot: 0 });
        currentMoney -= 50;
        setMoney(currentMoney);
      }
    };

    canvas.addEventListener('click', handleClick);

    function spawnWave() {
      enemiesSpawned = 0;
    }
    spawnWave();

    let frame = 0;
    function loop() {
      if (!ctx) return;
      frame++;

      // Spawn enemies
      if (enemiesSpawned < 5 + currentWave * 2 && spawnTimer <= 0) {
        enemies.push({
          x: path[0].x,
          y: path[0].y,
          hp: 50 + currentWave * 20,
          maxHp: 50 + currentWave * 20,
          pathIndex: 0,
          speed: 1 + currentWave * 0.1,
        });
        enemiesSpawned++;
        spawnTimer = 60;
      }
      spawnTimer--;

      // Move enemies
      enemies.forEach(enemy => {
        if (enemy.pathIndex < path.length - 1) {
          const target = path[enemy.pathIndex + 1];
          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const dist = Math.hypot(dx, dy);
          
          if (dist < enemy.speed) {
            enemy.pathIndex++;
          } else {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
          }
        }
      });

      // Remove enemies that reached end
      enemies = enemies.filter(enemy => {
        if (enemy.pathIndex >= path.length - 1 && enemy.x >= 600) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) setGameOver(true);
          return false;
        }
        return true;
      });

      // Tower shooting
      towers.forEach(tower => {
        if (frame - tower.lastShot >= tower.cooldown) {
          const target = enemies.find(e => Math.hypot(e.x - tower.x, e.y - tower.y) < tower.range);
          if (target) {
            bullets.push({ x: tower.x, y: tower.y, tx: target.x, ty: target.y });
            tower.lastShot = frame;
          }
        }
      });

      // Move bullets
      bullets = bullets.filter(bullet => {
        const dx = bullet.tx - bullet.x;
        const dy = bullet.ty - bullet.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 5) {
          // Hit enemy
          const hit = enemies.find(e => Math.hypot(e.x - bullet.tx, e.y - bullet.ty) < 15);
          if (hit) {
            hit.hp -= 10;
            if (hit.hp <= 0) {
              enemies = enemies.filter(e => e !== hit);
              currentMoney += 10;
              setMoney(currentMoney);
            }
          }
          return false;
        }
        
        bullet.x += (dx / dist) * 8;
        bullet.y += (dy / dist) * 8;
        return true;
      });

      // Next wave
      if (enemies.length === 0 && enemiesSpawned >= 5 + currentWave * 2) {
        currentWave++;
        setWave(currentWave);
        spawnWave();
      }

      // Draw
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, 600, 400);

      // Path
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      path.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Towers
      towers.forEach(tower => {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Enemies
      enemies.forEach(enemy => {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        ctx.fillStyle = '#0f0';
        ctx.fillRect(enemy.x - 12, enemy.y - 18, 24 * (enemy.hp / enemy.maxHp), 4);
      });

      // Bullets
      ctx.fillStyle = '#ff0';
      bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => canvas.removeEventListener('click', handleClick);
  }, [gameStarted, gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-yellow-400">💰 {money}</span>
          <span className="text-red-400">❤️ {lives}</span>
          <span className="text-blue-400">Wave: {wave}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg cursor-pointer" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🏰 Tower Defense</h2>
              <p className="text-gray-400 mb-4">Click to place towers ($50)</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Reached Wave {wave}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-green-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Click anywhere (not on path) to build a tower for $50</div>
      </div>
    </GameWrapper>
  );
}
