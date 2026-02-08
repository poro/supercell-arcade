'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('missile-command')!;

const tutorial = {
  overview: 'Defend your cities from incoming missiles! Click to launch counter-missiles and create explosions that destroy incoming threats.',
  promptFlow: ['Click to target counter-missiles', 'Missiles travel to click point', 'Explosions destroy incoming missiles', 'Protect all 6 cities'],
  codeHighlights: ['Click-to-target system', 'Explosion chain reactions', 'Wave-based difficulty'],
};

export default function MissileCommandGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [cities, setCities] = useState(6);
  const [wave, setWave] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setCities(6);
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

    interface Missile { x: number; y: number; tx: number; ty: number; speed: number; isPlayer: boolean; }
    interface Explosion { x: number; y: number; radius: number; maxRadius: number; growing: boolean; }

    let missiles: Missile[] = [];
    let explosions: Explosion[] = [];
    let citiesAlive = [true, true, true, true, true, true];
    let currentScore = 0;
    let missileTimer = 0;
    let currentWave = 1;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      missiles.push({
        x: 300, y: 380,
        tx: x, ty: y,
        speed: 8,
        isPlayer: true
      });
    };

    canvas.addEventListener('click', handleClick);

    function loop() {
      if (!ctx) return;

      // Spawn enemy missiles
      missileTimer++;
      if (missileTimer > 60 - currentWave * 5) {
        missileTimer = 0;
        const targetCity = Math.floor(Math.random() * 6);
        if (citiesAlive[targetCity]) {
          missiles.push({
            x: Math.random() * 600,
            y: 0,
            tx: 50 + targetCity * 100,
            ty: 380,
            speed: 1 + currentWave * 0.3,
            isPlayer: false
          });
        }
      }

      // Update missiles
      missiles = missiles.filter(m => {
        const dx = m.tx - m.x;
        const dy = m.ty - m.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < m.speed) {
          if (m.isPlayer) {
            explosions.push({ x: m.tx, y: m.ty, radius: 0, maxRadius: 40, growing: true });
          } else {
            // Hit city
            const cityIndex = Math.floor((m.tx - 25) / 100);
            if (cityIndex >= 0 && cityIndex < 6 && citiesAlive[cityIndex]) {
              citiesAlive[cityIndex] = false;
              setCities(citiesAlive.filter(c => c).length);
              if (citiesAlive.every(c => !c)) {
                setGameOver(true);
              }
            }
          }
          return false;
        }
        
        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;
        return true;
      });

      // Update explosions
      explosions = explosions.filter(e => {
        if (e.growing) {
          e.radius += 2;
          if (e.radius >= e.maxRadius) e.growing = false;
        } else {
          e.radius -= 1;
        }
        
        // Destroy enemy missiles
        missiles = missiles.filter(m => {
          if (!m.isPlayer && Math.hypot(m.x - e.x, m.y - e.y) < e.radius) {
            currentScore += 25;
            setScore(currentScore);
            return false;
          }
          return true;
        });
        
        return e.radius > 0;
      });

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 600, 400);

      // Ground
      ctx.fillStyle = '#0a0';
      ctx.fillRect(0, 380, 600, 20);

      // Cities
      citiesAlive.forEach((alive, i) => {
        ctx.fillStyle = alive ? '#0ff' : '#333';
        ctx.fillRect(35 + i * 100, 360, 30, 20);
      });

      // Missiles
      missiles.forEach(m => {
        ctx.strokeStyle = m.isPlayer ? '#0f0' : '#f00';
        ctx.beginPath();
        ctx.moveTo(m.isPlayer ? 300 : m.tx, m.isPlayer ? 380 : 0);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();
        
        ctx.fillStyle = m.isPlayer ? '#0f0' : '#f00';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Explosions
      explosions.forEach(e => {
        ctx.fillStyle = `rgba(255, ${Math.floor(255 - e.radius * 3)}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
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
          <span className="text-green-400">Score: {score}</span>
          <span className="text-cyan-400">Cities: {cities}</span>
          <span className="text-yellow-400">Wave: {wave}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg cursor-crosshair" />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🚀 Missile Command</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-red-500 rounded-lg text-xl">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-red-500 rounded-lg">Try Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Click to launch counter-missiles!</div>
      </div>
    </GameWrapper>
  );
}
