'use client';

import { useState } from 'react';
import { Game, GameDesignPattern } from '@/data/games';
import dynamic from 'next/dynamic';

// Dynamically import Mermaid to avoid SSR issues
const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), { 
  ssr: false,
  loading: () => <div className="h-48 bg-black/20 rounded-lg animate-pulse" />
});

interface GameWrapperProps {
  game: Game;
  children: React.ReactNode;
  tutorial: {
    overview: string;
    howToPlay?: string[];
    promptFlow: string[];
    codeHighlights: string[];
    winCondition?: string;
    techStack?: string[];
  };
}

// Generate pattern diagram based on game patterns
function generatePatternDiagram(patterns: GameDesignPattern[]): string {
  const patternNodes = patterns.map((p, i) => {
    const id = p.name.replace(/[^a-zA-Z]/g, '');
    return `    ${id}["${p.name}"]`;
  }).join('\n');
  
  const patternConnections = patterns.map((p, i) => {
    const id = p.name.replace(/[^a-zA-Z]/g, '');
    return `    GAME --> ${id}`;
  }).join('\n');

  return `flowchart TB
    subgraph PATTERNS["🎯 Game Design Patterns"]
${patternNodes}
    end
    
    GAME(("🎮 Game"))
${patternConnections}
    
    style GAME fill:#a855f7,stroke:#7c3aed,color:#fff
    style PATTERNS fill:#1e1b4b,stroke:#6366f1`;
}

// Generate architecture diagram
function generateArchitectureDiagram(game: Game): string {
  const hasAI = game.usesNeocortex || game.usesDecart;
  const aiCharacter = game.neocortexCharacter === 'WHITE_RABBIT' ? '🐰 White Rabbit' : '😺 Cheshire Cat';
  
  let diagram = `flowchart LR
    subgraph CLIENT["🖥️ Browser"]
        UI["React UI"]
        STATE["Game State"]
        RENDER["Canvas/DOM"]
    end
    
    UI --> STATE
    STATE --> RENDER
    RENDER --> UI`;

  if (game.usesNeocortex) {
    diagram += `
    
    subgraph AI["🧠 Neocortex AI"]
        CHAR["${aiCharacter}"]
        NPC["NPC Behavior"]
    end
    
    STATE <--> |"API Call"| CHAR
    CHAR --> NPC`;
  }
  
  if (game.usesDecart) {
    diagram += `
    
    subgraph DECART["🎬 Decart"]
        VIDEO["Real-time Video"]
        STYLE["Style Transform"]
    end
    
    CLIENT <--> |"WebRTC"| VIDEO
    VIDEO --> STYLE`;
  }

  diagram += `
    
    style CLIENT fill:#1e1b4b,stroke:#6366f1
    style UI fill:#a855f7,stroke:#7c3aed,color:#fff
    style STATE fill:#6366f1,stroke:#4f46e5,color:#fff
    style RENDER fill:#ec4899,stroke:#db2777,color:#fff`;
    
  if (game.usesNeocortex) {
    diagram += `
    style AI fill:#1e1b4b,stroke:#a855f7
    style CHAR fill:#a855f7,stroke:#7c3aed,color:#fff`;
  }
  
  if (game.usesDecart) {
    diagram += `
    style DECART fill:#1e1b4b,stroke:#f97316
    style VIDEO fill:#f97316,stroke:#ea580c,color:#fff`;
  }
  
  return diagram;
}

// Generate game loop diagram
function generateGameLoopDiagram(): string {
  return `flowchart TB
    INPUT["⌨️ Player Input"] --> UPDATE["🔄 Update State"]
    UPDATE --> LOGIC["🧠 Game Logic"]
    LOGIC --> CHECK{"Win/Lose?"}
    CHECK -->|"No"| RENDER["🎨 Render"]
    CHECK -->|"Yes"| END["🏆 End Game"]
    RENDER --> INPUT
    
    style INPUT fill:#22c55e,stroke:#16a34a,color:#fff
    style UPDATE fill:#6366f1,stroke:#4f46e5,color:#fff
    style LOGIC fill:#a855f7,stroke:#7c3aed,color:#fff
    style CHECK fill:#f59e0b,stroke:#d97706,color:#fff
    style RENDER fill:#ec4899,stroke:#db2777,color:#fff
    style END fill:#ef4444,stroke:#dc2626,color:#fff`;
}

