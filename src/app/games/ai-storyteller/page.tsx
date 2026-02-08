'use client';

import { useState } from 'react';
import GameWrapper from '@/components/GameWrapper';
import { getGameById } from '@/data/games';
import { chat, CHARACTERS } from '@/lib/neocortex';

const game = getGameById('ai-storyteller')!;

const tutorial = {
  overview: 'Collaborate with the Cheshire Cat to build an interactive story! You make choices, the cat weaves the tale.',
  promptFlow: ['AI starts story', 'Player picks story direction', 'AI continues narrative', 'Story builds collaboratively'],
  codeHighlights: ['Neocortex conversation history', 'Choice-driven narrative', 'Dynamic story generation'],
};

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIStorytellerGame() {
  const [story, setStory] = useState<string[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

  const continueStory = async (choice?: string) => {
    setIsLoading(true);
    
    const prompt = choice 
      ? `The reader chooses: "${choice}". Continue the story based on this choice (2-3 sentences), then give exactly 3 short choices for what happens next, formatted as: CHOICE 1: ... CHOICE 2: ... CHOICE 3: ...`
      : "Start a mysterious story set in Wonderland (2-3 sentences). Then give exactly 3 short choices for what happens next, formatted as: CHOICE 1: ... CHOICE 2: ... CHOICE 3: ...";

    try {
      const response = await chat(
        CHARACTERS.CHESHIRE_CAT,
        prompt,
        history,
        "You are a storyteller weaving tales in Wonderland. Keep stories whimsical and mysterious. Always end with exactly 3 choices."
      );

      const text = response.message;
      
      // Parse story and choices
      const choiceMatches = text.match(/CHOICE \d+:\s*([^\n]+)/gi) || [];
      const parsedChoices = choiceMatches.map(c => c.replace(/CHOICE \d+:\s*/i, '').trim());
      const storyPart = text.replace(/CHOICE \d+:.*/gi, '').trim();

      setStory([...story, storyPart]);
      setChoices(parsedChoices.length > 0 ? parsedChoices : ['Continue the adventure', 'Take a different path', 'Ask for help']);
      
      setHistory([
        ...history,
        { role: 'user', content: choice || 'Start the story' },
        { role: 'assistant', content: text }
      ]);
    } catch {
      setStory([...story, "The Cheshire Cat's grin flickered mysteriously..."]);
      setChoices(['Look around', 'Call out', 'Wait silently']);
    }
    
    setIsLoading(false);
  };

  const startGame = async () => {
    setGameStarted(true);
    setStory([]);
    setChoices([]);
    setHistory([]);
    await continueStory();
  };

  const makeChoice = async (choice: string) => {
    await continueStory(choice);
  };

  return (
    <GameWrapper game={game} tutorial={tutorial}>
      <div className="max-w-2xl mx-auto">
        {!gameStarted ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">📖</div>
            <h2 className="text-3xl font-bold mb-4">AI Story Builder</h2>
            <p className="text-gray-400 mb-8">
              Collaborate with the Cheshire Cat to create your own Wonderland tale!
              <br />
              <span className="text-purple-400">Powered by Neocortex AI</span>
            </p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-xl text-xl font-bold"
            >
              Begin Your Tale
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Story so far */}
            <div className="bg-black/30 rounded-xl p-6 min-h-64">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">😺</span>
                <h3 className="text-xl font-bold text-purple-300">The Story So Far...</h3>
              </div>
              
              <div className="space-y-4 text-lg leading-relaxed">
                {story.map((paragraph, i) => (
                  <p key={i} className="text-gray-200">{paragraph}</p>
                ))}
                {isLoading && (
                  <p className="text-purple-400 italic animate-pulse">
                    The Cheshire Cat is weaving the tale...
                  </p>
                )}
              </div>
            </div>

            {/* Choices */}
            {!isLoading && choices.length > 0 && (
              <div className="space-y-3">
                <p className="text-gray-400 text-center">What happens next?</p>
                {choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => makeChoice(choice)}
                    className="w-full p-4 bg-purple-600/30 hover:bg-purple-600/50 rounded-xl text-left transition-all"
                  >
                    <span className="text-purple-300 font-bold mr-2">{i + 1}.</span>
                    {choice}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Start New Story
            </button>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
