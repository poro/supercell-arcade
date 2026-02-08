'use client';

import { useEffect, useRef } from 'react';

export default function ArcadeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars/particles
    const particles: { x: number; y: number; speed: number; size: number; color: string }[] = [];
    const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0080', '#00ff80'];
    
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2,
        size: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Grid lines
    const gridOffset = { y: 0 };
    
    let frame = 0;
    
    function draw() {
      if (!ctx || !canvas) return;
      frame++;
      
      // Dark background with slight purple tint
      ctx.fillStyle = 'rgba(10, 5, 20, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Retro grid (bottom half, perspective)
      const horizon = canvas.height * 0.6;
      ctx.strokeStyle = `rgba(255, 0, 255, ${0.2 + Math.sin(frame * 0.02) * 0.1})`;
      ctx.lineWidth = 1;
      
      // Horizontal lines with perspective
      gridOffset.y = (gridOffset.y + 2) % 50;
      for (let i = 0; i < 20; i++) {
        const y = horizon + (i * 50 + gridOffset.y) * (1 + i * 0.1);
        if (y > canvas.height) continue;
        const alpha = 1 - (y - horizon) / (canvas.height - horizon);
        ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Vertical lines converging to center
      const centerX = canvas.width / 2;
      for (let i = -15; i <= 15; i++) {
        const spread = i * 100;
        ctx.strokeStyle = `rgba(0, 255, 255, 0.2)`;
        ctx.beginPath();
        ctx.moveTo(centerX + spread * 3, canvas.height);
        ctx.lineTo(centerX, horizon);
        ctx.stroke();
      }

      // Particles (neon stars)
      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }

        // Glow effect
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Pulsing sun/circle at horizon
      const sunRadius = 80 + Math.sin(frame * 0.03) * 10;
      const sunGradient = ctx.createRadialGradient(centerX, horizon, 0, centerX, horizon, sunRadius * 2);
      sunGradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
      sunGradient.addColorStop(0.5, 'rgba(255, 0, 100, 0.4)');
      sunGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(centerX, horizon, sunRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal stripe through sun
      for (let i = 0; i < 5; i++) {
        const stripeY = horizon - sunRadius + i * (sunRadius * 2 / 5) + 10;
        ctx.fillStyle = 'rgba(10, 5, 20, 0.8)';
        ctx.fillRect(centerX - sunRadius, stripeY, sunRadius * 2, 8);
      }

      // Side cabinet glows
      const cabinetGlow = (x: number, hue: number) => {
        const gradient = ctx.createRadialGradient(x, canvas.height * 0.5, 0, x, canvas.height * 0.5, 300);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.15)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 300, 0, 600, canvas.height);
      };
      
      cabinetGlow(50, (frame * 0.5) % 360);
      cabinetGlow(canvas.width - 50, (frame * 0.5 + 180) % 360);

      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas 
        ref={canvasRef}
        className="fixed inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, #0a0515, #1a0a2e, #0a0515)' }}
      />
      {/* CRT Scanlines overlay */}
      <div 
        className="fixed inset-0 -z-5 pointer-events-none opacity-30"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
      {/* Screen glow vignette */}
      <div 
        className="fixed inset-0 -z-5 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </>
  );
}