export default function GameWrapper({ game, children, tutorial }: GameWrapperProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'architecture' | 'code'>('overview');

  const tabs = [
    { id: 'overview', label: '📖 Overview', icon: '📖' },
    { id: 'patterns', label: '🎯 Patterns', icon: '🎯' },
    { id: 'architecture', label: '🏗️ Architecture', icon: '🏗️' },
    { id: 'code', label: '💻 Code', icon: '💻' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Game Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <p className="text-purple-300 mt-1">{game.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.usesNeocortex && (
              <span className="text-sm bg-purple-500/30 px-3 py-1 rounded-full border border-purple-500/50">
                🧠 Neocortex: {game.neocortexCharacter === 'WHITE_RABBIT' ? '🐰 White Rabbit' : '😺 Cheshire Cat'}
              </span>
            )}
            {game.usesDecart && (
              <span className="text-sm bg-orange-500/30 px-3 py-1 rounded-full border border-orange-500/50">
                🎬 Decart Video AI
              </span>
            )}
            <span className={`text-sm px-3 py-1 rounded-full border ${
              game.difficulty === 'easy' ? 'bg-green-500/30 border-green-500/50' :
              game.difficulty === 'medium' ? 'bg-yellow-500/30 border-yellow-500/50' : 
              'bg-red-500/30 border-red-500/50'
            }`}>
              {game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1)}
            </span>
            <span className="text-sm bg-blue-500/30 px-3 py-1 rounded-full border border-blue-500/50">
              {game.category}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all font-semibold shadow-lg shadow-purple-500/25"
        >
          {showTutorial ? '🎮 Play Game' : '📚 How It Works'}
        </button>
      </div>

      {/* Tutorial Panel */}
      {showTutorial ? (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/20 overflow-hidden mb-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-purple-500/20 bg-black/30">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎮</span> About This Game
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">{tutorial.overview}</p>
                </section>

                {tutorial.howToPlay && tutorial.howToPlay.length > 0 && (
                  <section>
                    <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🕹️</span> How to Play
                    </h3>
                    <ul className="space-y-2">
                      {tutorial.howToPlay.map((step, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="bg-purple-500/30 text-purple-300 text-sm w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-purple-500/50">
                            {i + 1}
                          </span>
                          <span className="text-gray-300">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {tutorial.winCondition && (
                  <section className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                      <span>🏆</span> Win Condition
                    </h3>
                    <p className="text-gray-300">{tutorial.winCondition}</p>
                  </section>
                )}

                {/* Game Loop Diagram */}
                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔄</span> Game Loop
                  </h3>
                  <MermaidDiagram chart={generateGameLoopDiagram()} />
                </section>
              </div>
            )}

            {/* Patterns Tab */}
            {activeTab === 'patterns' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎯</span> Design Patterns Visualization
                  </h3>
                  <MermaidDiagram chart={generatePatternDiagram(game.patterns)} />
                </section>

                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3">Pattern Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {game.patterns.map((pattern: GameDesignPattern, i: number) => (
                      <div key={i} className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                        <div className="font-bold text-lg text-white mb-1">{pattern.name}</div>
                        <div className="text-gray-300 mb-2">{pattern.description}</div>
                        <div className="text-xs text-purple-400 flex items-center gap-1">
                          <span>📖</span> {pattern.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="font-bold text-blue-400 mb-2">📚 About Game Design Patterns</h4>
                  <p className="text-gray-300 text-sm">
                    These patterns are from "Patterns in Game Design" by Björk & Holopainen (2005), 
                    a foundational text in game design that identifies reusable solutions to common 
                    game design challenges. Understanding these patterns helps create engaging, 
                    balanced gameplay experiences.
                  </p>
                </section>
              </div>
            )}

            {/* Architecture Tab */}
            {activeTab === 'architecture' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🏗️</span> System Architecture
                  </h3>
                  <MermaidDiagram chart={generateArchitectureDiagram(game)} />
                </section>

                {(game.usesNeocortex || game.usesDecart) && (
                  <section>
                    <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🤖</span> AI Integration Flow
                    </h3>
                    <div className="space-y-3">
                      {tutorial.promptFlow.map((step, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold shadow-lg">
                            {i + 1}
                          </div>
                          <div className="flex-1 bg-white/5 p-3 rounded-lg border border-white/10">
                            <span className="text-gray-200">{step}</span>
                          </div>
                          {i < tutorial.promptFlow.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-full bg-purple-500/30" />
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {tutorial.techStack && tutorial.techStack.length > 0 && (
                  <section>
                    <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🛠️</span> Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutorial.techStack.map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full border border-blue-500/30 text-sm">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xl font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-2xl">💻</span> Implementation Highlights
                  </h3>
                  <div className="space-y-3">
                    {tutorial.codeHighlights.map((highlight, i) => (
                      <div key={i} className="flex gap-3 items-start bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-green-400 text-lg">✓</span>
                        <span className="text-gray-200">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-gray-500 text-sm ml-2">game-logic.tsx</span>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{`// Core game state management
const [gameState, setGameState] = useState<GameState>({
  score: 0,
  level: 1,
  isPlaying: false,
});

// Game loop using requestAnimationFrame
useEffect(() => {
  if (!gameState.isPlaying) return;
  
  const gameLoop = () => {
    updateGameLogic();
    renderFrame();
    animationRef.current = requestAnimationFrame(gameLoop);
  };
  
  animationRef.current = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animationRef.current);
}, [gameState.isPlaying]);`}</code>
                  </pre>
                </section>

                {game.usesNeocortex && (
                  <section className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-500 text-sm ml-2">neocortex-integration.tsx</span>
                    </div>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{`// Neocortex AI character integration
import { chat, CHARACTERS } from '@/lib/neocortex';

const response = await chat(
  CHARACTERS.${game.neocortexCharacter || 'CHESHIRE_CAT'},
  playerInput,
  conversationHistory,
  systemPrompt
);

// Handle AI response
setDialogue(response.message);`}</code>
                    </pre>
                  </section>
                )}

                {game.usesDecart && (
                  <section className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-gray-500 text-sm ml-2">decart-integration.tsx</span>
                    </div>
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      <code>{`// Decart real-time video transformation
import { createDecartClient, models } from '@decartai/sdk';

const client = createDecartClient({ apiKey });
const realtimeClient = await client.realtime.connect(stream, {
  model: models.realtime('mirage_v2'),
  onRemoteStream: (transformed) => {
    videoElement.srcObject = transformed;
  },
  initialState: {
    prompt: { text: 'Anime style', enhance: true }
  }
});`}</code>
                    </pre>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Game Canvas */
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 min-h-[500px] border border-purple-500/20">
          {children}
        </div>
      )}
    </div>
  );
}
