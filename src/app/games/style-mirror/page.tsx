'use client';

import { useState, useRef, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { createDecartClient, models } from '@decartai/sdk';

const game = getGameById('style-mirror')!;

const STYLES = [
  { name: 'Anime', prompt: 'Anime style, vibrant colors' },
  { name: 'Cyberpunk', prompt: 'Cyberpunk neon city aesthetic' },
  { name: 'Studio Ghibli', prompt: 'Studio Ghibli animation style' },
  { name: 'Oil Painting', prompt: 'Classical oil painting' },
  { name: 'Pixel Art', prompt: '8-bit pixel art retro game' },
  { name: 'Watercolor', prompt: 'Soft watercolor painting' },
  { name: 'Comic Book', prompt: 'Comic book pop art style' },
  { name: 'Neon Synthwave', prompt: 'Neon synthwave 80s aesthetic' },
];

const tutorial = {
  overview: 'Transform your webcam feed in real-time using Decart AI. Pick a style and watch yourself transform instantly!',
  promptFlow: ['Get Decart token', 'Access webcam', 'Connect to Decart realtime', 'Apply style transformations'],
  codeHighlights: ['WebRTC real-time video', 'Decart Mirage model', 'Live style switching'],
};

export default function StyleMirrorGame() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStyle, setCurrentStyle] = useState(STYLES[0]);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const transformedVideoRef = useRef<HTMLVideoElement>(null);
  const realtimeClientRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get ephemeral token from our API
      const tokenRes = await fetch('/api/decart-token', { method: 'POST' });
      if (!tokenRes.ok) throw new Error('Failed to get token');
      const { apiKey } = await tokenRes.json();
      
      // Get model specs
      const model = models.realtime('mirage_v2');
      
      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          frameRate: model.fps,
          width: model.width,
          height: model.height,
        },
        audio: false,
      });
      
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create Decart client and connect
      const client = createDecartClient({ apiKey });
      
      const realtimeClient = await client.realtime.connect(stream, {
        model,
        onRemoteStream: (transformedStream) => {
          if (transformedVideoRef.current) {
            transformedVideoRef.current.srcObject = transformedStream;
          }
        },
        initialState: {
          prompt: { text: currentStyle.prompt, enhance: true }
        }
      });
      
      realtimeClientRef.current = realtimeClient;
      setIsConnected(true);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsConnected(false);
  };

  const changeStyle = (style: typeof STYLES[0]) => {
    setCurrentStyle(style);
    if (realtimeClientRef.current) {
      realtimeClientRef.current.setPrompt(style.prompt);
    }
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Video displays */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-sm">
              Original
            </div>
          </div>
          
          <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden">
            <video 
              ref={transformedVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-sm">
              {currentStyle.name}
            </div>
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-gray-400">Transformed feed</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {!isConnected ? (
          <div className="text-center">
            <button
              onClick={connect}
              disabled={isConnecting}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 rounded-xl text-xl font-bold"
            >
              {isConnecting ? 'Connecting...' : '🎬 Start Camera'}
            </button>
            {error && (
              <p className="mt-4 text-red-400">{error}</p>
            )}
            <p className="mt-4 text-gray-400 text-sm">
              Powered by <span className="text-orange-400">Decart AI</span> real-time video transformation
            </p>
          </div>
        ) : (
          <>
            {/* Style selector */}
            <div className="grid grid-cols-4 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.name}
                  onClick={() => changeStyle(style)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    currentStyle.name === style.name
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
            
            <button
              onClick={disconnect}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </GameWrapper>
  );
}
