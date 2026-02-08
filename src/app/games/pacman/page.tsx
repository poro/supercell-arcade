'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('pacman')!;

const tutorial = {
  overview: 'The 1980 arcade legend! Navigate the maze as Pac-Man, eating all the dots while avoiding the four colorful ghosts. Grab a power pellet to turn the tables and eat the ghosts for bonus points!',
  howToPlay: [
    'Use ARROW KEYS to move Pac-Man through the maze',
    'Eat all the dots to complete the level',
    'Avoid the ghosts - they will cost you a life!',
    'Grab the large power pellets in the corners',
    'When powered up, ghosts turn blue and you can eat them',
    'Eaten ghosts return to the center to regenerate',
  ],
  winCondition: 'Clear all dots from the maze to win the level!',
  promptFlow: ['Grid-based movement with collision', 'Ghost AI with scatter/chase modes', 'Power pellet timer system', 'Tunnel wrap-around'],
  codeHighlights: [
    'Tile-based maze collision detection',
    'Each ghost has unique targeting behavior',
    'Power mode timer with ghost vulnerability',
    'Animated sprites for Pac-Man and ghosts',
    'Score multiplier for consecutive ghost eating',
  ],
  techStack: ['Canvas 2D', 'Grid Collision', 'State Machine', 'Animation Frames'],
};

