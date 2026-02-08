'use client';

import { useState } from 'react';
import { Game, GameDesignPattern } from '@/data/games';
import Link from 'next/link';

interface GameWrapperProps {
  game: Game;
  children: React.ReactNode;
  tutorial: {
    overview: string;
    promptFlow: string[];
    codeHighlights: string[];
  };
}

export default function GameWrapper({ game, children, tutorial }: GameWrapperProps) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Game Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <p className="text-purple-300 mt-1">{game.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.usesNeocortex && (
              <span className="text-sm bg-purple-500/30 px-3 py-1 rounded-full">
                🤖 Neocortex: {game.neocortexCharacter === 'WHITE_RABBIT' ? '🐰 White Rabbit' : '😺 Cheshire Cat'}
              </span>
            )}
            <span className={`text-sm px-3 py-1 rounded-full ${
              game.difficulty === 'easy' ? 'bg-green-500/30' :
              game.difficulty === 'medium' ? 'bg-yellow-500/30' : 'bg-red-500/30'
            }`}>
              {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
        >
          {showTutorial ? '🎮 Play Game' : '📚 How It Works'}
        </button>
      </div>

      {/* Tutorial Panel */}
      {showTutorial ? (
        <div className="bg-black/30 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">📚 How This Game Was Built</h2>
          
          {/* Overview */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">Overview</h3>
            <p className="text-gray-300">{tutorial.overview}</p>
          </section>

          {/* Design Patterns */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">
              Game Design Patterns Used
            </h3>
            <div className="grid gap-3">
              {game.patterns.map((pattern: GameDesignPattern, i: number) => (
                <div key={i} className="bg-white/5 p-3 rounded-lg">
                  <div className="font-semibold">{pattern.name}</div>
                  <div className="text-sm text-gray-400">{pattern.description}</div>
                  <div className="text-xs text-purple-400 mt-1">📖 {pattern.source}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Prompt Flow */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-2">
              🤖 AI Prompt Flow
            </h3>
            <div className="space-y-2">
              {tutorial.promptFlow.map((step, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="bg-purple-500 text-sm w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Code Highlights */}
          <section>
            <h3 className="text-lg font-semibold text-purple-300 mb-2">
              💻 Key Implementation Details
            </h3>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              {tutorial.codeHighlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        /* Game Canvas */
        <div className="bg-black/30 rounded-xl p-4 min-h-[500px]">
          {children}
        </div>
      )}

      {/* Win Condition */}
      <div className="mt-4 text-center text-sm text-gray-500">
        🏆 Win Condition: Check in-game instructions
      </div>
    </div>
  );
}
