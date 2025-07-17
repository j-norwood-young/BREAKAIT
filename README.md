# BREAKAIT

A modern TypeScript/Svelte version of the classic Breakout game with multi-level support, high scores, and maintainable architecture.

## Features

- **Modern Framework**: Built with Svelte + TypeScript for maintainability
- **Multiple Levels**: JSON-based level system that's easy to edit and extend
- **High Score System**: Persistent high scores using localStorage
- **Smooth 3D Graphics**: Enhanced visual effects with gradients and particle systems
- **Power-ups**: Various power-ups including fire ball, sticky ball, extra life, and speed modifiers
- **Mobile Support**: Full touch controls for mobile devices
- **Audio Effects**: Retro-style sound effects using Web Audio API
- **Cheat Codes**: Hidden shortcuts for testing (try typing "I WIN!" or "I LOSE")
- **Git Pages Ready**: Compiled assets are checked into Git for easy deployment

## How to Play

- **Desktop**: Use arrow keys or mouse to control the paddle
- **Mobile**: Touch and drag to move the paddle
- **Start**: Click anywhere or press spacebar to start/launch the ball
- **Goal**: Destroy all bricks to advance to the next level

## Power-ups

- **🔥 Fire Ball** (Orange): Destroys bricks instantly without bouncing
- **🔵 Sticky Ball** (Blue): Ball sticks to paddle on contact
- **🟢 Extra Ball** (Green): Gain an extra life
- **🔴 Slow Down** (Red): Reduces ball speed temporarily
- **🟣 Speed Up** (Purple): Increases ball speed (negative power-up)
- **🟣 Clear Good** (Purple): Removes all positive power-up effects

## Development

### Setup

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

This builds the project and outputs the compiled assets (`game.js` and `style.css`) to the root directory for Git Pages deployment.

### Preview Built Version

```bash
npm run preview
```

## Project Structure

```
BREAKAIT/
├── src/                    # Source code
│   ├── components/         # Svelte components
│   │   └── Game.svelte    # Main game component
│   ├── stores/            # Svelte stores
│   │   └── highScore.ts   # High score persistence
│   ├── systems/           # Game systems
│   │   ├── audio.ts       # Audio management
│   │   └── levelManager.ts # Level loading and progression
│   ├── types/             # TypeScript interfaces
│   │   └── game.ts        # Game entity types
│   ├── App.svelte         # Root application component
│   └── main.ts            # Application entry point
├── public/                # Static assets (deployed with build)
│   └── levels/            # Level configuration files
│       ├── level1.json    # Level 1 configuration
│       ├── level2.json    # Level 2 configuration
│       └── level3.json    # Level 3 configuration
├── levels/                # Development level files
├── game.js                # Compiled JavaScript (Git Pages)
├── style.css              # Compiled CSS (Git Pages)
└── index.html             # Entry HTML file
```

## Adding New Levels

Levels are stored as JSON files in the `public/levels/` directory. Each level file should follow this format:

```json
{
  "id": 1,
  "name": "Level Name",
  "bricks": {
    "rows": 3,
    "cols": 8,
    "layout": [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3]
    ]
  },
  "ballSpeed": 4,
  "lives": 5,
  "powerUpChance": 0.2
}
```

### Level Properties

- **id**: Unique level identifier
- **name**: Display name for the level
- **bricks.layout**: 2D array where numbers represent brick hit points (0 = no brick, 1-3 = brick with that many hits)
- **ballSpeed**: Initial ball speed for the level
- **lives**: Number of lives the player starts with
- **powerUpChance**: Probability (0-1) of power-ups dropping when bricks are destroyed

After adding a new level file, update the `levelFiles` array in `src/systems/levelManager.ts` to include the new level.

## Technical Details

Built using:
- **Svelte 4**: Modern reactive framework
- **TypeScript 5**: Type safety and better developer experience
- **Vite**: Fast build tool and dev server
- **HTML5 Canvas**: High-performance 2D rendering
- **Web Audio API**: Procedural sound generation
- **localStorage**: Persistent high score storage
- **CSS Grid/Flexbox**: Responsive layout

## Deployment

The project is configured for Git Pages deployment. After running `npm run build`, the compiled assets are output to the root directory and can be served directly from Git Pages without additional configuration.

## Legacy

This project started as a quick experiment with AI-generated code but has been completely modernized with:
- Proper TypeScript architecture
- Component-based structure
- Modular systems design
- Comprehensive documentation
- Easy-to-edit level format
- Build system for deployment

[Play it HERE](https://j-norwood-young.github.io/BREAKAIT/) 