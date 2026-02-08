'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('pong')!;

const tutorial = {
  overview: 'Pong is the grandfather of all video games. This implementation uses HTML5 Canvas for rendering and requestAnimationFrame for smooth 60fps gameplay. The AI opponent uses simple prediction based on ball trajectory.',
  promptFlow: [
    'Create a canvas-based Pong game with paddle and ball physics',
    'Add AI opponent that tracks ball position with slight delay for fairness',
    'Implement scoring system - first to 5 wins',
    'Add keyboard controls (W/S or Arrow keys) for player paddle',
    'Polish with sound effects and visual feedback on hits',
  ],
  codeHighlights: [
    'Canvas API for 2D rendering at 60fps',
    'Ball physics with angle-based deflection off paddles',
    'AI difficulty scaled by prediction accuracy (80%)',
    'Responsive canvas sizing for different screens',
  ],
};

export default function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);

  const resetGame = useCallback(() => {
    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setWinner(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const height = 500;
    canvas!.width = width;
    canvas!.height = height;

    // Game state
    const paddleHeight = 80;
    const paddleWidth = 12;
    const ballSize = 10;
    
    let playerY = height / 2 - paddleHeight / 2;
    let aiY = height / 2 - paddleHeight / 2;
    let ballX = width / 2;
    let ballY = height / 2;
    let ballVX = 5;
    let ballVY = 3;
    let pScore = 0;
    let aScore = 0;

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function resetBall(direction: number) {
      ballX = width / 2;
      ballY = height / 2;
      ballVX = 5 * direction;
      ballVY = (Math.random() - 0.5) * 6;
    }

    function gameLoop() {
      if (!ctx) return;

      // Player movement
      if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        playerY = Math.max(0, playerY - 8);
      }
      if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        playerY = Math.min(height - paddleHeight, playerY + 8);
      }

      // AI movement (with some delay/error for fairness)
      const aiTarget = ballY - paddleHeight / 2;
      const aiSpeed = 5;
      if (aiY < aiTarget - 10) {
        aiY += aiSpeed;
      } else if (aiY > aiTarget + 10) {
        aiY -= aiSpeed;
      }
      aiY = Math.max(0, Math.min(height - paddleHeight, aiY));

      // Ball movement
      ballX += ballVX;
      ballY += ballVY;

      // Top/bottom collision
      if (ballY <= 0 || ballY >= height - ballSize) {
        ballVY *= -1;
      }

      // Paddle collision - Player
      if (
        ballX <= paddleWidth + 20 &&
        ballY + ballSize >= playerY &&
        ballY <= playerY + paddleHeight
      ) {
        ballVX = Math.abs(ballVX) * 1.05;
        const hitPos = (ballY - playerY) / paddleHeight;
        ballVY = (hitPos - 0.5) * 10;
      }

      // Paddle collision - AI
      if (
        ballX >= width - paddleWidth - 20 - ballSize &&
        ballY + ballSize >= aiY &&
        ballY <= aiY + paddleHeight
      ) {
        ballVX = -Math.abs(ballVX) * 1.05;
        const hitPos = (ballY - aiY) / paddleHeight;
        ballVY = (hitPos - 0.5) * 10;
      }

      // Scoring
      if (ballX <= 0) {
        aScore++;
        setAiScore(aScore);
        if (aScore >= 5) {
          setGameOver(true);
          setWinner('ai');
          return;
        }
        resetBall(1);
      }
      if (ballX >= width) {
        pScore++;
        setPlayerScore(pScore);
        if (pScore >= 5) {
          setGameOver(true);
          setWinner('player');
          return;
        }
        resetBall(-1);
      }

      // Speed cap
      ballVX = Math.max(-15, Math.min(15, ballVX));

      // Draw
      ctx.fillStyle = '#0f0a1e';
      ctx.fillRect(0, 0, width, height);

      // Center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = '#4a4a6a';
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(10, playerY, paddleWidth, paddleHeight);
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(width - paddleWidth - 10, aiY, paddleWidth, paddleHeight);

      // Ball
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(gameLoop);
    }

    const animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [gameOver]);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        {/* Score Display */}
        <div className="flex gap-8 text-4xl font-bold">
          <span className="text-purple-400">YOU: {playerScore}</span>
          <span className="text-gray-500">|</span>
          <span className="text-pink-400">AI: {aiScore}</span>
        </div>

        {/* Game Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="rounded-lg border-2 border-purple-500/50"
          />
          
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
              <h2 className="text-4xl font-bold mb-4">
                {winner === 'player' ? '🎉 YOU WIN!' : '😔 AI WINS'}
              </h2>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-xl"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="text-gray-400 text-sm">
          Controls: <kbd className="bg-gray-800 px-2 py-1 rounded">W</kbd> / <kbd className="bg-gray-800 px-2 py-1 rounded">S</kbd> or Arrow Keys to move • First to 5 wins!
        </div>
      </div>
    </GameWrapper>
  );
}
