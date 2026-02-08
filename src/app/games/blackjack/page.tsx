'use client';

import { useState, useCallback } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('blackjack')!;

const tutorial = {
  overview: 'Classic Blackjack (21). Beat the dealer by getting closer to 21 without going over. Aces count as 1 or 11.',
  promptFlow: ['Deal initial cards', 'Hit or stand mechanics', 'Dealer plays after player stands', 'Compare hands for winner'],
  codeHighlights: ['Card deck shuffling', 'Ace value calculation', 'Dealer AI (hits until 17)'],
};

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card { suit: string; value: string; }

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function getHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;
  
  for (const card of hand) {
    if (card.value === 'A') {
      aces++;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(card.value)) {
      value += 10;
    } else {
      value += parseInt(card.value);
    }
  }
  
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  return value;
}

export default function BlackjackGame() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'playing' | 'dealer' | 'ended'>('betting');
  const [result, setResult] = useState('');
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(100);

  const deal = useCallback(() => {
    const newDeck = createDeck();
    const player = [newDeck.pop()!, newDeck.pop()!];
    const dealer = [newDeck.pop()!, newDeck.pop()!];
    
    setDeck(newDeck);
    setPlayerHand(player);
    setDealerHand(dealer);
    setGamePhase('playing');
    setResult('');
    setBalance(b => b - bet);

    if (getHandValue(player) === 21) {
      setGamePhase('ended');
      setResult('Blackjack! You win!');
      setBalance(b => b + bet * 2.5);
    }
  }, [bet]);

  const hit = () => {
    const newCard = deck.pop()!;
    const newHand = [...playerHand, newCard];
    setPlayerHand(newHand);
    setDeck([...deck]);

    if (getHandValue(newHand) > 21) {
      setGamePhase('ended');
      setResult('Bust! You lose.');
    }
  };

  const stand = () => {
    setGamePhase('dealer');
    let dealerCards = [...dealerHand];
    let currentDeck = [...deck];

    const dealerPlay = () => {
      if (getHandValue(dealerCards) < 17) {
        dealerCards.push(currentDeck.pop()!);
        setDealerHand([...dealerCards]);
        setDeck([...currentDeck]);
        setTimeout(dealerPlay, 500);
      } else {
        const playerValue = getHandValue(playerHand);
        const dealerValue = getHandValue(dealerCards);

        if (dealerValue > 21) {
          setResult('Dealer busts! You win!');
          setBalance(b => b + bet * 2);
        } else if (dealerValue > playerValue) {
          setResult('Dealer wins.');
        } else if (playerValue > dealerValue) {
          setResult('You win!');
          setBalance(b => b + bet * 2);
        } else {
          setResult('Push (tie).');
          setBalance(b => b + bet);
        }
        setGamePhase('ended');
      }
    };

    setTimeout(dealerPlay, 500);
  };

  const CardDisplay = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => (
    <div className={`w-16 h-24 rounded-lg flex items-center justify-center text-2xl font-bold
      ${hidden ? 'bg-blue-600' : 'bg-white text-black'}
      ${!hidden && (card.suit === '♥' || card.suit === '♦') ? 'text-red-600' : ''}
    `}>
      {hidden ? '?' : `${card.value}${card.suit}`}
    </div>
  );

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-6">
        <div className="text-xl font-bold text-yellow-400">💰 Balance: ${balance}</div>

        {/* Dealer */}
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            Dealer {gamePhase !== 'playing' && `(${getHandValue(dealerHand)})`}
          </div>
          <div className="flex gap-2 justify-center">
            {dealerHand.map((card, i) => (
              <CardDisplay key={i} card={card} hidden={i === 1 && gamePhase === 'playing'} />
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`text-2xl font-bold ${result.includes('win') || result.includes('Blackjack') ? 'text-green-400' : result.includes('lose') || result.includes('Dealer wins') ? 'text-red-400' : 'text-yellow-400'}`}>
            {result}
          </div>
        )}

        {/* Player */}
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-2">
            {playerHand.map((card, i) => (
              <CardDisplay key={i} card={card} />
            ))}
          </div>
          <div className="text-gray-400">Your Hand ({getHandValue(playerHand)})</div>
        </div>

        {/* Controls */}
        {gamePhase === 'betting' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[50, 100, 250, 500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBet(amount)}
                  disabled={amount > balance}
                  className={`px-4 py-2 rounded-lg ${bet === amount ? 'bg-yellow-500' : 'bg-gray-600'} disabled:opacity-50`}
                >
                  ${amount}
                </button>
              ))}
            </div>
            <button
              onClick={deal}
              disabled={bet > balance}
              className="px-8 py-3 bg-green-500 rounded-lg text-xl font-bold disabled:opacity-50"
            >
              Deal (${bet})
            </button>
          </div>
        )}

        {gamePhase === 'playing' && (
          <div className="flex gap-4">
            <button onClick={hit} className="px-6 py-3 bg-blue-500 rounded-lg font-bold">Hit</button>
            <button onClick={stand} className="px-6 py-3 bg-red-500 rounded-lg font-bold">Stand</button>
          </div>
        )}

        {gamePhase === 'ended' && (
          <button onClick={() => setGamePhase('betting')} className="px-6 py-3 bg-purple-500 rounded-lg font-bold">
            New Hand
          </button>
        )}
      </div>
    </GameWrapper>
  );
}
