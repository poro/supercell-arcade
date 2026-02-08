'use client';

import { useState } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('escape-wonderland')!;

const tutorial = {
  overview: 'Solve AI-generated puzzles to escape Wonderland! The White Rabbit poses challenges you must overcome.',
  promptFlow: ['AI generates unique puzzles', 'Player submits answers', 'AI evaluates solutions', 'Progress through rooms'],
  codeHighlights: ['Dynamic puzzle generation', 'Natural language evaluation', 'Progressive difficulty'],
};

export default function EscapeWonderlandGame() {
  const [room, setRoom] = useState(1);
  const [puzzle, setPuzzle] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const TOTAL_ROOMS = 5;

  const getPuzzle = async (roomNum: number) => {
    setIsLoading(true);
    setFeedback('');
    setAnswer('');
    
    try {
      const difficulty = ['simple', 'moderate', 'challenging', 'tricky', 'devious'][roomNum - 1];
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        `Give me a ${difficulty} riddle or puzzle for room ${roomNum} of an escape room. Make it solvable with one word or short phrase. Be in character!`,
        [],
        "You're running an escape room in Wonderland. Give fun, solvable puzzles."
      );
      setPuzzle(response.message);
    } catch {
      const fallbacks = [
        "What has hands but can't clap? (Hint: tick tock!)",
        "I'm always running but never move. What am I? (Hint: look at my pocket!)",
        "The more you take, the more you leave behind. What are they?",
        "What can travel around the world while staying in a corner?",
        "I speak without a mouth and hear without ears. What am I?",
      ];
      setPuzzle(fallbacks[roomNum - 1] || fallbacks[0]);
    }
    
    setIsLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        `The puzzle was: "${puzzle}". The player answered: "${answer}". Is this correct or close enough? React in character (excited if right, give a hint if wrong). Say "CORRECT" clearly if they got it.`,
        [],
        "Be generous in accepting answers. If they're close, count it!"
      );
      
      const isCorrect = /correct|right|yes|exactly|got it/i.test(response.message);
      setFeedback(response.message);
      
      if (isCorrect) {
        if (room >= TOTAL_ROOMS) {
          setWon(true);
        } else {
          setTimeout(() => {
            setRoom(r => r + 1);
            getPuzzle(room + 1);
          }, 2000);
        }
      }
    } catch {
      setFeedback("Hmm, the magic seems disrupted. Try again!");
    }
    
    setIsLoading(false);
  };

  const startGame = async () => {
    setGameStarted(true);
    setRoom(1);
    setWon(false);
    await getPuzzle(1);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="max-w-xl mx-auto">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🚪</div>
            <h2 className="text-3xl font-bold mb-4">Escape Wonderland</h2>
            <p className="text-gray-400 mb-8">
              Solve 5 puzzles to find your way home!
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
        ) : won ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-400">You Escaped!</h2>
            <p className="text-gray-400 mb-8">You solved all 5 puzzles and found your way home!</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex justify-between items-center">
              <span className="text-purple-400">Room {room} of {TOTAL_ROOMS}</span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_ROOMS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-2 rounded ${i < room ? 'bg-green-500' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>

            {/* Puzzle */}
            <div className="bg-black/30 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🐰</span>
                <div>
                  <h3 className="text-lg font-bold text-purple-300 mb-2">The White Rabbit says:</h3>
                  {isLoading && !puzzle ? (
                    <p className="italic text-gray-400 animate-pulse">Preparing the puzzle...</p>
                  ) : (
                    <p className="text-lg">{puzzle}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Answer input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                placeholder="Your answer..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-black/30 border border-purple-500/50 rounded-lg"
              />
              <button
                onClick={submitAnswer}
                disabled={isLoading || !answer.trim()}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg font-bold"
              >
                {isLoading ? '...' : 'Submit'}
              </button>
            </div>

            {/* Feedback */}
            {feedback && (
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="italic">{feedback}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
