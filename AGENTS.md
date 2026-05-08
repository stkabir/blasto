# Blasto - Agent Instructions

## Project Overview
Blasto is a vertical arcade shooter built with vanilla HTML5 Canvas + JavaScript. No frameworks, no bundlers required for development.

## Development Workflow

### Local Development (index.dev.html)
- **URL**: `http://localhost/juegos/blasto/index.dev.html`
- Loads `.js` files directly (no minification)
- Use this for coding/debugging

### Production Build
- Run `npm run build` to minify JS files to `.min.js`
- Production uses `index.html` which loads `.min.js`

### Key Files
```
js/game.js       - Core game loop, state management, collisions
js/player.js     - Player ship, shooting (fireRate, bulletDamage)
js/asteroid.js   - Asteroid types, spawn, split, fallSpeed, weight
js/boss.js       - Boss enemies
js/powerup.js    - Power-up system, activation, durations
css/styles.css   - UI (HUD, power-up indicators, screens)
index.dev.html   - Development entry point (loads .js)
index.html       - Production entry point (loads .min.js)
```

## Game Balance (Current State)

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

### Asteroid Split Physics
- Split impulse: -80 to -120 vy (upward boost)
- Horizontal speed: 10% of base speed
- Normalizes to fallSpeed after 500ms

### Boss
- Appears every: 1000 points
- HP: 350, Speed: 100 px/s
- Fires every 0.6s at 225 px/s
- Reward: 350 points

### Power-up Durations
- TRIPLE: 10s, ROCKET: instant, SHIELD: 10s, FREEZE: 8s, LIFE: until hit

### Rocket Behavior
- Damage equals target's current HP → instant kill
- Splits normally on destruction (no special behavior)

### Power-up Indicator
- Glow-based system (box-shadow, background, border, text-shadow)
- Opacity decreases with time: `0.3 + (progress * 0.7)`
- Blinking effect when ≤ 3s remaining: `Math.sin(now / 200)` for smooth pulse
- Fade-out on expiration
- LIFE icon stays at full opacity (infinite until hit)

### Score System
- 1 point per bullet hit (no destruction bonus)
- Score accumulates from damage, not kills

## Leaderboards

### Local Leaderboard
- Stored in `localStorage` key `blasto_leaderboard`
- Array of `{name, score, date}`, sorted by score desc, top 5
- Rendered on game over screen and leaderboard screen

### Global Leaderboard
- Netlify Functions → API on VPS (Dokploy) → MariaDB
- `netlify/functions/submit-score.js` — POST score to VPS
- `netlify/functions/get-leaderboard.js` — GET top 20 from VPS
- Variable: `LEADERBOARD_API_URL` in Netlify env

### Server (VPS)
- `server/server.js` — Express API with MariaDB
- `server/init.sql` — DB schema (auto-created on startup)
- `server/Dockerfile` — For Dokploy deployment
- Endpoints: `GET /api/scores` (top 20), `POST /api/scores` (submit)
- Rate limiting: 10 req/min per IP on POST

### Leaderboard UI
- Game over screen: shows top 5 local + top 20 global
- Start screen: "Leaderboard" button opens dedicated screen with local/global tabs
- Current player score highlighted with gold border

## Common Issues

### Asteroids Fall Too Fast/Slow
- Check `fallSpeed` in `ASTEROID_TYPES`
- Check `update()` for gravity/velocity normalization logic

### Power-up Not Showing
- Check `updatePowerUpIndicator()` and `updatePowerUpIconStyles()` in game.js
- Verify `activePowerUps` object structure in powerup.js

### Power-up Times Not Resetting
- Fix in `powerup.js` `activate()`: use `remaining = duration` not `+=`

### NaN on Rocket Impact
- Ensure rocket has `damage` property set to target's HP before impact

## Commands
```bash
npm run build    # Minify JS for production
npm run watch    # Watch mode for development
```

## Git Ignore Notes
- `*.min.js` is gitignored (generated)
- `index.dev.html` is gitignored (local dev only)