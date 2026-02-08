'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('rhythm-game')!;

const tutorial = {
  overview: 'Hit the notes as they reach the target line! Time your key presses to the beat.',
  promptFlow: ['Notes fall from top', 'Press matching key at target line', 'Score based on timing', 'Combo multiplier'],
  codeHighlights: ['Timing window detection', 'Combo system', 'Score multiplier'],
};

interface Note { lane: number; y: number; hit: boolean; }

export default function RhythmGame() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState('');
  const notesRef = useRef<Note[]>([]);

  const LANES = ['d', 'f', 'j', 'k'];
  const TARGET_Y = 400;
  const HIT_WINDOW = 30;

  const startGame = useCallback(() => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setNotes([]);
    notesRef.current = [];
    setGameStarted(true);
    setGameOver(false);
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Spawn notes
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        const lane = Math.floor(Math.random() * 4);
        const newNote = { lane, y: 0, hit: false };
        notesRef.current = [...notesRef.current, newNote];
      }
    }, 400);

    // Update notes
    const updateInterval = setInterval(() => {
      notesRef.current = notesRef.current.map(note => ({
        ...note,
        y: note.y + 5,
      })).filter(note => {
        if (note.y > 450 && !note.hit) {
          setCombo(0);
          setFeedback('MISS');
          setTimeout(() => setFeedback(''), 300);
          return false;
        }
        return note.y < 500;
      });
      setNotes([...notesRef.current]);
    }, 20);

    // Game timer
    const endTimer = setTimeout(() => {
      setGameOver(true);
    }, 30000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(updateInterval);
      clearTimeout(endTimer);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const lane = LANES.indexOf(e.key.toLowerCase());
      if (lane === -1) return;

      const hitNote = notesRef.current.find(
        note => note.lane === lane && !note.hit && Math.abs(note.y - TARGET_Y) < HIT_WINDOW
      );

      if (hitNote) {
        hitNote.hit = true;
        const distance = Math.abs(hitNote.y - TARGET_Y);
        let points = 100;
        let fb = 'PERFECT!';
        
        if (distance > 15) { points = 50; fb = 'GOOD'; }
        if (distance > 25) { points = 25; fb = 'OK'; }

        setScore(s => s + points * (1 + Math.floor(combo / 10)));
        setCombo(c => {
          const newCombo = c + 1;
          setMaxCombo(m => Math.max(m, newCombo));
          return newCombo;
        });
        setFeedback(fb);
        setTimeout(() => setFeedback(''), 200);
      } else {
        setCombo(0);
        setFeedback('MISS');
        setTimeout(() => setFeedback(''), 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, combo]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-purple-400">Score: {score}</span>
          <span className="text-yellow-400">Combo: {combo}x</span>
        </div>

        <div className="relative w-80 h-[450px] bg-gray-900 rounded-xl overflow-hidden">
          {/* Lanes */}
          <div className="absolute inset-0 flex">
            {LANES.map((key, i) => (
              <div key={i} className="flex-1 border-r border-gray-700 relative">
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-14 h-14 border-2 border-white/30 rounded-lg" />
                <div className="absolute bottom-0 w-full text-center text-gray-500 py-2 text-xl font-bold">
                  {key.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          {/* Target line */}
          <div className="absolute bottom-14 left-0 right-0 h-1 bg-white/50" />

          {/* Notes */}
          {notes.map((note, i) => !note.hit && (
            <div
              key={i}
              className="absolute w-14 h-8 bg-purple-500 rounded-lg"
              style={{
                left: `${note.lane * 80 + 3}px`,
                top: `${note.y}px`,
              }}
            />
          ))}

          {/* Feedback */}
          {feedback && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold
              ${feedback === 'PERFECT!' ? 'text-yellow-400' : 
                feedback === 'GOOD' ? 'text-green-400' : 
                feedback === 'OK' ? 'text-blue-400' : 'text-red-400'}`}>
              {feedback}
            </div>
          )}

          {/* Start/End overlay */}
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4">🎵 Rhythm Tap</h2>
              <p className="text-gray-400 mb-4">Press D F J K</p>
              <button onClick={startGame} className="px-6 py-3 bg-purple-500 rounded-lg">Start</button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-2">Time's Up!</h2>
              <p className="text-xl">Score: {score}</p>
              <p className="text-gray-400 mb-4">Max Combo: {maxCombo}x</p>
              <button onClick={startGame} className="px-6 py-3 bg-purple-500 rounded-lg">Play Again</button>
            </div>
          )}
        </div>
      </div>
    </GameWrapper>
  );
}
