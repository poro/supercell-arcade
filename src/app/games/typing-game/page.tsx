'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('typing-game')!;

const tutorial = {
  overview: 'Type falling words before they reach the bottom! Tests typing speed and accuracy.',
  promptFlow: ['Spawn words at top', 'Player types to eliminate', 'Words fall down over time'],
  codeHighlights: ['Real-time input matching', 'Word queue management', 'Difficulty scaling'],
};

const WORDS = ['rabbit', 'queen', 'wonder', 'tea', 'hat', 'cat', 'clock', 'card', 'garden', 'mushroom', 'late', 'curious', 'dream', 'fall', 'door', 'key', 'cake', 'drink', 'small', 'big'];

interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
}

export default function TypingGame() {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordIdRef = useRef(0);

  const startGame = useCallback(() => {
    setWords([]);
    setInput('');
    setScore(0);
    setLives(3);
    setIsPlaying(true);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      const word = WORDS[Math.floor(Math.random() * WORDS.length)];
      setWords(w => [...w, {
        id: wordIdRef.current++,
        word,
        x: 50 + Math.random() * 400,
        y: 0,
      }]);
    }, 2000 - Math.min(score * 50, 1500));

    const fallInterval = setInterval(() => {
      setWords(w => {
        const updated = w.map(word => ({ ...word, y: word.y + 2 }));
        const escaped = updated.filter(word => word.y > 350);
        if (escaped.length > 0) {
          setLives(l => {
            const newLives = l - escaped.length;
            if (newLives <= 0) setIsPlaying(false);
            return Math.max(0, newLives);
          });
        }
        return updated.filter(word => word.y <= 350);
      });
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(fallInterval);
    };
  }, [isPlaying, score]);

  const handleInput = (value: string) => {
    setInput(value);
    
    const matchIndex = words.findIndex(w => w.word.toLowerCase() === value.toLowerCase());
    if (matchIndex !== -1) {
      setWords(w => w.filter((_, i) => i !== matchIndex));
      setScore(s => s + 1);
      setInput('');
    }
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-green-400">Score: {score}</span>
          <span className="text-red-400">Lives: {'❤️'.repeat(lives)}</span>
        </div>

        <div className="relative w-[500px] h-[400px] bg-gray-800 rounded-xl overflow-hidden">
          {words.map(word => (
            <div
              key={word.id}
              className="absolute text-xl font-mono text-white"
              style={{ left: word.x, top: word.y }}
            >
              {word.word}
            </div>
          ))}

          {!isPlaying && lives > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <h2 className="text-2xl font-bold mb-4">⌨️ Typing Game</h2>
              <button onClick={startGame} className="px-6 py-3 bg-green-500 rounded-lg">Start</button>
            </div>
          )}

          {!isPlaying && lives === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-xl mb-4">Score: {score}</p>
              <button onClick={startGame} className="px-6 py-3 bg-purple-500 rounded-lg">Try Again</button>
            </div>
          )}
        </div>

        {isPlaying && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => handleInput(e.target.value)}
            className="px-4 py-2 bg-gray-700 rounded-lg text-xl w-64 text-center"
            placeholder="Type words here..."
            autoFocus
          />
        )}
      </div>
    </GameWrapper>
  );
}
