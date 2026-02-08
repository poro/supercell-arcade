'use client';

import { useState, useEffect, useRef } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS, getCharacterGreeting } from '@/lib/neocortex';

const game = getGameById('cheshire-riddles')!;

const tutorial = {
  overview: 'The Cheshire Cat poses riddles for you to solve. Using Neocortex AI, the cat generates unique riddles each game and evaluates your answers with cryptic, in-character responses. Race against time to solve as many as possible!',
  promptFlow: [
    'Initialize Neocortex with Cheshire Cat character ID',
    'Request a riddle with context about game state and difficulty',
    'Player submits answer via text input',
    'Send answer to Neocortex for in-character evaluation',
    'Parse response to determine if answer is correct, adjust score',
  ],
  codeHighlights: [
    'Real-time AI conversation via Neocortex API',
    'Character-consistent responses (mischievous, cryptic)',
    'Progressive difficulty based on player success',
    'Timer pressure adds urgency to puzzle-solving',
  ],
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function CheshireRiddlesGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [currentRiddle, setCurrentRiddle] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [riddleCount, setRiddleCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  async function startGame() {
    setGameStarted(true);
    setScore(0);
    setTimeLeft(120);
    setHistory([]);
    setRiddleCount(0);
    setGameOver(false);
    setFeedback('');
    
    await getNewRiddle([]);
  }

  async function getNewRiddle(currentHistory: Message[]) {
    setIsLoading(true);
    setAnswer('');
    setFeedback('');
    
    try {
      const prompt = riddleCount === 0 
        ? "Greet me mysteriously and give me a riddle to solve. Keep the riddle fairly short."
        : "Give me another riddle, different from before. Be playful and mischievous!";
      
      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        prompt,
        currentHistory,
        "You are playing a riddle game. Give creative, solvable riddles. After each riddle, wait for the player's answer."
      );
      
      setCurrentRiddle(response.message);
      setHistory([
        ...currentHistory,
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.message }
      ]);
      setRiddleCount(r => r + 1);
    } catch (error) {
      console.error('Neocortex error:', error);
      // Fallback riddles
      const fallbackRiddles = [
        "I have cities, but no houses live there. I have mountains, but no trees grow. I have water, but no fish swim. I have roads, but no cars drive. What am I? 🗺️",
        "The more you take, the more you leave behind. What am I? 👣",
        "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I? 🔊",
        "What has keys but no locks, space but no room, and you can enter but can't go inside? ⌨️",
        "I'm tall when I'm young, and short when I'm old. What am I? 🕯️",
      ];
      setCurrentRiddle(fallbackRiddles[riddleCount % fallbackRiddles.length]);
    }
    
    setIsLoading(false);
    inputRef.current?.focus();
  }

  async function submitAnswer() {
    if (!answer.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const prompt = `My answer to the riddle is: "${answer}". Is that correct? React in character - be amused, cryptic, or playful. Then clearly say if I'm RIGHT or WRONG.`;
      
      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        prompt,
        history,
        "Evaluate the player's answer. Include the word 'RIGHT' or 'CORRECT' if they got it, or 'WRONG' or 'INCORRECT' if not. Stay in character as the mischievous Cheshire Cat."
      );
      
      const isCorrect = /right|correct|yes|exactly|well done|brilliant/i.test(response.message);
      
      if (isCorrect) {
        setScore(s => s + 10);
        setTimeLeft(t => Math.min(120, t + 15)); // Bonus time
      }
      
      setFeedback(response.message);
      setHistory([
        ...history,
        { role: 'user', content: prompt },
        { role: 'assistant', content: response.message }
      ]);
      
      // Auto-get next riddle after delay
      setTimeout(() => {
        if (!gameOver) {
          getNewRiddle([
            ...history,
            { role: 'user', content: prompt },
            { role: 'assistant', content: response.message }
          ]);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error checking answer:', error);
      setFeedback("*the cat's grin flickers* Something strange happened in Wonderland... Try again?");
    }
    
    setIsLoading(false);
  }

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="max-w-2xl mx-auto">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">😺</div>
            <h2 className="text-3xl font-bold mb-4">Cheshire Cat's Riddles</h2>
            <p className="text-gray-400 mb-8">
              The mysterious cat has riddles for you. Solve as many as you can before time runs out!
              <br />
              <span className="text-purple-400">Powered by Neocortex AI</span>
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Enter Wonderland
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="flex justify-between items-center bg-black/30 p-4 rounded-lg">
              <div className="text-xl">
                <span className="text-purple-400">Score:</span> 
                <span className="font-bold ml-2">{score}</span>
              </div>
              <div className={`text-xl font-mono ${timeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                ⏱️ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xl">
                <span className="text-blue-400">Riddles:</span>
                <span className="font-bold ml-2">{riddleCount}</span>
              </div>
            </div>

            {/* Cheshire Cat */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-6 rounded-xl border border-purple-500/30">
              <div className="flex gap-4">
                <div className="text-5xl">😺</div>
                <div className="flex-1">
                  {isLoading && !currentRiddle ? (
                    <div className="animate-pulse text-purple-300">
                      *the cat's grin appears before the rest of him...*
                    </div>
                  ) : (
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                      {currentRiddle}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Answer Input */}
            {!gameOver && currentRiddle && !feedback && (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                  placeholder="Type your answer..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-black/30 border border-purple-500/50 rounded-lg focus:outline-none focus:border-purple-500 text-lg"
                />
                <button
                  onClick={submitAnswer}
                  disabled={isLoading || !answer.trim()}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg font-bold"
                >
                  {isLoading ? '...' : 'Answer'}
                </button>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div className="bg-black/30 p-4 rounded-lg border border-pink-500/30">
                <p className="text-pink-300 italic whitespace-pre-wrap">{feedback}</p>
                {!gameOver && (
                  <p className="text-gray-500 text-sm mt-2">Next riddle coming...</p>
                )}
              </div>
            )}

            {/* Game Over */}
            {gameOver && (
              <div className="text-center py-8 bg-black/50 rounded-xl">
                <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
                <p className="text-xl mb-4">
                  You solved <span className="text-purple-400 font-bold">{score / 10}</span> riddles!
                </p>
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
