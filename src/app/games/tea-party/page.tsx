'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('tea-party')!;

const tutorial = {
  overview: 'Serve tea at the Mad Tea Party! The White Rabbit gives chaotic orders - fulfill them correctly!',
  promptFlow: ['AI generates random tea orders', 'Click ingredients to serve', 'Match orders correctly', 'Time pressure!'],
  codeHighlights: ['Neocortex for order generation', 'Ingredient combination system', 'Order validation'],
};

const INGREDIENTS = [
  { id: 'tea', emoji: '🍵', name: 'Tea' },
  { id: 'milk', emoji: '🥛', name: 'Milk' },
  { id: 'sugar', emoji: '🍬', name: 'Sugar' },
  { id: 'lemon', emoji: '🍋', name: 'Lemon' },
  { id: 'honey', emoji: '🍯', name: 'Honey' },
  { id: 'cookie', emoji: '🍪', name: 'Cookie' },
];

export default function TeaPartyGame() {
  const [score, setScore] = useState(0);
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [rabbitMessage, setRabbitMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const generateOrder = useCallback(async () => {
    const numItems = 2 + Math.floor(Math.random() * 2);
    const order: string[] = ['tea'];
    const available = INGREDIENTS.filter(i => i.id !== 'tea');
    
    for (let i = 0; i < numItems; i++) {
      const item = available[Math.floor(Math.random() * available.length)];
      if (!order.includes(item.id)) order.push(item.id);
    }
    
    setCurrentOrder(order);
    setSelectedItems([]);
    setTimeLeft(10 - Math.min(score * 0.5, 5));

    const orderNames = order.map(id => INGREDIENTS.find(i => i.id === id)?.name).join(', ');
    
    try {
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        `Order: ${orderNames}! Give a frantic, chaotic order for these items at a mad tea party (1 sentence, be rushed!).`,
        [],
        "You're a waiter at the Mad Tea Party. Be frantic!"
      );
      setRabbitMessage(response.message);
    } catch {
      setRabbitMessage(`Quick! I need ${orderNames}! The guests are waiting and I'm LATE!`);
    }
  }, [score]);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    generateOrder();
  }, [generateOrder]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          setGameOver(true);
          setIsPlaying(false);
          setRabbitMessage("TOO SLOW! The tea is cold! DISASTER! 😰");
          return 0;
        }
        return t - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const selectItem = (id: string) => {
    if (!isPlaying || selectedItems.includes(id)) return;
    setSelectedItems([...selectedItems, id]);
  };

  const serve = () => {
    if (!isPlaying) return;
    
    const correct = currentOrder.length === selectedItems.length && 
      currentOrder.every(id => selectedItems.includes(id));
    
    if (correct) {
      setScore(s => s + 1);
      setRabbitMessage("Perfect! But hurry, more orders! 🐰");
      setTimeout(() => generateOrder(), 1000);
    } else {
      setGameOver(true);
      setIsPlaying(false);
      setRabbitMessage("WRONG ORDER! The Queen will hear about this! 😱");
    }
  };

  const reset = () => setSelectedItems([]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-purple-400">Orders: {score}</span>
          {isPlaying && (
            <span className={`${timeLeft < 3 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              Time: {timeLeft.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Rabbit order */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl max-w-lg">
          <span className="text-4xl">🐰</span>
          <p className="italic">{rabbitMessage || "Welcome to the Mad Tea Party!"}</p>
        </div>

        {/* Current selection */}
        <div className="flex gap-2 h-16 items-center bg-gray-800 px-4 rounded-xl min-w-64 justify-center">
          {selectedItems.length === 0 ? (
            <span className="text-gray-500">Select items...</span>
          ) : (
            selectedItems.map(id => (
              <span key={id} className="text-3xl">
                {INGREDIENTS.find(i => i.id === id)?.emoji}
              </span>
            ))
          )}
        </div>

        {/* Ingredients */}
        <div className="flex gap-2 flex-wrap justify-center">
          {INGREDIENTS.map(ing => (
            <button
              key={ing.id}
              onClick={() => selectItem(ing.id)}
              disabled={!isPlaying || selectedItems.includes(ing.id)}
              className={`w-16 h-16 rounded-xl text-3xl transition-all
                ${selectedItems.includes(ing.id) ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}
                disabled:opacity-50
              `}
            >
              {ing.emoji}
            </button>
          ))}
        </div>

        {/* Actions */}
        {isPlaying && (
          <div className="flex gap-4">
            <button onClick={reset} className="px-4 py-2 bg-gray-600 rounded-lg">
              Reset
            </button>
            <button onClick={serve} className="px-6 py-2 bg-green-500 rounded-lg font-bold">
              SERVE! 🫖
            </button>
          </div>
        )}

        {!isPlaying && (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
          >
            {gameOver ? 'Try Again' : 'Start Tea Party!'}
          </button>
        )}
      </div>
    </GameWrapper>
  );
}
