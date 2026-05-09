# Blasto - Agent Instructions

## Project Overview
Blasto is a vertical arcade shooter built with TypeScript + HTML5 Canvas. ES modules, esbuild bundler.

## Project Structure

```
src/
  core/
    types.ts            - Shared TypeScript interfaces/types
    constants.ts        - Game configuration, ship designs, asteroid types, etc.
    input.ts            - Input manager (keyboard, mouse, touch)
  entities/
    player.ts           - Player ship, designs, shooting
    asteroid.ts         - Asteroid types, physics, asteroid manager
    boss.ts             - Boss enemies, boss manager
    powerup.ts          - Power-up system, activation, manager
  systems/
    collision.ts        - Collision detection + rocket tracking
    effects.ts          - Particles, trail, explosions, shake, flash, announcements
  ui/
    leaderboard.ts      - Local (localStorage) + global (API) leaderboard
    customization.ts    - Ship design/color/bullet style selector UI
    powerup-indicator.ts - Power-up icon DOM management
  background.ts         - Parallax starfield
  main.ts               - Entry point, Game orchestrator class
dist/
  game.min.js           - Production bundle (esbuild output)
css/
  styles.css            - UI styles (HUD, screens, leaderboard, customization)
index.html              - Production entry point
index.dev.html          - Dev entry point (loads dist/game.js from dev server)
build.js                - esbuild production build script
dev.js                  - esbuild dev server script
```

## Development Workflow

### Dev Server (recommended)
- Run `pnpm run dev` → starts esbuild dev server at `http://localhost:3000`
- Open `http://localhost:3000/index.dev.html`
- Hot reload on file changes

### Production Build
- Run `pnpm run build` → outputs to `dist/game.min.js` + copies to `www/`
- `pnpm run watch` → watch mode for production
- Type check: `pnpm exec tsc --noEmit`

## Android APK

### Prerequisites
- Android Studio (for SDK + build tools)
- Java JDK 17

### Build APK
1. `pnpm run cap-sync` — builds JS + syncs to Android project
2. Open `android/` in Android Studio
3. Build → Build APK(s)
4. Output at `android/app/build/outputs/apk/debug/app-debug.apk`

### Capacitor Config
- App ID: `pro.blasto.game`
- Portrait + fullscreen immersive mode
- Keep screen on during gameplay

## Game Balance

### Player
- Fire rate: 33ms (30 bullets/sec)
- Bullet damage: 1
- Speed: 350 px/s

### Asteroids
| Type   | HP  | fallSpeed | Notes |
|--------|-----|-----------|-------|
| LIGHT  | 10  | 70 px/s   | Split: none |
| MED    | 20  | 50 px/s   | Split: 2x LIGHT |
| BLUE   | 35  | 50 px/s   | Split: 2x MED |
| PURPLE | 50  | 40 px/s   | Split: 2x BLUE |
| RED    | 100 | 30 px/s   | Split: 2x PURPLE |

### Asteroid Spawn Probabilities
- LIGHT: 40%, MED: 30%, BLUE: 20%, PURPLE: 6%, RED: 4%

### Boss
- Appears every: 1000 points
- HP: 350, Speed: 100 px/s
- Fires every 0.6s at 225 px/s

### Power-up Durations
- TRIPLE: 10s, ROCKET: instant, SHIELD: 10s, FREEZE: 8s, LIFE: until hit

### Score System
- 1 point per bullet hit
- Score accumulates from damage, not kills

## Leaderboards

### Local Leaderboard
- `localStorage` key `blasto_leaderboard`
- Top 5 entries, sorted by score desc

### Global Leaderboard
- API: `https://api.blasto.pro/api/`
- Endpoints: `/api/get-leaderboard`, `/api/submit-score`

## Customization System

### Ship Designs
| ID       | Name       | Default Color |
|----------|------------|---------------|
| triangle | Triángulo  | #22d3ee       |
| diamond  | Diamante   | #e879f9       |
| wing     | Ala        | #a3e635       |
| hexagon  | Hexágono   | #38bdf8       |

### Bullet Styles
| ID        | Name    |
|-----------|---------|
| glow      | Brillo  |
| elongated | Alargado |
| dual      | Doble   |

### localStorage Keys
- `blasto_playerDesign`, `blasto_playerColor`, `blasto_bulletStyle`
- `blasto_playerName`, `blasto_leaderboard`

## Deployment

### Frontend (blasto.pro)
- Docker: nginx:alpine serving index.html + dist/ + css/
- Build: `pnpm build`

## Commands
```bash
pnpm install       # Install dependencies (ALWAYS use pnpm)
pnpm run dev       # Dev server with hot reload
pnpm run build     # Production build
pnpm run watch     # Watch mode
pnpm run cap-sync  # Build + sync to Capacitor Android
pnpm exec tsc --noEmit  # Type check
```

**IMPORTANT:** This project uses pnpm.

## Git Ignore Notes
- `node_modules/` is gitignored
- `index.dev.html` is gitignored
- `dist/`, `www/` are gitignored (generated)
- `android/` is NOT gitignored (Capacitor project)