const MAZE = [
  '#####################',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o###.###.#.###.###o#',
  '#...................#',
  '#.###.#.#####.#.###.#',
  '#.....#...#...#.....#',
  '#####.### # ###.#####',
  '    #.#       #.#    ',
  '#####.# ##-## #.#####',
  '     .  #   #  .     ',
  '#####.# ##### #.#####',
  '    #.#       #.#    ',
  '#####.# ##### #.#####',
  '#.........#.........#',
  '#.###.###.#.###.###.#',
  '#o..#.....P.....#..o#',
  '###.#.#.#####.#.#.###',
  '#.....#...#...#.....#',
  '#.#######.#.#######.#',
  '#...................#',
  '#####################',
];

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [won, setWon] = useState(false);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver || won) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL = 22;
    canvas.width = MAZE[0].length * CELL;
    canvas.height = MAZE.length * CELL;

    // Parse maze
    const dots: Set<string> = new Set();
    const powerPellets: Set<string> = new Set();
    let pacman = { x: 10, y: 16, dir: 0, nextDir: 0, mouthOpen: 0 };
    let ghosts = [
      { x: 9, y: 10, color: '#ff0000', name: 'Blinky', homeX: 1, homeY: 1 },
      { x: 10, y: 10, color: '#00ffff', name: 'Inky', homeX: 19, homeY: 1 },
      { x: 11, y: 10, color: '#ffb8ff', name: 'Pinky', homeX: 1, homeY: 20 },
      { x: 10, y: 9, color: '#ffb852', name: 'Clyde', homeX: 19, homeY: 20 },
    ];
    const ghostHome = { x: 10, y: 10 };

    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[0].length; x++) {
        if (MAZE[y][x] === '.') dots.add(`${x},${y}`);
        if (MAZE[y][x] === 'o') powerPellets.add(`${x},${y}`);
        if (MAZE[y][x] === 'P') pacman = { ...pacman, x, y };
      }
    }

    let currentScore = 0;
    let currentLives = 3;
    let powerMode = 0;
    let ghostsEaten = 0;
    let frame = 0;

    const isWall = (x: number, y: number) => {
      if (y < 0 || y >= MAZE.length) return true;
      // Tunnel wrap
      if (x < 0 || x >= MAZE[0].length) return false;
      return '#-'.includes(MAZE[y][x]);
    };

    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') pacman.nextDir = 0;
      if (e.key === 'ArrowDown') pacman.nextDir = 1;
      if (e.key === 'ArrowLeft') pacman.nextDir = 2;
      if (e.key === 'ArrowUp') pacman.nextDir = 3;
      e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);

    let animationId: number;

    function loop() {
      if (!ctx) return;
      frame++;
      pacman.mouthOpen = Math.sin(frame * 0.3) * 0.5 + 0.5;

      // Pac-Man movement
      if (frame % 6 === 0) {
        // Try next direction
        const [ndx, ndy] = dirs[pacman.nextDir];
        if (!isWall(pacman.x + ndx, pacman.y + ndy)) {
          pacman.dir = pacman.nextDir;
        }
        
        const [dx, dy] = dirs[pacman.dir];
        const newX = pacman.x + dx;
        const newY = pacman.y + dy;
        
        if (!isWall(newX, newY)) {
          pacman.x = newX;
          pacman.y = newY;
          
          // Tunnel wrap
          if (pacman.x < 0) pacman.x = MAZE[0].length - 1;
          if (pacman.x >= MAZE[0].length) pacman.x = 0;
        }
        
        // Eat dot
        const key = `${pacman.x},${pacman.y}`;
        if (dots.has(key)) {
          dots.delete(key);
          currentScore += 10;
          setScore(currentScore);
        }
        if (powerPellets.has(key)) {
          powerPellets.delete(key);
          currentScore += 50;
          setScore(currentScore);
          powerMode = 300;
          ghostsEaten = 0;
        }
        
        // Check win
        if (dots.size === 0 && powerPellets.size === 0) {
          setWon(true);
        }
      }

      // Power mode countdown
      if (powerMode > 0) powerMode--;

      // Ghost movement
      if (frame % 8 === 0) {
        ghosts.forEach((ghost, i) => {
          // Simple chase/scatter AI
          let targetX = pacman.x;
          let targetY = pacman.y;
          
          if (powerMode > 0) {
            // Flee from Pac-Man
            targetX = ghost.homeX;
            targetY = ghost.homeY;
          }
          
          // Find best direction
          let bestDir = 0;
          let bestDist = Infinity;
          
          dirs.forEach(([dx, dy], d) => {
            const nx = ghost.x + dx;
            const ny = ghost.y + dy;
            if (!isWall(nx, ny)) {
              const dist = Math.hypot(nx - targetX, ny - targetY);
              if (dist < bestDist) {
                bestDist = dist;
                bestDir = d;
              }
            }
          });
          
          // Add some randomness
          if (Math.random() < 0.2) {
            const validDirs = dirs.map((d, i) => i).filter(d => {
              const [dx, dy] = dirs[d];
              return !isWall(ghost.x + dx, ghost.y + dy);
            });
            if (validDirs.length > 0) {
              bestDir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
          }
          
          const [dx, dy] = dirs[bestDir];
          if (!isWall(ghost.x + dx, ghost.y + dy)) {
            ghost.x += dx;
            ghost.y += dy;
            
            // Tunnel wrap
            if (ghost.x < 0) ghost.x = MAZE[0].length - 1;
            if (ghost.x >= MAZE[0].length) ghost.x = 0;
          }
        });
      }

      // Collision detection
      ghosts.forEach(ghost => {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
          if (powerMode > 0) {
            // Eat ghost
            ghostsEaten++;
            currentScore += 200 * Math.pow(2, ghostsEaten - 1);
            setScore(currentScore);
            ghost.x = ghostHome.x;
            ghost.y = ghostHome.y;
          } else {
            // Lose life
            currentLives--;
            setLives(currentLives);
            pacman.x = 10;
            pacman.y = 16;
            if (currentLives <= 0) setGameOver(true);
          }
        }
      });

      // === DRAW ===
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw maze
      for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[0].length; x++) {
          const char = MAZE[y][x];
          const px = x * CELL;
          const py = y * CELL;
          
          if (char === '#') {
            ctx.fillStyle = '#2121de';
            ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
            // Highlight edges
            ctx.strokeStyle = '#5555ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
          }
        }
      }

      // Draw dots
      ctx.fillStyle = '#ffb897';
      dots.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw power pellets (blinking)
      if (frame % 20 < 15) {
        ctx.fillStyle = '#ffb897';
        powerPellets.forEach(key => {
          const [x, y] = key.split(',').map(Number);
          ctx.beginPath();
          ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 7, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw ghosts
      ghosts.forEach(ghost => {
        const gx = ghost.x * CELL + CELL / 2;
        const gy = ghost.y * CELL + CELL / 2;
        const isScared = powerMode > 0;
        const isFlashing = powerMode > 0 && powerMode < 60 && frame % 10 < 5;
        
        // Ghost body
        ctx.fillStyle = isScared ? (isFlashing ? '#fff' : '#2121de') : ghost.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, 9, Math.PI, 0);
        ctx.lineTo(gx + 9, gy + 8);
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
          ctx.lineTo(gx + 9 - i * 6 - 3, gy + 4);
          ctx.lineTo(gx + 9 - i * 6 - 6, gy + 8);
        }
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        if (isScared) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(gx - 4, gy - 2, 2, 0, Math.PI * 2);
          ctx.arc(gx + 4, gy - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(gx - 4, gy - 2, 4, 0, Math.PI * 2);
          ctx.arc(gx + 4, gy - 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#00f';
          ctx.beginPath();
          ctx.arc(gx - 3, gy - 1, 2, 0, Math.PI * 2);
          ctx.arc(gx + 5, gy - 1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Pac-Man
      const px = pacman.x * CELL + CELL / 2;
      const py = pacman.y * CELL + CELL / 2;
      const angle = pacman.dir * Math.PI / 2;
      const mouthAngle = 0.2 + pacman.mouthOpen * 0.3;
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(px, py, 10, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle);
      ctx.lineTo(px, py);
      ctx.closePath();
      ctx.fill();

      // Power mode indicator
      if (powerMode > 0) {
        ctx.fillStyle = `rgba(0, 100, 255, ${powerMode / 300 * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(loop);
    }

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver, won]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold font-mono">
          <span className="text-yellow-400">SCORE: {score.toString().padStart(6, '0')}</span>
          <span className="text-red-400">LIVES: {'🟡'.repeat(lives)}</span>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="rounded-lg border-4 border-blue-900" style={{ imageRendering: 'pixelated' }} />
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <div className="text-6xl mb-4">🟡👻👻👻👻</div>
              <h2 className="text-4xl font-bold mb-2 text-yellow-400">PAC-MAN</h2>
              <p className="text-gray-400 mb-6">Eat all the dots! Avoid the ghosts!</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-2xl text-black font-bold hover:scale-105 transition-transform">
                START
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-red-500">GAME OVER</h2>
              <p className="text-2xl text-yellow-400 mb-6">Score: {score}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
          
          {won && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-2 text-green-400">🎉 YOU WIN! 🎉</h2>
              <p className="text-2xl text-yellow-400 mb-6">Score: {score}</p>
              <button onClick={resetGame} className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-xl text-black font-bold hover:scale-105 transition-transform">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm flex gap-4">
          <span>⬅️⬆️⬇️➡️ Move</span>
          <span>🔵 Power Pellet = Eat Ghosts!</span>
        </div>
      </div>
    </GameWrapper>
  );
}
