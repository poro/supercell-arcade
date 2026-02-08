'use client';

import { useState, useRef, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('wonderland-adventure')!;

const tutorial = {
  overview: 'A text adventure set in Wonderland, powered by Neocortex AI. The Cheshire Cat serves as your narrator and guide, responding to your commands in character. Explore, solve puzzles, and find your way home!',
  promptFlow: [
    'Initialize game state with starting location and inventory',
    'Present scene description via Neocortex',
    'Parse player text commands (go, look, take, use, talk)',
    'Send action to AI with game context for response',
    'Update game state based on AI narrative',
  ],
  codeHighlights: [
    'Free-form text input parsed by AI',
    'Persistent game state (location, inventory, flags)',
    'Character-consistent narration from Cheshire Cat',
    'Win condition detection through conversation',
  ],
};

interface GameState {
  location: string;
  inventory: string[];
  visited: string[];
  flags: Record<string, boolean>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function WonderlandAdventureGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    location: 'forest-clearing',
    inventory: [],
    visited: ['forest-clearing'],
    flags: {},
  });
  const [won, setWon] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(text: string, isStart = false) {
    if (!text.trim() && !isStart) return;
    
    setIsLoading(true);
    
    const userMessage = isStart ? 'I just entered Wonderland. Describe where I am and what I see.' : text;
    
    const context = `
You are the Cheshire Cat narrating a text adventure in Wonderland.
Current Location: ${gameState.location}
Player Inventory: ${gameState.inventory.length > 0 ? gameState.inventory.join(', ') : 'empty'}
Places Visited: ${gameState.visited.join(', ')}
Game Flags: ${JSON.stringify(gameState.flags)}

LOCATIONS in Wonderland:
- forest-clearing: Where the player starts, has a mysterious door
- tea-party: The Mad Hatter's tea party, need invitation to enter
- mushroom-garden: Giant mushrooms, the Caterpillar lives here
- queen-court: The Queen of Hearts' domain, dangerous!
- rabbit-hole: The exit back home (win condition)

ITEMS that exist:
- invitation (at mushroom-garden, need to talk to Caterpillar)
- golden-key (at tea-party, Hatter gives it after a riddle)
- eat-me-cake (at forest-clearing, hidden under a rock)

WIN CONDITION: Player needs golden-key to unlock rabbit-hole and escape.

Respond in character as the mischievous Cheshire Cat. Be descriptive but concise (2-4 paragraphs max).
If the player tries to go somewhere or do something, describe the result.
If they found an item, mention they picked it up.
If they won, celebrate dramatically!
    `;

    try {
      const history: Message[] = isStart ? [] : messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        userMessage,
        history.slice(-10), // Keep last 10 messages for context
        context
      );

      const newMessages: Message[] = isStart 
        ? [{ role: 'assistant', content: response.message }]
        : [...messages, { role: 'user', content: text }, { role: 'assistant', content: response.message }];
      
      setMessages(newMessages);

      // Update game state based on keywords in response
      const lowerResponse = response.message.toLowerCase();
      const lowerInput = text.toLowerCase();

      // Location changes
      if (lowerInput.includes('go') || lowerInput.includes('enter') || lowerInput.includes('walk')) {
        if (lowerInput.includes('tea') || lowerInput.includes('party')) {
          setGameState(s => ({ ...s, location: 'tea-party', visited: [...new Set([...s.visited, 'tea-party'])] }));
        } else if (lowerInput.includes('mushroom') || lowerInput.includes('garden')) {
          setGameState(s => ({ ...s, location: 'mushroom-garden', visited: [...new Set([...s.visited, 'mushroom-garden'])] }));
        } else if (lowerInput.includes('queen') || lowerInput.includes('court')) {
          setGameState(s => ({ ...s, location: 'queen-court', visited: [...new Set([...s.visited, 'queen-court'])] }));
        } else if (lowerInput.includes('rabbit') || lowerInput.includes('hole')) {
          setGameState(s => ({ ...s, location: 'rabbit-hole', visited: [...new Set([...s.visited, 'rabbit-hole'])] }));
        } else if (lowerInput.includes('forest') || lowerInput.includes('clearing') || lowerInput.includes('back')) {
          setGameState(s => ({ ...s, location: 'forest-clearing' }));
        }
      }

      // Item pickups
      if (lowerResponse.includes('invitation') && lowerResponse.includes('pick')) {
        setGameState(s => ({ ...s, inventory: [...new Set([...s.inventory, 'invitation'])] }));
      }
      if (lowerResponse.includes('golden key') && (lowerResponse.includes('give') || lowerResponse.includes('receive') || lowerResponse.includes('take'))) {
        setGameState(s => ({ ...s, inventory: [...new Set([...s.inventory, 'golden-key'])] }));
      }
      if (lowerResponse.includes('cake') && lowerResponse.includes('pick')) {
        setGameState(s => ({ ...s, inventory: [...new Set([...s.inventory, 'eat-me-cake'])] }));
      }

      // Win detection
      if (lowerResponse.includes('escape') && lowerResponse.includes('wonderland') && gameState.inventory.includes('golden-key')) {
        setWon(true);
      }
      if (lowerResponse.includes('congratulations') || lowerResponse.includes('you win') || lowerResponse.includes('you\'ve escaped')) {
        setWon(true);
      }

    } catch (error) {
      console.error('Error:', error);
      const fallback: Message = {
        role: 'assistant',
        content: "*The Cheshire Cat's grin flickers in and out of existence* Something strange happened in Wonderland... The magic seems disrupted. Try again, curious one.",
      };
      setMessages(m => [...m, { role: 'user', content: text }, fallback]);
    }

    setIsLoading(false);
    setInput('');
  }

  async function startGame() {
    setGameStarted(true);
    setMessages([]);
    setGameState({
      location: 'forest-clearing',
      inventory: [],
      visited: ['forest-clearing'],
      flags: {},
    });
    setWon(false);
    await sendMessage('', true);
  }

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="max-w-3xl mx-auto">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🐱</div>
            <h2 className="text-3xl font-bold mb-4">Wonderland Text Adventure</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You've fallen down the rabbit hole! Navigate Wonderland, collect items,
              solve puzzles, and find your way home. The Cheshire Cat will be your 
              mysterious guide...
              <br /><br />
              <span className="text-purple-400">Powered by Neocortex AI</span>
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Begin Adventure
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            {/* Status Bar */}
            <div className="flex gap-4 mb-4 text-sm">
              <span className="bg-purple-500/20 px-3 py-1 rounded-full">
                📍 {gameState.location.replace('-', ' ')}
              </span>
              <span className="bg-blue-500/20 px-3 py-1 rounded-full">
                🎒 {gameState.inventory.length > 0 ? gameState.inventory.join(', ') : 'empty'}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-black/30 rounded-xl p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${msg.role === 'user' ? 'text-green-400' : 'text-purple-200'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="flex gap-2">
                      <span className="text-green-600">&gt;</span>
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <span className="text-2xl">😺</span>
                      <p className="italic whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 text-purple-400 animate-pulse">
                  <span className="text-2xl">😺</span>
                  <span className="italic">*the cat's grin shimmers thoughtfully...*</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!won ? (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isLoading && sendMessage(input)}
                  placeholder="What do you do? (go, look, take, talk, use...)"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-black/30 border border-purple-500/50 rounded-lg focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg font-bold"
                >
                  Enter
                </button>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎉 You Escaped Wonderland!</h2>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
                >
                  Play Again
                </button>
              </div>
            )}

            {/* Help */}
            <div className="mt-2 text-xs text-gray-500 text-center">
              Try commands like: "look around", "go to the tea party", "take the key", "talk to the caterpillar"
            </div>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
