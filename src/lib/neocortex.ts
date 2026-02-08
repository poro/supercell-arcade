// Neocortex AI Integration for NPC Characters
// Docs: https://docs.neocortex.link

const NEOCORTEX_API_KEY = process.env.NEXT_PUBLIC_NEOCORTEX_API_KEY || 'sk_de5d9e30-5736-4354-9f08-89fb0ad91d4a';

export const CHARACTERS = {
  WHITE_RABBIT: 'cmlbqrc3z0001if04qtmhi37m',
  CHESHIRE_CAT: 'cmlbqz5580002lg04phx2h6m1',
} as const;

export type CharacterId = typeof CHARACTERS[keyof typeof CHARACTERS];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface NeocortexResponse {
  message: string;
  emotion?: string;
}

export async function chat(
  characterId: CharacterId,
  message: string,
  history: Message[] = [],
  context?: string
): Promise<NeocortexResponse> {
  const response = await fetch('https://api.neocortex.link/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NEOCORTEX_API_KEY}`,
    },
    body: JSON.stringify({
      character_id: characterId,
      message,
      history,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Neocortex API error: ${response.status}`);
  }

  return response.json();
}

export async function getCharacterGreeting(characterId: CharacterId): Promise<string> {
  const greetings: Record<CharacterId, string[]> = {
    [CHARACTERS.WHITE_RABBIT]: [
      "Oh dear! Oh dear! I shall be too late! Come, let's play a game!",
      "No time to explain! The game awaits!",
      "I'm late, I'm late! But never too late for a game!",
    ],
    [CHARACTERS.CHESHIRE_CAT]: [
      "We're all mad here... but some of us play better than others.",
      "Would you like to play a game? Every direction leads somewhere interesting.",
      "Curiouser and curiouser... shall we see if you can win?",
    ],
  };
  
  const options = greetings[characterId] || ["Let's play!"];
  return options[Math.floor(Math.random() * options.length)];
}
