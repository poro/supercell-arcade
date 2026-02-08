'use client';

import { useState, useRef } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('reaction-test')!;

const tutorial = {
  overview: 'Test your reaction speed! Wait for the screen to turn green, then click as fast as you can.',
  promptFlow: ['Wait for random delay', 'Show green signal', 'Measure click time', 'Track best times'],
  codeHighlights: ['High-precision timing with performance.now()', 'Random delay to prevent anticipation'],
};

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'early';

export default function ReactionTestGame() {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reactionTime, setReactionTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const startTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = () => {
    setPhase('ready');
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      startTime.current = performance.now();
      setPhase('go');
    }, delay);
  };

  const handleClick = () => {
    if (phase === 'waiting' || phase === 'result' || phase === 'early') {
      startTest();
    } else if (phase === 'ready') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase('early');
    } else if (phase === 'go') {
      const time = Math.round(performance.now() - startTime.current);
      setReactionTime(time);
      setTimes(t => [...t, time]);
      setBestTime(b => b === null ? time : Math.min(b, time));
      setPhase('result');
    }
  };

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;

  const bgColor = {
    waiting: 'bg-blue-600',
    ready: 'bg-red-600',
    go: 'bg-green-500',
    result: 'bg-blue-600',
    early: 'bg-yellow-600',
  }[phase];

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-8 text-lg">
          {bestTime && <span className="text-green-400">Best: {bestTime}ms</span>}
          {avg && <span className="text-blue-400">Average: {avg}ms</span>}
          <span className="text-gray-400">Attempts: {times.length}</span>
        </div>

        <button
          onClick={handleClick}
          className={`w-80 h-80 rounded-2xl text-center transition-colors ${bgColor}`}
        >
          <div className="text-2xl font-bold mb-2">
            {phase === 'waiting' && 'Click to Start'}
            {phase === 'ready' && 'Wait for green...'}
            {phase === 'go' && 'CLICK NOW!'}
            {phase === 'result' && `${reactionTime}ms`}
            {phase === 'early' && 'Too early!'}
          </div>
          <div className="text-lg opacity-75">
            {phase === 'result' && 'Click to try again'}
            {phase === 'early' && 'Click to try again'}
          </div>
        </button>

        <div className="text-gray-400 text-sm">
          {reactionTime > 0 && reactionTime < 200 && '⚡ Incredible!'}
          {reactionTime >= 200 && reactionTime < 250 && '🔥 Very fast!'}
          {reactionTime >= 250 && reactionTime < 350 && '👍 Good'}
          {reactionTime >= 350 && '🐢 Keep practicing!'}
        </div>
      </div>
    </GameWrapper>
  );
}
