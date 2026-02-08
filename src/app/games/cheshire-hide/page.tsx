'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('cheshire-hide')!;

const tutorial = {
  overview: 'Find the hiding Cheshire Cat! He gives cryptic clues about his location via AI.',
  promptFlow: ['Cat hides in grid', 'AI gives clues', 'Player clicks to guess', 'Cat responds to guesses'],
  codeHighlights: ['Spatial clue generation', 'Hot/cold feedback', 'AI-driven hints'],
};

const GRID_SIZE = 5;

export default function CheshireHideGame() {
  const [catPosition, setCatPosition] = useState({ x: 0, y: 0 });
  const [guesses, setGuesses] = useState(0);
  const [found, setFound] = useState(false);
  const [catMessage, setCatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickedCells, setClickedCells] = useState<Set<string>>(new Set());
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = useCallback(async () => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    setCatPosition({ x, y });
    setGuesses(0);
    setFound(false);
    setClickedCells(new Set());
    setGameStarted(true);

    setIsLoading(true);
    try {
      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        "You're hiding in a 5x5 grid. Give a mysterious, cryptic greeting that hints you're hiding somewhere. Don't reveal where!",
        [],
        "You're playing hide and seek. Be mysterious and playful!"
      );
      setCatMessage(response.message);
    } catch {
      setCatMessage("I'm hiding somewhere in this grid... Can you find me? 😺");
    }
    setIsLoading(false);
  }, []);

  const getClue = async (clickX: number, clickY: number) => {
    const distance = Math.abs(clickX - catPosition.x) + Math.abs(clickY - catPosition.y);
    
    let hint = '';
    if (distance === 0) {
      setFound(true);
      hint = 'found';
    } else if (distance === 1) {
      hint = 'very hot';
    } else if (distance === 2) {
      hint = 'warm';
    } else if (distance === 3) {
      hint = 'cold';
    } else {
      hint = 'freezing';
    }

    setIsLoading(true);
    try {
      const prompt = hint === 'found'
        ? "The player found you! React with dramatic surprise and amusement (1 sentence)."
        : `The player is ${hint}. Give a cryptic, teasing clue about getting warmer/colder (1 sentence). Don't say the actual position!`;
      
      const response = await chat(CHARACTERS.CHESHIRE_CAT, prompt, [], "Be mysterious and playful!");
      setCatMessage(response.message);
    } catch {
      const fallbacks: Record<string, string> = {
        'found': "Well well... you found me! How curious... 😺",
        'very hot': "My grin is tingling... you're so close!",
        'warm': "Getting warmer, curious one...",
        'cold': "Brrr... not quite the right direction.",
        'freezing': "As cold as the Queen's heart! Far off indeed.",
      };
      setCatMessage(fallbacks[hint]);
    }
    setIsLoading(false);
  };

  const handleCellClick = async (x: number, y: number) => {
    if (found || isLoading) return;
    
    const key = `${x},${y}`;
    if (clickedCells.has(key)) return;
    
    setClickedCells(new Set([...clickedCells, key]));
    setGuesses(g => g + 1);
    await getClue(x, y);
  };

  const getDistance = (x: number, y: number) => {
    if (!clickedCells.has(`${x},${y}`)) return null;
    return Math.abs(x - catPosition.x) + Math.abs(y - catPosition.y);
  };

  const getCellColor = (x: number, y: number) => {
    const dist = getDistance(x, y);
    if (dist === null) return 'bg-gray-700 hover:bg-gray-600';
    if (dist === 0) return 'bg-purple-500';
    if (dist === 1) return 'bg-red-500';
    if (dist === 2) return 'bg-orange-500';
    if (dist === 3) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">😺</div>
            <h2 className="text-3xl font-bold mb-4">Find the Cheshire Cat</h2>
            <p className="text-gray-400 mb-8">
              The cat is hiding! Click tiles and follow his cryptic clues.
              <br />
              <span className="text-purple-400">Powered by Neocortex AI</span>
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Start Seeking
            </button>
          </div>
        ) : (
          <>
            <div className="text-xl font-bold">
              Guesses: {guesses} {found && '• 🎉 FOUND!'}
            </div>

            {/* Cat message */}
            <div className="flex items-center gap-3 bg-purple-500/20 px-4 py-3 rounded-xl max-w-md min-h-16">
              <span className="text-3xl">{found ? '😺' : '👀'}</span>
              <p className={`italic ${isLoading ? 'animate-pulse' : ''}`}>
                {isLoading ? '*the grin shimmers*' : catMessage}
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                return (
                  <button
                    key={i}
                    onClick={() => handleCellClick(x, y)}
                    disabled={found || isLoading}
                    className={`w-14 h-14 rounded-lg text-2xl transition-all ${getCellColor(x, y)}`}
                  >
                    {found && x === catPosition.x && y === catPosition.y && '😺'}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 rounded" /> Hot</span>
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-500 rounded" /> Warm</span>
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-500 rounded" /> Cool</span>
              <span className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-500 rounded" /> Cold</span>
            </div>

            {found && (
              <button
                onClick={startGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
              >
                Play Again
              </button>
            )}
          </>
        )}
      </div>
    </GameWrapper>
  );
}
