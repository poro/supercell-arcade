'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('pacman')!;

const tutorial = {
  overview: 'Eat all the dots while avoiding ghosts! Power pellets let you eat ghosts temporarily.',
  promptFlow: ['Grid-based movement', 'Ghost AI', 'Power-up system', 'Score tracking'],
  codeHighlights: ['Maze collision', 'Ghost pathfinding', 'Power pellet timer'],
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
  '     .  #GGG#  .     ',
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
    if (!canvas || !gameStarted || gameOver) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL = 20;
    canvas!.width = MAZE[0].length * CELL;
    canvas!.height = MAZE.length * CELL;

    // Parse maze
    const dots: Set<string> = new Set();
    const powerPellets: Set<string> = new Set();
    let pacman = { x: 10, y: 16, dir: 0, nextDir: 0 };
    const ghosts = [
      { x: 9, y: 10, color: '#ff0000' },
      { x: 10, y: 10, color: '#00ffff' },
      { x: 11, y: 10, color: '#ffb8ff' },
    ];

    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[0].length; x++) {
        if (MAZE[y][x] === '.') dots.add(`${x},${y}`);
        if (MAZE[y][x] === 'o') powerPellets.add(`${x},${y}`);
        if (MAZE[y][x] === 'P') pacman = { x, y, dir: 0, nextDir: 0 };
      }
    }

    let currentScore = 0;
    let currentLives = 3;
    let powerMode = 0;

    const isWall = (x: number, y: number) => {
      if (y < 0 || y >= MAZE.length || x < 0 || x >= MAZE[0].length) return true;
      return '#-'.includes(MAZE[y][x]);
    };

    const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') pacman.nextDir = 0;
      if (e.key === 'ArrowDown') pacman.nextDir = 1;
      if (e.key === 'ArrowLeft') pacman.nextDir = 2;
      if (e.key === 'ArrowUp') pacman.nextDir = 3;
    };
    window.addEventListener('keydown', handleKeyDown);

    let frame = 0;

    function loop() {
      if (!ctx) return;
      frame++;

      // Move pacman
      if (frame % 8 === 0) {
        const [ndx, ndy] = dirs[pacman.nextDir];
        if (!isWall(pacman.x + ndx, pacman.y + ndy)) {
          pacman.dir = pacman.nextDir;
        }
        const [dx, dy] = dirs[pacman.dir];
        if (!isWall(pacman.x + dx, pacman.y + dy)) {
          pacman.x += dx;
          pacman.y += dy;
        }

        // Tunnel wrap
        if (pacman.x < 0) pacman.x = MAZE[0].length - 1;
        if (pacman.x >= MAZE[0].length) pacman.x = 0;

        // Eat dots
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
          powerMode = 200;
        }

        // Check win
        if (dots.size === 0 && powerPellets.size === 0) {
          setWon(true);
          setGameOver(true);
          return;
        }
      }

      // Move ghosts
      if (frame % 12 === 0) {
        ghosts.forEach(ghost => {
          const validDirs = dirs.filter(([dx, dy]) => !isWall(ghost.x + dx, ghost.y + dy));
          if (validDirs.length > 0) {
            const [dx, dy] = validDirs[Math.floor(Math.random() * validDirs.length)];
            ghost.x += dx;
            ghost.y += dy;
          }
        });
      }

      // Ghost collision
      for (const ghost of ghosts) {
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
          if (powerMode > 0) {
            ghost.x = 10;
            ghost.y = 10;
            currentScore += 200;
            setScore(currentScore);
          } else {
            currentLives--;
            setLives(currentLives);
            pacman = { x: 10, y: 16, dir: 0, nextDir: 0 };
            if (currentLives <= 0) {
              setGameOver(true);
              return;
            }
          }
        }
      }

      if (powerMode > 0) powerMode--;

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      // Maze
      for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[0].length; x++) {
          if (MAZE[y][x] === '#') {
            ctx.fillStyle = '#00f';
            ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
      }

      // Dots
      ctx.fillStyle = '#fff';
      dots.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Power pellets
      ctx.fillStyle = '#fff';
      powerPellets.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.beginPath();
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Pacman
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(pacman.x * CELL + CELL / 2, pacman.y * CELL + CELL / 2, CELL / 2 - 2, 0.2, Math.PI * 2 - 0.2);
      ctx.lineTo(pacman.x * CELL + CELL / 2, pacman.y * CELL + CELL / 2);
      ctx.fill();

      // Ghosts
      ghosts.forEach(ghost => {
        ctx.fillStyle = powerMode > 0 ? '#00f' : ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x * CELL + CELL / 2, ghost.y * CELL + CELL / 2 - 2, CELL / 2 - 2, Math.PI, 0);
        ctx.rect(ghost.x * CELL + 2, ghost.y * CELL + CELL / 2 - 2, CELL - 4, CELL / 2);
        ctx.fill();
      });

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);

    return () => window.removeEventListener('keydown', handleKeyDown);
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
              <h2 className="text-3xl font-bold mb-4">🟡 Pac-Man</h2>
              <button onClick={resetGame} className="px-6 py-3 bg-yellow-500 rounded-lg text-xl text-black">Start</button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">{won ? '🎉 You Win!' : 'Game Over!'}</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={resetGame} className="px-6 py-3 bg-yellow-500 rounded-lg text-black">Play Again</button>
            </div>
          )}
        </div>

        <div className="text-gray-400 text-sm">Arrow keys to move</div>
      </div>
    </GameWrapper>
  );
}
