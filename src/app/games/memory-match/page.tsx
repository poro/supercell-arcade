'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('memory-match')!;

const tutorial = {
  overview: 'Classic memory matching game with a Wonderland twist! Find matching pairs of cards while the Cheshire Cat comments on your progress. Features timer and move counter for competitive play.',
  promptFlow: [
    'Generate shuffled card pairs with Wonderland themes',
    'Handle card flip and match detection',
    'Integrate Cheshire Cat commentary via Neocortex',
    'Track moves and time for scoring',
    'Celebrate wins with AI-generated messages',
  ],
  codeHighlights: [
    'Card shuffle using Fisher-Yates algorithm',
    'Flip animation using CSS transforms',
    'Match detection with flip buffer',
    'AI commentary adds personality',
  ],
};

const CARD_SYMBOLS = ['🐰', '😺', '🎩', '🍄', '👑', '🃏', '⏰', '🌹'];

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatchGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [catMessage, setCatMessage] = useState('');
  const [bestScore, setBestScore] = useState<number | null>(null);

  const initGame = useCallback(() => {
    const symbols = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
    const shuffled = symbols
      .map((symbol, i) => ({ id: i, symbol, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameOver(false);
    setTime(0);
    setIsPlaying(true);
    setCatMessage("Find all the pairs! I'll be watching... 😺");
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (!isPlaying || gameOver) return;
    
    const timer = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameOver]);

  const getCatComment = async (type: 'match' | 'miss' | 'win') => {
    try {
      const prompts = {
        match: "The player just found a matching pair in memory match! Give a short, playful congratulation (1 sentence, be mischievous).",
        miss: "The player flipped two non-matching cards. Give a short, teasing comment (1 sentence, be mysterious).",
        win: `The player won the memory game in ${moves} moves and ${time} seconds! Give an excited congratulation (1-2 sentences).`,
      };

      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        prompts[type],
        [],
        "You are the Cheshire Cat commenting on a memory matching game. Keep responses very short and playful."
      );
      setCatMessage(response.message);
    } catch {
      const fallbacks = {
        match: ["Well spotted!", "How curious you found that!", "Even I didn't see that coming... 😺"],
        miss: ["Not quite, dear...", "Memory is such a tricky thing!", "Try again, curious one!"],
        win: ["Magnificent! You've solved my puzzle!", "We're all impressed here... even me! 🎉"],
      };
      const options = fallbacks[type];
      setCatMessage(options[Math.floor(Math.random() * options.length)]);
    }
  };

  const handleCardClick = useCallback((cardId: number) => {
    if (!isPlaying || gameOver) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      
      const [first, second] = newFlipped;
      const card1 = newCards.find(c => c.id === first)!;
      const card2 = newCards.find(c => c.id === second)!;

      if (card1.symbol === card2.symbol) {
        // Match!
        setTimeout(() => {
          setCards(cards => cards.map(c => 
            c.id === first || c.id === second ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setMatches(m => {
            const newMatches = m + 1;
            if (newMatches === CARD_SYMBOLS.length) {
              setGameOver(true);
              setIsPlaying(false);
              getCatComment('win');
              setBestScore(b => b === null ? moves + 1 : Math.min(b, moves + 1));
            } else if (Math.random() > 0.7) {
              getCatComment('match');
            }
            return newMatches;
          });
        }, 300);
      } else {
        // No match
        setTimeout(() => {
          setCards(cards => cards.map(c => 
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          if (Math.random() > 0.7) {
            getCatComment('miss');
          }
        }, 1000);
      }
    }
  }, [cards, flippedCards, isPlaying, gameOver, moves]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {/* Stats */}
        <div className="flex gap-8 text-lg">
          <div className="text-center">
            <div className="text-gray-400">Moves</div>
            <div className="text-2xl font-bold text-blue-400">{moves}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Time</div>
            <div className="text-2xl font-bold text-green-400">{formatTime(time)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Pairs</div>
            <div className="text-2xl font-bold text-purple-400">{matches}/{CARD_SYMBOLS.length}</div>
          </div>
          {bestScore && (
            <div className="text-center">
              <div className="text-gray-400">Best</div>
              <div className="text-2xl font-bold text-yellow-400">{bestScore} moves</div>
            </div>
          )}
        </div>

        {/* Cat Message */}
        {catMessage && (
          <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-lg max-w-md">
            <span className="text-2xl">😺</span>
            <span className="italic text-purple-200">{catMessage}</span>
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-3">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched}
              className={`w-20 h-24 rounded-xl text-4xl font-bold transition-all duration-300 transform
                ${card.isFlipped || card.isMatched 
                  ? 'bg-purple-600 rotate-0' 
                  : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'}
                ${card.isMatched ? 'opacity-50 scale-95' : ''}
              `}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {card.isFlipped || card.isMatched ? card.symbol : '?'}
            </button>
          ))}
        </div>

        {/* Game Over */}
        {gameOver && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">🎉 You Won!</h2>
            <p className="text-gray-400 mb-4">
              Completed in {moves} moves and {formatTime(time)}
            </p>
            <button
              onClick={initGame}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-bold"
            >
              Play Again
            </button>
          </div>
        )}

        {!gameOver && (
          <button
            onClick={initGame}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
          >
            Restart
          </button>
        )}
      </div>
    </GameWrapper>
  );
}
