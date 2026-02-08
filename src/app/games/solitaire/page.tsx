'use client';

import { useState, useCallback, useEffect } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';

const game = getGameById('solitaire')!;

const tutorial = {
  overview: 'Classic Klondike Solitaire! Build foundation piles from Ace to King. Move cards between columns following alternating colors.',
  promptFlow: ['Shuffle and deal cards', 'Drag cards between piles', 'Build foundations', 'Win when all cards in foundations'],
  codeHighlights: ['Card drag-and-drop', 'Valid move detection', 'Auto-complete detection'],
};

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card { suit: string; value: string; faceUp: boolean; }

export default function SolitaireGame() {
  const [tableau, setTableau] = useState<Card[][]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);

  const createDeck = useCallback(() => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value, faceUp: false });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }, []);

  const deal = useCallback(() => {
    const deck = createDeck();
    const newTableau: Card[][] = [];
    let cardIndex = 0;

    for (let i = 0; i < 7; i++) {
      newTableau[i] = [];
      for (let j = 0; j <= i; j++) {
        const card = { ...deck[cardIndex++] };
        card.faceUp = j === i;
        newTableau[i].push(card);
      }
    }

    setTableau(newTableau);
    setStock(deck.slice(cardIndex));
    setWaste([]);
    setFoundations([[], [], [], []]);
    setMoves(0);
  }, [createDeck]);

  useEffect(() => { deal(); }, [deal]);

  const isRed = (suit: string) => suit === '♥' || suit === '♦';
  const getValue = (value: string) => VALUES.indexOf(value);

  const drawCard = () => {
    if (stock.length === 0) {
      setStock([...waste].reverse().map(c => ({ ...c, faceUp: false })));
      setWaste([]);
    } else {
      const card = { ...stock[stock.length - 1], faceUp: true };
      setStock(stock.slice(0, -1));
      setWaste([...waste, card]);
    }
    setMoves(m => m + 1);
  };

  const canPlaceOnTableau = (card: Card, targetPile: Card[]) => {
    if (targetPile.length === 0) return card.value === 'K';
    const topCard = targetPile[targetPile.length - 1];
    return isRed(card.suit) !== isRed(topCard.suit) && getValue(card.value) === getValue(topCard.value) - 1;
  };

  const canPlaceOnFoundation = (card: Card, foundationPile: Card[]) => {
    if (foundationPile.length === 0) return card.value === 'A';
    const topCard = foundationPile[foundationPile.length - 1];
    return card.suit === topCard.suit && getValue(card.value) === getValue(topCard.value) + 1;
  };

  const moveWasteToTableau = (pileIndex: number) => {
    if (waste.length === 0) return;
    const card = waste[waste.length - 1];
    if (canPlaceOnTableau(card, tableau[pileIndex])) {
      const newTableau = [...tableau];
      newTableau[pileIndex] = [...newTableau[pileIndex], card];
      setTableau(newTableau);
      setWaste(waste.slice(0, -1));
      setMoves(m => m + 1);
    }
  };

  const moveToFoundation = (card: Card, fromWaste: boolean, pileIndex?: number) => {
    for (let i = 0; i < 4; i++) {
      if (canPlaceOnFoundation(card, foundations[i])) {
        const newFoundations = [...foundations];
        newFoundations[i] = [...newFoundations[i], card];
        setFoundations(newFoundations);

        if (fromWaste) {
          setWaste(waste.slice(0, -1));
        } else if (pileIndex !== undefined) {
          const newTableau = [...tableau];
          newTableau[pileIndex] = newTableau[pileIndex].slice(0, -1);
          if (newTableau[pileIndex].length > 0) {
            newTableau[pileIndex][newTableau[pileIndex].length - 1].faceUp = true;
          }
          setTableau(newTableau);
        }
        setMoves(m => m + 1);
        return true;
      }
    }
    return false;
  };

  const won = foundations.every(f => f.length === 13);

  const CardComponent = ({ card, onClick }: { card: Card; onClick?: () => void }) => (
    <div
      onClick={onClick}
      className={`w-12 h-16 rounded border-2 flex items-center justify-center text-lg font-bold cursor-pointer
        ${card.faceUp ? 'bg-white' : 'bg-blue-600'}
        ${card.faceUp && isRed(card.suit) ? 'text-red-500' : 'text-black'}
      `}
    >
      {card.faceUp ? `${card.value}${card.suit}` : ''}
    </div>
  );

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 text-xl font-bold">
          <span className="text-blue-400">Moves: {moves}</span>
        </div>

        <div className="bg-green-800 p-4 rounded-xl">
          {/* Top row: Stock, Waste, Foundations */}
          <div className="flex gap-4 mb-4">
            <div onClick={drawCard} className="w-12 h-16 rounded border-2 border-white bg-blue-800 cursor-pointer flex items-center justify-center">
              {stock.length > 0 ? '🂠' : '↺'}
            </div>
            <div className="w-12 h-16">
              {waste.length > 0 && (
                <CardComponent 
                  card={waste[waste.length - 1]} 
                  onClick={() => moveToFoundation(waste[waste.length - 1], true)}
                />
              )}
            </div>
            <div className="w-8" />
            {foundations.map((foundation, i) => (
              <div key={i} className="w-12 h-16 rounded border-2 border-dashed border-white/50 flex items-center justify-center">
                {foundation.length > 0 && <CardComponent card={foundation[foundation.length - 1]} />}
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div className="flex gap-2">
            {tableau.map((pile, pileIndex) => (
              <div key={pileIndex} className="w-14" onClick={() => moveWasteToTableau(pileIndex)}>
                {pile.length === 0 ? (
                  <div className="w-12 h-16 rounded border-2 border-dashed border-white/30" />
                ) : (
                  pile.map((card, cardIndex) => (
                    <div key={cardIndex} style={{ marginTop: cardIndex > 0 ? -48 : 0 }}>
                      <CardComponent 
                        card={card} 
                        onClick={() => card.faceUp && moveToFoundation(card, false, pileIndex)}
                      />
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>

        {won && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-2">🎉 You Win!</h2>
            <p>Completed in {moves} moves</p>
          </div>
        )}

        <button onClick={deal} className="px-4 py-2 bg-purple-500 rounded-lg">
          New Game
        </button>
      </div>
    </GameWrapper>
  );
}
