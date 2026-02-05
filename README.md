# Neon Arena FPS

A browser-based first-person shooter built with Three.js.

## Overview

Neon Arena is a fast-paced arena shooter where players battle waves of robotic droids. Select your weapon, survive multiple rounds, and try to achieve the highest score.

## Features

- First-person 3D perspective with mouse look and WASD controls
- Three weapon types: Rapid-Fire Rifle, Heavy Shotgun, and Precision Sniper
- Blocky robotic droid enemies with glowing elements
- Progressive difficulty with increasing enemy count each round
- Visor HUD with damage effects and cracked glass overlay
- Minimap showing player and enemy positions
- Physics-based movement with jumping and collision detection

## Controls

- **WASD** - Move forward, left, backward, right
- **Mouse** - Look around
- **Left Click** - Shoot
- **R** - Reload weapon
- **Space** - Jump

## Technical Details

Built with:
- Three.js for 3D rendering
- Vite for development server and module bundling
- Vanilla JavaScript (ES6 modules)
- Custom physics and collision detection

## Running the Game

```bash
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.

## Project Structure

```
src/
├── config/     - Game constants and weapon definitions
├── core/       - Engine, game logic, and update systems
├── entities/   - Player, droid, and world creation
├── effects/    - Visor and visual effects
└── utils/      - HUD, minimap, input handling
```

## License

MIT
