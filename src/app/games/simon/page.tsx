'use client';

import { useState, useCallback, useRef } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('simon')!;

const tutorial = {
  overview: 'Simon Says is a memory game where you must repeat an increasingly long sequence of colors. Watch the pattern, then click the colors in the same order. Each round adds one more to the sequence!',
  promptFlow: [
    'Generate random color sequence',
    'Play sequence with visual/audio feedback',
    'Accept player input and validate',
    'Add new color to sequence on success',
    'Track high score across attempts',
  ],
  codeHighlights: [
    'Web Audio API for tone generation',
    'Sequence playback with async timing',
    'Input validation matching sequence order',
    'Progressive difficulty with longer patterns',
  ],
};

const COLORS = [
  { id: 'green', bg: 'bg-green-500', active: 'bg-green-300', freq: 261.63 },
  { id: 'red', bg: 'bg-red-500', active: 'bg-red-300', freq: 329.63 },
  { id: 'yellow', bg: 'bg-yellow-500', active: 'bg-yellow-300', freq: 392.00 },
  { id: 'blue', bg: 'bg-blue-500', active: 'bg-blue-300', freq: 523.25 },
];

export default function SimonGame() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTone = useCallback((colorIndex: number, duration = 300) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = COLORS[colorIndex].freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const flashColor = useCallback((colorIndex: number): Promise<void> => {
    return new Promise(resolve => {
      setActiveColor(colorIndex);
      playTone(colorIndex);
      setTimeout(() => {
        setActiveColor(null);
        setTimeout(resolve, 200);
      }, 400);
    });
  }, [playTone]);

  const playSequence = useCallback(async (seq: number[]) => {
    setIsShowingSequence(true);
    await new Promise(r => setTimeout(r, 500));
    
    for (const colorIndex of seq) {
      await flashColor(colorIndex);
    }
    
    setIsShowingSequence(false);
    setIsPlaying(true);
  }, [flashColor]);

  const addToSequence = useCallback(() => {
    const newColor = Math.floor(Math.random() * 4);
    const newSequence = [...sequence, newColor];
    setSequence(newSequence);
    setPlayerIndex(0);
    playSequence(newSequence);
  }, [sequence, playSequence]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setSequence([]);
    setPlayerIndex(0);
    
    // Start with first color
    const firstColor = Math.floor(Math.random() * 4);
    const newSequence = [firstColor];
    setSequence(newSequence);
    playSequence(newSequence);
  }, [playSequence]);

  const handleColorClick = useCallback((colorIndex: number) => {
    if (!isPlaying || isShowingSequence) return;

    playTone(colorIndex, 200);
    setActiveColor(colorIndex);
    setTimeout(() => setActiveColor(null), 200);

    if (colorIndex === sequence[playerIndex]) {
      // Correct!
      if (playerIndex === sequence.length - 1) {
        // Completed sequence
        setIsPlaying(false);
        setScore(s => s + 1);
        setTimeout(addToSequence, 1000);
      } else {
        setPlayerIndex(i => i + 1);
      }
    } else {
      // Wrong!
      setIsPlaying(false);
      setGameOver(true);
      setHighScore(h => Math.max(h, score));
    }
  }, [isPlaying, isShowingSequence, sequence, playerIndex, score, addToSequence, playTone]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        {/* Scores */}
        <div className="flex gap-8 text-xl">
          <div className="text-center">
            <div className="text-gray-400">Round</div>
            <div className="text-3xl font-bold text-green-400">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Best</div>
            <div className="text-3xl font-bold text-yellow-400">{highScore}</div>
          </div>
        </div>

        {/* Status */}
        <div className="h-8 text-lg">
          {!gameStarted ? (
            <span className="text-gray-400">Press Start to begin!</span>
          ) : isShowingSequence ? (
            <span className="text-purple-400 animate-pulse">Watch the pattern...</span>
          ) : isPlaying ? (
            <span className="text-green-400">Your turn! ({playerIndex + 1}/{sequence.length})</span>
          ) : gameOver ? (
            <span className="text-red-400">Wrong! Game Over!</span>
          ) : (
            <span className="text-blue-400">Nice! Get ready...</span>
          )}
        </div>

        {/* Simon Board */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-full">
          {COLORS.map((color, i) => (
            <button
              key={color.id}
              onClick={() => handleColorClick(i)}
              disabled={!isPlaying || isShowingSequence}
              className={`w-32 h-32 rounded-full transition-all duration-100 
                ${i === 0 ? 'rounded-tl-[100px]' : ''}
                ${i === 1 ? 'rounded-tr-[100px]' : ''}
                ${i === 2 ? 'rounded-bl-[100px]' : ''}
                ${i === 3 ? 'rounded-br-[100px]' : ''}
                ${activeColor === i ? color.active + ' scale-105 shadow-lg' : color.bg}
                ${isPlaying && !isShowingSequence ? 'hover:brightness-110 cursor-pointer' : 'cursor-default'}
              `}
            />
          ))}
        </div>

        {/* Controls */}
        {!gameStarted || gameOver ? (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
          >
            {gameOver ? 'Try Again' : 'Start Game'}
          </button>
        ) : (
          <div className="h-14" /> 
        )}

        <div className="text-gray-500 text-sm">
          Watch the sequence, then repeat it by clicking the colors!
        </div>
      </div>
    </GameWrapper>
  );
}
