'use client';

import { useState, useEffect, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('rabbit-timer')!;

const tutorial = {
  overview: 'Complete math challenges before the always-late White Rabbit says time is up!',
  promptFlow: ['Rabbit gives time warnings via AI', 'Solve math problems quickly', 'Each correct answer adds time', 'Survive as long as possible'],
  codeHighlights: ['Dynamic math generation', 'AI time pressure commentary', 'Progressive difficulty'],
};

export default function RabbitTimerGame() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [rabbitMessage, setRabbitMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const generateProblem = useCallback(() => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 10) + 1;
    let b = Math.floor(Math.random() * 10) + 1;
    
    if (op === '-' && b > a) [a, b] = [b, a];
    
    let answer = 0;
    switch (op) {
      case '+': answer = a + b; break;
      case '-': answer = a - b; break;
      case '*': answer = a * b; break;
    }
    
    setProblem({ a, b, op, answer });
    setUserAnswer('');
  }, []);

  const getRabbitComment = useCallback(async (type: 'start' | 'correct' | 'time') => {
    try {
      const prompts = {
        start: "The math race is starting! Give a frantic, time-obsessed encouragement (1 sentence).",
        correct: "The player got the answer right! React with hurried praise (1 sentence).",
        time: "Time is running low! Give an anxious time warning (1 sentence).",
      };
      const response = await chat(CHARACTERS.WHITE_RABBIT, prompts[type], [], "Be frantic about time!");
      setRabbitMessage(response.message);
    } catch {
      const fallbacks = {
        start: "Quick quick! The numbers await and I'm LATE!",
        correct: "Yes yes! But no time to celebrate - MORE!",
        time: "Oh dear! The clock is ticking FASTER!",
      };
      setRabbitMessage(fallbacks[type]);
    }
  }, []);

  const startGame = useCallback(async () => {
    setScore(0);
    setTimeLeft(10);
    setGameOver(false);
    setIsPlaying(true);
    generateProblem();
    await getRabbitComment('start');
  }, [generateProblem, getRabbitComment]);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true);
          setIsPlaying(false);
          setRabbitMessage("TOO LATE! We're all DOOMED! 😱");
          return 0;
        }
        if (t === 5) getRabbitComment('time');
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, getRabbitComment]);

  const checkAnswer = () => {
    if (parseInt(userAnswer) === problem.answer) {
      setScore(s => s + 1);
      setTimeLeft(t => Math.min(15, t + 3));
      generateProblem();
      if (Math.random() > 0.5) getRabbitComment('correct');
    }
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-purple-400">Score: {score}</span>
          <span className={`${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
            ⏱️ {timeLeft}s
          </span>
        </div>

        {/* Rabbit */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl max-w-md">
          <span className="text-4xl">🐰</span>
          <p className="italic">{rabbitMessage || "Ready to race against time?"}</p>
        </div>

        {isPlaying ? (
          <>
            {/* Problem */}
            <div className="text-6xl font-bold">
              {problem.a} {problem.op} {problem.b} = ?
            </div>

            {/* Input */}
            <input
              type="number"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && checkAnswer()}
              className="w-32 text-4xl text-center px-4 py-2 bg-black/30 border-2 border-purple-500 rounded-xl"
              autoFocus
            />

            <button
              onClick={checkAnswer}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-xl text-xl font-bold"
            >
              Submit
            </button>
          </>
        ) : (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
          >
            {gameOver ? `Score: ${score} - Try Again` : 'Start Race!'}
          </button>
        )}
      </div>
    </GameWrapper>
  );
}
