# BLAStO - Game Design Document

## Concepto
Blasto es un juego arcade de tipo shooter vertical. El jugador controla una nave en la parte inferior de la pantalla, disparando automáticamente hacia arriba. La nave se mueve de izquierda a derecha siguiendo el dedo del usuario o mouse.

## Características Principales
- Disparo automático continuo (30/s) hacia arriba
- Control táctil/mouse intuitivo (mover nave izq/der con un dedo)
- Sistema de power-ups (5 tipos)
- Jefes finales periódicamente
- Asteroides que se dividen al destruirse
- Sistema de pausa (tap en nombre del jugador)
- Sistema de vida (protección que se consume al recibir daño)
- Nombre del jugador editable en pantalla inicial
- Persistencia del nombre del jugador en localStorage
- Sistema de explosiones con partículas al destruir asteroides
- Física de split con impulso hacia arriba y normalización de velocidad

## Estructura del Proyecto
```
blasto/
├── index.html          # Production entry point (.min.js)
├── index.dev.html      # Development entry point (.js, gitignored)
├── css/
│   └── styles.css      # UI styles
├── js/
│   ├── game.js         # Core game loop, collisions, explosions
│   ├── player.js       # Player ship, shooting, rockets
│   ├── asteroid.js     # Asteroid system, split physics
│   ├── boss.js         # Boss enemies
│   └── powerup.js      # Power-up system
├── BALANCE.md          # Balance parameters (actualizado)
└── AGENTS.md          # Agent instructions
```

## Tecnología
- HTML5 Canvas 2D para rendering
- JavaScript vanilla (ES6+)
- esbuild para minificación
- Sin frameworks ni bundlers para desarrollo

## Controles
- Touch/dedo o mouse en cualquier parte de la pantalla para mover nave izq/der
- Disparo automático continuo hacia arriba (no requiere botón)
- Tap en nombre del jugador (esquina superior izq) para pausar
- Tecla P o Escape para pausar

## Pantalla Inicial
- Input para nombre del jugador (default: "Player 1", máximo 12 caracteres)
- Título "BLASTO"
- "Tap to Start"
- Botón "How to Play"
- El nombre se guarda en localStorage y se restaura al recargar

## HUD (Durante el juego)
```
┌─────────────────────────────────────────────────────────────┐
│  PLAYER          PTS           HIGH                         │
│  kabir ⏸       1250          4005                           │
└─────────────────────────────────────────────────────────────┘
```
- Tap en "kabir ⏸" para pausar
- Cuando está pausado, el icono cambia a "▶"

## Gameplay Loop
1. Inicio con 2 asteroides (izquierda y derecha)
2. Cada 70 puntos → verifica spawn de power-up
3. A los 150 puntos → 12% probabilidad de vida extra
4. Cada 300 puntos → aparece jefe final
5. Asteroides spawn con probabilidades fijas (40/30/20/6/4%)
6. 1 toque de asteroide = Game Over (a menos que tengas power-up de vida)
7. Con power-up de vida: al recibir daño, se consume la protección y el juego continúa

## Power-ups
Los power-ups aparecen como círculos con iconos. Requieren **7 disparos** para activarse.

| Power-up | Icono | Efecto | Duración |
|----------|-------|--------|----------|
| Triple disparo | ⚡ | Normal + 2 a 30° | 10s |
| Cohete | 🚀 | Destruye asteroide más grande | Instantáneo |
| Escudo | 🛡 | Bloquea 1 impacto | 10s |
| Congelar | ❄ | Asteroides 50% más lentos | 8s |
| Vida extra | ❤ | Protege de 1 impacto | Until hit |

## Estados del Juego
- **Start**: Pantalla de inicio con input de nombre, título "BLASTO", "Tap to Start"
- **Playing**: Gameplay activo con HUD (PLAYER, PTS, HIGH)
- **Paused**: Overlay "PAUSED - Tap to Resume"
- **Game Over**: Título "GAME OVER" centrado, nombre en línea propia, score en otra línea, "Tap to Restart"
- **Instructions**: Cómo jugar con iconos de power-ups

## Indicadores de Power-up (UI Actual)
- Iconos en la parte inferior de la pantalla
- Glow dinámico que se desvanece con el tiempo
- Parpadeo suave cuando quedan ≤ 3 segundos
- Fade-out suave al expirar
- LIFE se muestra con opacidad fija (infinito hasta hit)

## Jefes Finales
- Aparecen cada 300 puntos
- Se mueven de izquierda a derecha (100 px/s)
- Disparan al jugador cada 0.6 segundos (225 px/s)
- HP: 350

## Persistencia
- Nombre del jugador: `localStorage.setItem('blasto_playerName', name)`
- High score: `localStorage.setItem('blasto_high', score)`

## Efectos Visuales
- Explosiones de partículas al destruir asteroides (12 partículas radiales)
- Split con impulso hacia arriba y normalización de velocidad después de 500ms
- Glow en indicadores de power-up con parpadeo suave

## Historial de Desarrollo
| Fecha | Descripción |
|-------|-------------|
| 28/04/2026 | Versión inicial - concepto y balance |
| 29/04/2026 | Implementación de power-ups, pausa, indicadores |
| 30/04/2026 | Jugador dispara solo hacia arriba |
| 01/05/2026 | Asteroides spawnean hacia el centro; Split con apertura |
| 02/05/2026 | Sistema completo renovado: 30 balas/s, daño 1, HP 10-100, spawn probabilístico, glow dinámico power-ups, física split con salto |