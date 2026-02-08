'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('rabbit-chase')!;

const tutorial = {
  overview: 'Chase the White Rabbit through a grid-based Wonderland! The Rabbit is always late and keeps running away, but he leaves hints and clues using Neocortex AI. Collect all the pocket watches to win!',
  promptFlow: [
    'Generate a grid-based maze with the White Rabbit and collectibles',
    'When player approaches rabbit, he runs away and speaks via Neocortex',
    'Rabbit gives cryptic hints about where pocket watches are hidden',
    'Player must collect all watches while the rabbit keeps moving',
    'Victory when all watches collected, rabbit gives final speech',
  ],
  codeHighlights: [
    'Grid-based movement with keyboard controls',
    'AI-driven NPC dialogue via Neocortex',
    'Pathfinding for rabbit escape behavior',
    'Collectible system with win condition',
  ],
};

const GRID_SIZE = 12;
const CELL_SIZE = 50;

interface Position {
  x: number;
  y: number;
}

export default function RabbitChaseGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [player, setPlayer] = useState<Position>({ x: 0, y: 0 });
  const [rabbit, setRabbit] = useState<Position>({ x: 8, y: 8 });
  const [watches, setWatches] = useState<Position[]>([]);
  const [collected, setCollected] = useState(0);
  const [rabbitMessage, setRabbitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [won, setWon] = useState(false);
  const [steps, setSteps] = useState(0);

  const startGame = useCallback(() => {
    setPlayer({ x: 0, y: 0 });
    setRabbit({ x: GRID_SIZE - 2, y: GRID_SIZE - 2 });
    
    // Generate random watch positions
    const newWatches: Position[] = [];
    while (newWatches.length < 5) {
      const pos = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (pos.x !== 0 || pos.y !== 0) { // Not on player start
        if (!newWatches.some(w => w.x === pos.x && w.y === pos.y)) {
          newWatches.push(pos);
        }
      }
    }
    setWatches(newWatches);
    setCollected(0);
    setSteps(0);
    setWon(false);
    setGameStarted(true);
    
    getRabbitMessage("The player just started the game! You're the White Rabbit and you're LATE! Greet them briefly and mysteriously, mention you've hidden pocket watches around Wonderland.");
  }, []);

  async function getRabbitMessage(context: string) {
    setIsLoading(true);
    try {
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        context,
        [],
        "You are the White Rabbit from Alice in Wonderland. You're always late and frantic. Keep responses to 1-2 short sentences. Be anxious about time!"
      );
      setRabbitMessage(response.message);
    } catch (error) {
      const fallbacks = [
        "Oh dear! Oh dear! I'm terribly late!",
        "No time to explain! Find the watches!",
        "Tick tock, tick tock! Hurry!",
        "The Queen will have my head! Quick, the watches!",
      ];
      setRabbitMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
    setIsLoading(false);
  }

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameStarted || won) return;

    setPlayer(prev => {
      const newX = Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx));
      const newY = Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy));
      return { x: newX, y: newY };
    });
    setSteps(s => s + 1);
  }, [gameStarted, won]);

  // Check collisions and rabbit behavior
  useEffect(() => {
    if (!gameStarted || won) return;

    // Check watch collection
    const watchIndex = watches.findIndex(w => w.x === player.x && w.y === player.y);
    if (watchIndex !== -1) {
      setWatches(prev => prev.filter((_, i) => i !== watchIndex));
      setCollected(c => c + 1);
      
      if (collected + 1 >= 5) {
        setWon(true);
        getRabbitMessage("The player collected all 5 pocket watches! Congratulate them dramatically but still be anxious about being late!");
      } else {
        getRabbitMessage(`The player found watch #${collected + 1}! React with frantic excitement. Give a tiny hint about where another might be hidden (use directions like "north" or "in the corner").`);
      }
    }

    // Rabbit runs away if player gets close
    const distance = Math.abs(player.x - rabbit.x) + Math.abs(player.y - rabbit.y);
    if (distance <= 2 && !won) {
      // Move rabbit away from player
      setRabbit(prev => {
        const dx = prev.x - player.x;
        const dy = prev.y - player.y;
        
        let newX = prev.x + (dx > 0 ? 2 : dx < 0 ? -2 : (Math.random() > 0.5 ? 2 : -2));
        let newY = prev.y + (dy > 0 ? 2 : dy < 0 ? -2 : (Math.random() > 0.5 ? 2 : -2));
        
        newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
        newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));
        
        return { x: newX, y: newY };
      });
      
      if (Math.random() > 0.5) {
        getRabbitMessage("The player got too close! Run away frantically while shouting about being late!");
      }
    }
  }, [player, watches, rabbit, collected, gameStarted, won]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🐰</div>
            <h2 className="text-3xl font-bold mb-4">Chase the White Rabbit!</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              The White Rabbit has hidden 5 pocket watches in Wonderland!
              Collect them all while he runs around being late!
              <br />
              <span className="text-purple-400">Powered by Neocortex AI</span>
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Down the Rabbit Hole!
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="flex gap-8 text-xl font-bold">
              <span className="text-yellow-400">⌚ Watches: {collected}/5</span>
              <span className="text-blue-400">👣 Steps: {steps}</span>
            </div>

            {/* Game Grid */}
            <div 
              className="relative bg-gradient-to-br from-green-900/30 to-teal-900/30 rounded-xl border-2 border-green-500/30"
              style={{
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
                <div
                  key={`v${i}`}
                  className="absolute bg-green-500/10"
                  style={{
                    left: (i + 1) * CELL_SIZE,
                    top: 0,
                    width: 1,
                    height: GRID_SIZE * CELL_SIZE,
                  }}
                />
              ))}
              {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
                <div
                  key={`h${i}`}
                  className="absolute bg-green-500/10"
                  style={{
                    top: (i + 1) * CELL_SIZE,
                    left: 0,
                    height: 1,
                    width: GRID_SIZE * CELL_SIZE,
                  }}
                />
              ))}

              {/* Watches */}
              {watches.map((watch, i) => (
                <div
                  key={i}
                  className="absolute flex items-center justify-center text-2xl animate-pulse"
                  style={{
                    left: watch.x * CELL_SIZE,
                    top: watch.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                >
                  ⌚
                </div>
              ))}

              {/* Rabbit */}
              <div
                className="absolute flex items-center justify-center text-3xl transition-all duration-300"
                style={{
                  left: rabbit.x * CELL_SIZE,
                  top: rabbit.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                🐰
              </div>

              {/* Player */}
              <div
                className="absolute flex items-center justify-center text-3xl transition-all duration-100"
                style={{
                  left: player.x * CELL_SIZE,
                  top: player.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                👧
              </div>
            </div>

            {/* Rabbit Message */}
            {rabbitMessage && (
              <div className="max-w-lg bg-white/10 p-4 rounded-xl border border-white/20">
                <div className="flex gap-3">
                  <span className="text-2xl">🐰</span>
                  <p className={`italic ${isLoading ? 'animate-pulse' : ''}`}>
                    "{rabbitMessage}"
                  </p>
                </div>
              </div>
            )}

            {/* Win Screen */}
            {won && (
              <div className="text-center bg-black/50 p-6 rounded-xl">
                <h2 className="text-3xl font-bold mb-2">🎉 You Win!</h2>
                <p className="text-xl mb-4">All watches collected in {steps} steps!</p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg"
                >
                  Play Again
                </button>
              </div>
            )}

            {/* Controls hint */}
            <div className="text-gray-500 text-sm">
              Use WASD or Arrow Keys to move
            </div>
          </>
        )}
      </div>
    </GameWrapper>
  );
}
