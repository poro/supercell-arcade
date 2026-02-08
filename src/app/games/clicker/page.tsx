'use client';

import { useState, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('clicker')!;

const tutorial = {
  overview: 'Cookie Clicker-style idle game! Click to earn cookies, buy upgrades to earn more per click and per second. Watch your cookie empire grow exponentially!',
  promptFlow: [
    'Click button to earn base currency',
    'Implement upgrade shop with scaling costs',
    'Add passive income from buildings',
    'Track total cookies and rate calculations',
  ],
  codeHighlights: [
    'Exponential cost scaling for upgrades',
    'setInterval for passive income',
    'Big number formatting for display',
  ],
};

interface Upgrade {
  name: string;
  cost: number;
  cps: number; // cookies per second
  owned: number;
}

export default function ClickerGame() {
  const [cookies, setCookies] = useState(0);
  const [totalCookies, setTotalCookies] = useState(0);
  const [cpc, setCpc] = useState(1); // cookies per click
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    { name: '👆 Better Finger', cost: 15, cps: 0.1, owned: 0 },
    { name: '👵 Grandma', cost: 100, cps: 1, owned: 0 },
    { name: '🏭 Factory', cost: 500, cps: 5, owned: 0 },
    { name: '⛏️ Mine', cost: 2000, cps: 20, owned: 0 },
    { name: '🚀 Rocket', cost: 10000, cps: 100, owned: 0 },
    { name: '🌍 Planet', cost: 100000, cps: 1000, owned: 0 },
  ]);
  const [clickPower, setClickPower] = useState([
    { name: '🖱️ Double Click', cost: 50, multiplier: 2, bought: false },
    { name: '💪 Power Click', cost: 500, multiplier: 2, bought: false },
    { name: '⚡ Super Click', cost: 5000, multiplier: 2, bought: false },
  ]);

  const cps = upgrades.reduce((sum, u) => sum + u.cps * u.owned, 0);

  // Passive income
  useEffect(() => {
    const interval = setInterval(() => {
      if (cps > 0) {
        setCookies(c => c + cps / 10);
        setTotalCookies(t => t + cps / 10);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [cps]);

  const handleClick = () => {
    setCookies(c => c + cpc);
    setTotalCookies(t => t + cpc);
  };

  const buyUpgrade = (index: number) => {
    const upgrade = upgrades[index];
    if (cookies >= upgrade.cost) {
      setCookies(c => c - upgrade.cost);
      setUpgrades(ups => ups.map((u, i) => 
        i === index ? { ...u, owned: u.owned + 1, cost: Math.floor(u.cost * 1.15) } : u
      ));
    }
  };

  const buyClickPower = (index: number) => {
    const power = clickPower[index];
    if (cookies >= power.cost && !power.bought) {
      setCookies(c => c - power.cost);
      setCpc(c => c * power.multiplier);
      setClickPower(p => p.map((pw, i) => 
        i === index ? { ...pw, bought: true } : pw
      ));
    }
  };

  const formatNumber = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex gap-8">
        {/* Main Click Area */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-bold text-yellow-400">
            🍪 {formatNumber(cookies)}
          </div>
          <div className="text-gray-400">
            per second: {formatNumber(cps)} | per click: {cpc}
          </div>

          <button
            onClick={handleClick}
            className="w-40 h-40 text-8xl bg-yellow-600 hover:bg-yellow-500 active:scale-95 rounded-full transition-all shadow-lg"
          >
            🍪
          </button>

          <div className="text-sm text-gray-500">
            Total: {formatNumber(totalCookies)} cookies baked
          </div>
        </div>

        {/* Shop */}
        <div className="flex flex-col gap-4 w-64">
          <h3 className="font-bold text-lg">🏪 Shop</h3>
          
          <div className="space-y-2">
            <h4 className="text-sm text-gray-400">Buildings</h4>
            {upgrades.map((upgrade, i) => (
              <button
                key={i}
                onClick={() => buyUpgrade(i)}
                disabled={cookies < upgrade.cost}
                className={`w-full p-2 rounded-lg text-left text-sm transition-all
                  ${cookies >= upgrade.cost ? 'bg-green-600/30 hover:bg-green-600/50' : 'bg-gray-700/50 opacity-50'}
                `}
              >
                <div className="flex justify-between">
                  <span>{upgrade.name}</span>
                  <span className="text-yellow-400">{formatNumber(upgrade.cost)}</span>
                </div>
                <div className="text-xs text-gray-400">
                  +{upgrade.cps}/s • Owned: {upgrade.owned}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm text-gray-400">Click Power</h4>
            {clickPower.map((power, i) => (
              <button
                key={i}
                onClick={() => buyClickPower(i)}
                disabled={cookies < power.cost || power.bought}
                className={`w-full p-2 rounded-lg text-left text-sm transition-all
                  ${power.bought ? 'bg-purple-600/30 opacity-50' : 
                    cookies >= power.cost ? 'bg-blue-600/30 hover:bg-blue-600/50' : 'bg-gray-700/50 opacity-50'}
                `}
              >
                <div className="flex justify-between">
                  <span>{power.name}</span>
                  <span className="text-yellow-400">
                    {power.bought ? '✓' : formatNumber(power.cost)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {power.multiplier}x click power
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameWrapper>
  );
}
