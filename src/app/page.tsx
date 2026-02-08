'use client';

import Link from 'next/link';
import { GAMES, getImplementedGames, getNeocortexGames } from '@/data/games';
import { useState } from 'react';
import ArcadeBackground from '@/components/ArcadeBackground';

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
    <main className="min-h-screen text-white relative">
      {/* Animated Arcade Background */}
      <ArcadeBackground />

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 text-center">
        {/* Glowing badge */}
        <div className="inline-block mb-6 px-6 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full border border-pink-500/30 backdrop-blur-sm">
          <span className="text-pink-300 font-mono text-sm tracking-wider">
            SUPERCELL AI GAME HACK • FEB 6-8, 2026
          </span>
        </div>

        {/* Main title */}
        <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 drop-shadow-2xl">
            54 HOURS
          </span>
        </h1>
        <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
            54 GAMES
          </span>
        </h2>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-purple-200/80 max-w-2xl mx-auto px-4">
          Classic arcade recreations. AI-enhanced experiences.
          <br />
          <span className="text-pink-400">One hackathon. Zero sleep.</span>
        </p>

        {/* Stats row */}
        <div className="mt-10 flex flex-wrap gap-6 justify-center text-sm">
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-purple-500/30">
            <div className="text-3xl font-bold text-green-400">{implementedGames.length}</div>
            <div className="text-gray-400">Playable Games</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400">{neocortexGames.length}</div>
            <div className="text-gray-400">AI-Enhanced</div>
          </div>
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-purple-500/30">
            <div className="text-3xl font-bold text-cyan-400">3</div>
            <div className="text-gray-400">Sponsor APIs</div>
          </div>
        </div>

        {/* Tech badges */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center text-xs">
          <span className="px-3 py-1.5 bg-purple-600/30 rounded-full border border-purple-500/50">
            🧠 Neocortex AI
          </span>
          <span className="px-3 py-1.5 bg-orange-600/30 rounded-full border border-orange-500/50">
            🎬 Decart Video
          </span>
          <span className="px-3 py-1.5 bg-blue-600/30 rounded-full border border-blue-500/50">
            🤖 Reactor World
          </span>
          <span className="px-3 py-1.5 bg-green-600/30 rounded-full border border-green-500/50">
            🎮 Canvas Games
          </span>
        </div>
      </section>

      {/* Category Filter */}
      <nav className="sticky top-0 z-50 p-4 flex flex-wrap justify-center gap-2 bg-black/60 backdrop-blur-lg border-y border-purple-500/20">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-full transition-all ${
              filter === cat.value
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/50'
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </nav>

      {/* Game Grid */}
      <section className="p-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {filteredGames.map(game => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group relative bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-black/60 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30 border border-white/5 hover:border-purple-500/30"
            >
              {/* Game Card Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center text-5xl relative overflow-hidden">
                {game.category === 'classic' && '👾'}
                {game.category === 'puzzle' && '🧩'}
                {game.category === 'action' && '⚡'}
                {game.category === 'strategy' && '♟️'}
                {game.category === 'ai-enhanced' && '🤖'}
                
                {/* Scanline effect on card */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)',
                  }}
                />
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
                    <span className="text-xs bg-purple-500/40 px-2 py-0.5 rounded-full border border-purple-400/30">
                      {game.neocortexCharacter === 'WHITE_RABBIT' ? '🐰' : '😺'} AI
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    game.difficulty === 'easy' ? 'bg-green-500/30 border border-green-400/30' :
                    game.difficulty === 'medium' ? 'bg-yellow-500/30 border border-yellow-400/30' : 
                    'bg-red-500/30 border border-red-400/30'
                  }`}>
                    {game.difficulty}
                  </span>
                </div>
              </div>
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/80 to-purple-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-3xl font-black tracking-wider">▶ PLAY</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 p-8 text-center text-gray-400 border-t border-purple-500/20 bg-black/60 backdrop-blur-sm">
        <p className="text-lg font-semibold text-purple-300">
          Supercell AI Game Hackathon 2026
        </p>
        <p className="text-sm mt-1">
          February 6-8, 2026 • Abu Dhabi
        </p>
        <p className="text-xs mt-4">
          AI powered by <span className="text-purple-400">Neocortex</span> • 
          Background effects inspired by <span className="text-pink-400">Decart</span> • 
          Game patterns from <span className="text-cyan-400">Bjork & Holopainen</span>
        </p>
      </footer>
    </main>
  );
}
