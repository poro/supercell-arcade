'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('snake')!;

const tutorial = {
  overview: 'Snake is a timeless classic where you grow by eating food while avoiding collision with yourself. This implementation uses a grid-based system with smooth movement and wrap-around edges.',
  promptFlow: [
    'Create grid-based snake movement system',
    'Implement food spawning with collision detection',
    'Add self-collision detection for game over',
    'Track score based on snake length',
    'Add increasing speed as snake grows',
  ],
  codeHighlights: [
    'Grid-based coordinate system (20x20)',
    'Linked-list style snake body management',
    'Random food placement avoiding snake body',
    'Progressive difficulty via speed increase',
  ],
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameStateRef = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    food: { x: 15, y: 10 } as Point,
    direction: 'RIGHT' as Direction,
    nextDirection: 'RIGHT' as Direction,
  });

  const GRID_SIZE = 20;
  const CELL_SIZE = 25;

  const resetGame = useCallback(() => {
    gameStateRef.current = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 10 },
      direction: 'RIGHT',
      nextDirection: 'RIGHT',
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas!.width = GRID_SIZE * CELL_SIZE;
    canvas!.height = GRID_SIZE * CELL_SIZE;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      const dir = state.direction;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dir !== 'DOWN') state.nextDirection = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dir !== 'UP') state.nextDirection = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dir !== 'RIGHT') state.nextDirection = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dir !== 'LEFT') state.nextDirection = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    function spawnFood() {
      const state = gameStateRef.current;
      let newFood: Point;
      do {
        newFood = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        };
      } while (state.snake.some(s => s.x === newFood.x && s.y === newFood.y));
      state.food = newFood;
    }

    function draw() {
      if (!ctx) return;
      const state = gameStateRef.current;

      // Background
      ctx.fillStyle = '#0f0a1e';
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

      // Grid
      ctx.strokeStyle = '#1a1530';
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Food
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(
        state.food.x * CELL_SIZE + CELL_SIZE / 2,
        state.food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Snake
      state.snake.forEach((segment, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? '#22c55e' : '#4ade80';
        ctx.beginPath();
        ctx.roundRect(
          segment.x * CELL_SIZE + 2,
          segment.y * CELL_SIZE + 2,
          CELL_SIZE - 4,
          CELL_SIZE - 4,
          isHead ? 8 : 4
        );
        ctx.fill();
        
        // Eyes on head
        if (isHead) {
          ctx.fillStyle = '#000';
          const eyeOffset = 6;
          if (state.direction === 'RIGHT') {
            ctx.beginPath();
            ctx.arc(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset, segment.y * CELL_SIZE + 8, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * CELL_SIZE + CELL_SIZE - eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - 8, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (state.direction === 'LEFT') {
            ctx.beginPath();
            ctx.arc(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + 8, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * CELL_SIZE + eyeOffset, segment.y * CELL_SIZE + CELL_SIZE - 8, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (state.direction === 'UP') {
            ctx.beginPath();
            ctx.arc(segment.x * CELL_SIZE + 8, segment.y * CELL_SIZE + eyeOffset, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + eyeOffset, 3, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(segment.x * CELL_SIZE + 8, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset, 3, 0, Math.PI * 2);
            ctx.arc(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + CELL_SIZE - eyeOffset, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }

    function update() {
      if (!gameStarted || gameOver) return;

      const state = gameStateRef.current;
      state.direction = state.nextDirection;

      // Move head
      const head = { ...state.snake[0] };
      switch (state.direction) {
        case 'UP': head.y--; break;
        case 'DOWN': head.y++; break;
        case 'LEFT': head.x--; break;
        case 'RIGHT': head.x++; break;
      }

      // Wrap around
      if (head.x < 0) head.x = GRID_SIZE - 1;
      if (head.x >= GRID_SIZE) head.x = 0;
      if (head.y < 0) head.y = GRID_SIZE - 1;
      if (head.y >= GRID_SIZE) head.y = 0;

      // Self collision
      if (state.snake.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        setHighScore(prev => Math.max(prev, score));
        return;
      }

      state.snake.unshift(head);

      // Eat food
      if (head.x === state.food.x && head.y === state.food.y) {
        setScore(s => s + 10);
        spawnFood();
      } else {
        state.snake.pop();
      }
    }

    draw();
    const speed = Math.max(50, 150 - score);
    const gameInterval = setInterval(() => {
      update();
      draw();
    }, speed);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(gameInterval);
    };
  }, [gameStarted, gameOver, score]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        {/* Score Display */}
        <div className="flex gap-8 text-2xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-yellow-400">High Score: {highScore}</span>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-green-500/50"
          />
          
          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-4">🐍 Snake</h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-xl"
              >
                Start Game
              </button>
            </div>
          )}
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-3xl font-bold mb-2">💀 Game Over!</h2>
              <p className="text-xl mb-4">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-gray-400 text-sm">
          Controls: <kbd className="bg-gray-800 px-2 py-1 rounded">WASD</kbd> or Arrow Keys • Eat food, don't hit yourself!
        </div>
      </div>
    </GameWrapper>
  );
}
