'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('rabbit-says')!;

const tutorial = {
  overview: 'Simon Says but with the White Rabbit! Listen to his frantic commands and press the right buttons.',
  promptFlow: ['Rabbit gives AI-generated commands', 'Player presses corresponding buttons', 'Speed increases each round', 'Miss a command and lose!'],
  codeHighlights: ['Neocortex AI for dynamic commands', 'Timed responses', 'Progressive difficulty'],
};

const ACTIONS = [
  { key: 'ArrowUp', label: '⬆️ UP', color: 'bg-blue-500' },
  { key: 'ArrowDown', label: '⬇️ DOWN', color: 'bg-green-500' },
  { key: 'ArrowLeft', label: '⬅️ LEFT', color: 'bg-yellow-500' },
  { key: 'ArrowRight', label: '➡️ RIGHT', color: 'bg-red-500' },
];

export default function RabbitSaysGame() {
  const [score, setScore] = useState(0);
  const [currentAction, setCurrentAction] = useState<number | null>(null);
  const [rabbitMessage, setRabbitMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);

  const getNextCommand = useCallback(async () => {
    const actionIndex = Math.floor(Math.random() * ACTIONS.length);
    setCurrentAction(actionIndex);
    
    try {
      const action = ACTIONS[actionIndex].label;
      const response = await chat(
        CHARACTERS.WHITE_RABBIT,
        `Give a quick, frantic command to press ${action}! Be rushed and anxious (1 short sentence).`,
        [],
        "You're playing Simon Says. Give urgent commands!"
      );
      setRabbitMessage(response.message);
    } catch {
      const fallbacks = [
        `Quick! Press ${ACTIONS[actionIndex].label}! I'm LATE!`,
        `${ACTIONS[actionIndex].label}! NOW! No time!`,
        `Hurry! ${ACTIONS[actionIndex].label}! The Queen awaits!`,
      ];
      setRabbitMessage(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
    }
    
    setTimeLeft(Math.max(1.5, 3 - score * 0.1));
    setWaitingForInput(true);
  }, [score]);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setRabbitMessage("Oh dear! Oh dear! Press the buttons I say! QUICKLY!");
    setTimeout(() => getNextCommand(), 2000);
  }, [getNextCommand]);

  useEffect(() => {
    if (!isPlaying || !waitingForInput) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          setGameOver(true);
          setIsPlaying(false);
          setWaitingForInput(false);
          setRabbitMessage("TOO SLOW! The Queen will have BOTH our heads! 😰");
          return 0;
        }
        return t - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, waitingForInput]);

  useEffect(() => {
    if (!isPlaying || !waitingForInput) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const pressedIndex = ACTIONS.findIndex(a => a.key === e.key);
      
      if (pressedIndex === currentAction) {
        setScore(s => s + 1);
        setWaitingForInput(false);
        setRabbitMessage("Yes! Good! But no time to celebrate!");
        setTimeout(() => getNextCommand(), 1000);
      } else if (pressedIndex !== -1) {
        setGameOver(true);
        setIsPlaying(false);
        setWaitingForInput(false);
        setRabbitMessage(`WRONG! I said ${ACTIONS[currentAction!].label}! Oh, we're doomed! 😱`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, waitingForInput, currentAction, getNextCommand]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-purple-400">Score: {score}</span>
          {waitingForInput && (
            <span className={`${timeLeft < 1 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
              Time: {timeLeft.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Rabbit */}
        <div className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl max-w-md">
          <span className="text-5xl">🐰</span>
          <p className="text-lg italic">{rabbitMessage}</p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <div />
          <div className={`w-20 h-20 rounded-xl ${ACTIONS[0].color} flex items-center justify-center text-3xl
            ${currentAction === 0 && waitingForInput ? 'animate-pulse ring-4 ring-white' : 'opacity-50'}`}>
            ⬆️
          </div>
          <div />
          <div className={`w-20 h-20 rounded-xl ${ACTIONS[2].color} flex items-center justify-center text-3xl
            ${currentAction === 2 && waitingForInput ? 'animate-pulse ring-4 ring-white' : 'opacity-50'}`}>
            ⬅️
          </div>
          <div className={`w-20 h-20 rounded-xl ${ACTIONS[1].color} flex items-center justify-center text-3xl
            ${currentAction === 1 && waitingForInput ? 'animate-pulse ring-4 ring-white' : 'opacity-50'}`}>
            ⬇️
          </div>
          <div className={`w-20 h-20 rounded-xl ${ACTIONS[3].color} flex items-center justify-center text-3xl
            ${currentAction === 3 && waitingForInput ? 'animate-pulse ring-4 ring-white' : 'opacity-50'}`}>
            ➡️
          </div>
        </div>

        {!isPlaying && (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
          >
            {gameOver ? 'Try Again' : 'Start Game'}
          </button>
        )}

        <div className="text-gray-400 text-sm">
          Press arrow keys when the Rabbit commands!
        </div>
      </div>
    </GameWrapper>
  );
}
