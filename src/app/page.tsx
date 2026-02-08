'use client';

import Link from 'next/link';
import { GAMES, getImplementedGames, getNeocortexGames } from '@/data/games';
import { useState } from 'react';

type FilterCategory = 'all' | 'classic' | 'puzzle' | 'action' | 'strategy' | 'ai-enhanced';

export default function Home() {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const implementedGames = getImplementedGames();
  const neocortexGames = getNeocortexGames();

  const filteredGames = filter === 'all' 
    ? implementedGames 
    : implementedGames.filter(g => g.category === filter);

  const categories: { value: FilterCategory; label: string; emoji: string }[] = [
    { value: 'all', label: 'All Games', emoji: '🎮' },
    { value: 'classic', label: 'Classic', emoji: '👾' },
    { value: 'puzzle', label: 'Puzzle', emoji: '🧩' },
    { value: 'action', label: 'Action', emoji: '⚡' },
    { value: 'strategy', label: 'Strategy', emoji: '♟️' },
    { value: 'ai-enhanced', label: 'AI Enhanced', emoji: '🤖' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Header */}
      <header className="p-8 text-center border-b border-purple-500/30">
        <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
          🕹️ Supercell AI Hackathon Arcade
        </h1>
        <p className="text-purple-300 text-lg">
          54 Browser Games • Classic Recreations • AI-Enhanced Experiences
        </p>
        <div className="mt-4 flex gap-4 justify-center text-sm">
          <span className="bg-green-500/20 px-3 py-1 rounded-full">
            ✅ {implementedGames.length} Playable
          </span>
          <span className="bg-purple-500/20 px-3 py-1 rounded-full">
            🤖 {neocortexGames.length} AI Games
          </span>
          <span className="bg-blue-500/20 px-3 py-1 rounded-full">
            📚 {GAMES.length} Total
          </span>
        </div>
      </header>

      {/* Category Filter */}
      <nav className="p-4 flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === cat.value
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </nav>

      {/* Game Grid */}
      <section className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {filteredGames.map(game => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
            >
              {/* Game Card */}
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-blue-600/20 flex items-center justify-center text-4xl">
                {game.category === 'classic' && '👾'}
                {game.category === 'puzzle' && '🧩'}
                {game.category === 'action' && '⚡'}
                {game.category === 'strategy' && '♟️'}
                {game.category === 'ai-enhanced' && '🤖'}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg group-hover:text-purple-300 transition-colors">
                  {game.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {game.description}
                </p>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {game.usesNeocortex && (
                    <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full">
                      🐰 {game.neocortexCharacter === 'WHITE_RABBIT' ? 'White Rabbit' : '😺 Cheshire Cat'}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    game.difficulty === 'easy' ? 'bg-green-500/30' :
                    game.difficulty === 'medium' ? 'bg-yellow-500/30' : 'bg-red-500/30'
                  }`}>
                    {game.difficulty}
                  </span>
                </div>
              </div>
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-2xl font-bold">▶ PLAY</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="p-8 text-center text-gray-500 border-t border-purple-500/30">
        <p>Supercell AI Game Hackathon 2026 • Feb 6-8</p>
        <p className="text-sm mt-2">
          Powered by <span className="text-purple-400">Neocortex AI</span> • Game patterns from Bjork & Holopainen (2005)
        </p>
      </footer>
    </main>
  );
}
