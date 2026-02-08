'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('word-guess')!;

const tutorial = {
  overview: 'Classic hangman-style word guessing with the White Rabbit! Guess letters to reveal the hidden word before running out of attempts. The Rabbit gives hints and reacts to your guesses.',
  promptFlow: [
    'Select random word from themed list',
    'Track guessed letters and remaining attempts',
    'Integrate White Rabbit for hints via Neocortex',
    'Win by guessing word, lose at 6 wrong guesses',
  ],
  codeHighlights: [
    'Wonderland-themed word list',
    'Letter tracking with visual keyboard',
    'AI-powered hints from White Rabbit',
  ],
};

const WORDS = [
  'RABBIT', 'QUEEN', 'WONDERLAND', 'MUSHROOM', 'TEAPOT', 'CHESHIRE', 
  'CROQUET', 'FLAMINGO', 'CATERPILLAR', 'DORMOUSE', 'HATTER', 'MARCH',
  'CARDS', 'GARDEN', 'CLOCK', 'POCKET', 'HOLE', 'CURIOUS', 'LATE'
];

export default function WordGuessGame() {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [rabbitMessage, setRabbitMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const maxWrong = 6;

  const startGame = useCallback(() => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(newWord);
    setGuessed(new Set());
    setWrongGuesses(0);
    setGameOver(false);
    setWon(false);
    setRabbitMessage("Oh dear! Guess the word before I'm too late! 🐰");
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const getRabbitHint = async () => {
    try {
      const revealed = word.split('').filter(l => guessed.has(l)).join('');
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        `Give a cryptic one-sentence hint about the word "${word}" without saying the word directly. The player has guessed these letters: ${revealed || 'none yet'}`,
        [],
        "You are the White Rabbit giving hints in a word guessing game. Be mysterious and hurried!"
      );
      setRabbitMessage(response.message);
    } catch {
      setRabbitMessage("The word relates to Wonderland... I'm too rushed to say more!");
    }
  };

  const guessLetter = useCallback((letter: string) => {
    if (gameOver || guessed.has(letter)) return;

    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      if (newWrong >= maxWrong) {
        setGameOver(true);
        setRabbitMessage(`Oh no! The word was "${word}"! I'm VERY late now! 😰`);
      }
    } else {
      // Check win
      if (word.split('').every(l => newGuessed.has(l))) {
        setWon(true);
        setGameOver(true);
        setRabbitMessage("Splendid! You got it! Now I must run! 🎉🐰");
      }
    }
  }, [word, guessed, wrongGuesses, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) {
        guessLetter(letter);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guessLetter]);

  const displayWord = word.split('').map(letter => 
    guessed.has(letter) ? letter : '_'
  ).join(' ');

  const keyboard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {/* Hangman visual */}
        <div className="text-6xl">
          {wrongGuesses === 0 && '😊'}
          {wrongGuesses === 1 && '😐'}
          {wrongGuesses === 2 && '😟'}
          {wrongGuesses === 3 && '😰'}
          {wrongGuesses === 4 && '😨'}
          {wrongGuesses === 5 && '😱'}
          {wrongGuesses >= 6 && '💀'}
        </div>

        <div className="text-xl">
          Attempts left: {'❤️'.repeat(maxWrong - wrongGuesses)}{'🖤'.repeat(wrongGuesses)}
        </div>

        {/* Word display */}
        <div className="text-4xl font-mono tracking-widest">
          {displayWord}
        </div>

        {/* Rabbit message */}
        {rabbitMessage && (
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg max-w-md">
            <span className="text-2xl">🐰</span>
            <span className="italic">{rabbitMessage}</span>
          </div>
        )}

        {/* Keyboard */}
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {keyboard.map(letter => (
            <button
              key={letter}
              onClick={() => guessLetter(letter)}
              disabled={guessed.has(letter) || gameOver}
              className={`w-10 h-10 rounded font-bold transition-all
                ${guessed.has(letter)
                  ? word.includes(letter) ? 'bg-green-600' : 'bg-red-600/50'
                  : 'bg-gray-600 hover:bg-gray-500'}
                ${gameOver ? 'opacity-50' : ''}
              `}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {!gameOver && (
            <button onClick={getRabbitHint} className="px-4 py-2 bg-purple-500 rounded-lg">
              🐰 Get Hint
            </button>
          )}
          <button onClick={startGame} className="px-4 py-2 bg-gray-600 rounded-lg">
            {gameOver ? 'Play Again' : 'New Word'}
          </button>
        </div>
      </div>
    </GameWrapper>
  );
}
