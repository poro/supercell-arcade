# 🎮 Supercell Arcade

**54 Games in 54 Hours** — Built for the Supercell AI Game Hackathon 2026

> 🎁 **Donated to the Tools Category** for the Supercell AI Game Hackathon. Free to use, modify, and build upon!

[![Live Demo](https://img.shields.io/badge/Live%20Demo-supercell--arcade.vercel.app-brightgreen)](https://supercell-arcade.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🕹️ What is this?

A collection of 54+ playable arcade games recreated in the browser, featuring:

- **Classic Arcade Games**: Pac-Man, Space Invaders, Galaga, Frogger, Asteroids, Joust, Dig Dug, and more
- **AI-Enhanced Games**: Powered by [Neocortex AI](https://neocortex.link) with the Cheshire Cat and White Rabbit characters
- **Real-time Video**: Style Mirror game using [Decart AI](https://decart.ai) for live webcam transformation
- **Educational Tutorials**: Each game includes detailed breakdowns of game design patterns (from Björk & Holopainen), architecture diagrams, and code highlights

## 🚀 Tech Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS 4
- **AI Integration**: Neocortex AI (NPC conversations), Decart AI (real-time video)
- **Diagrams**: Mermaid.js for architecture visualization
- **Deployment**: Vercel

## 🎯 Game Design Patterns

Every game is tagged with formal game design patterns from *Patterns in Game Design* (Björk & Holopainen, 2005):

- Lives, Score, Time Limit
- Power-Ups, Levels, Elimination
- Movement, Collecting, Puzzle Solving
- Player vs AI, Territory Control
- And many more...

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to play!

## 📁 Project Structure

```
src/
├── app/
│   ├── games/           # All 54+ games
│   │   ├── pacman/
│   │   ├── space-invaders/
│   │   ├── galaga/
│   │   └── ...
│   └── api/
│       └── decart-token/ # Decart API token endpoint
├── components/
│   ├── GameWrapper.tsx   # Tutorial system + game chrome
│   └── MermaidDiagram.tsx
├── lib/
│   ├── neocortex.ts      # AI character integration
│   ├── decart.ts         # Real-time video SDK
│   └── sprites.ts        # Pixel art sprite library
└── data/
    └── games.ts          # Game registry + patterns
```

## 🤖 AI Integration

### Neocortex (NPC Conversations)
```typescript
import { chat, CHARACTERS } from '@/lib/neocortex';

const response = await chat(
  CHARACTERS.CHESHIRE_CAT,
  "Tell me a riddle",
  conversationHistory
);
```

### Decart (Real-time Video)
```typescript
import { createDecartClient, models } from '@decartai/sdk';

const client = createDecartClient({ apiKey });
const realtime = await client.realtime.connect(stream, {
  model: models.realtime('mirage_v2'),
  initialState: { prompt: { text: 'Anime style' } }
});
```

## 📜 License

MIT License — Free to use, modify, and distribute.

## 🙏 Credits

- **Supercell** — For hosting the AI Game Hackathon 2026
- **Neocortex AI** — NPC conversation engine
- **Decart AI** — Real-time video transformation
- **Björk & Holopainen** — Game design pattern taxonomy

---

*Built with ☕ and 🎮 in Abu Dhabi, February 6-8, 2026*
