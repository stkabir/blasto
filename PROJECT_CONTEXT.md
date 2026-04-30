# BLAStO - Game Design Document

## Concepto
Blasto es un juego arcade de tipo shooter para iOS. El jugador controla una nave en la parte inferior de la pantalla, disparando automáticamente hacia arriba. La nave se mueve de izquierda a derecha siguiendo el dedo del usuario.

## Características Principales
- Disparo automático continuo (6/s) hacia arriba
- Control táctil intuitivo (mover nave izq/der con un dedo)
- Sistema de power-ups (5 tipos)
- Jefes finales periódicamente
- Asteroides que se dividen al destruirse
- Progresión de dificultad
- Sistema de pausa (tap en nombre del jugador)
- Sistema de vida (protección que se consume al recibir daño)
- Nombre del jugador editable en pantalla inicial
- Persistencia del nombre del jugador en localStorage

## Estructura del Proyecto
```
blasto/
├── index.html          # Entry point
├── css/
│   └── styles.css      # UI styles
├── js/
│   ├── game.js         # Core game loop
│   ├── player.js       # Player ship & controls
│   ├── asteroid.js     # Asteroid system
│   ├── boss.js         # Boss enemies
│   └── powerup.js      # Power-up system
├── PROJECT_CONTEXT.md  # This file
└── BALANCE.md          # Balance parameters
```

## Tecnología
- HTML5 Canvas para rendering
- Capacitor para empaquetado iOS
- JavaScript vanilla (sin frameworks)
- Audio con Web Audio API

## Controles
- Touch/dedo en cualquier parte de la pantalla para mover nave izq/der
- Disparo automático continuo hacia arriba (no requiere botón)
- Tap en nombre del jugador (esquina superior izq) para pausar
- Tecla P o Escape para pausar

## Pantalla Inicial
- Input para nombre del jugador (default: "Player 1", máximo 12 caracteres)
- Título "BLASTO"
- "Tap to Start"
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
2. Cada 50 puntos → 25% probabilidad de power-up
3. A los 150 puntos → 12% probabilidad de vida extra (22% los otros)
4. Cada 300 puntos → aparece jefe final
5. Asteroides rojos aparecen a los 200 puntos
6. 1 toque de asteroide = Game Over (a menos que tengas power-up de vida)
7. Con power-up de vida: al recibir daño, se consume la protección y el juego continúa normalmente

## Power-ups
Los power-ups aparecen como asteroides transparentes con iconos. Requieren **7 disparos** para activarse.

| Power-up | Icono | Efecto | Duración |
|----------|-------|--------|----------|
| Triple disparo | ⚡ | Normal + 2 a 30° | 8s |
| Cohete | 🚀 | Daño 200, busca asteroide más grande | 1 impacto |
| Escudo | 🛡 | Bloquea 1 impacto de cualquier fuente | 7s |
| Congelar | ❄ | Asteroides 50% más lentos | 7s |
| Vida extra | ❤ | Protege de 1 impacto, luego se consume | Until hit |

## Estados del Juego
- **Start**: Pantalla de inicio con input de nombre, título "BLASTO", "Tap to Start"
- **Playing**: Gameplay activo con HUD (PLAYER, PTS, HIGH)
- **Paused**: Overlay "PAUSED - Tap to Resume"
- **Game Over**: Título "GAME OVER" centrado, nombre en línea propia, score en otra línea, "Tap to Restart"

## Indicadores de Power-up
Cuando un power-up con duración está activo, aparece un icono en la parte inferior de la pantalla. El icono tiene una sombra oscura que crece desde afuera hacia adentro representando el tiempo restante (sin texto de segundos).

## Jefes Finales
- Aparecen cada 300 puntos
- Valen 350 puntos al destruir
- Se mueven de izquierda a derecha
- Disparan al jugador cada 2 segundos
- Velocidad de balas: 200 px/s

## Persistencia
- Nombre del jugador: `localStorage.setItem('blasto_playerName', name)` y se restaura al recargar sincronizando con el input
- High score: `localStorage.setItem('blasto_high', score)`

## Historial de Desarrollo
| Fecha | Descripción |
|-------|-------------|
| 28/04/2026 | Versión inicial - concepto y balance |
| 29/04/2026 | Implementación de power-ups, pausa, indicadores visuales |
| 30/04/2026 | Jugador dispara solo hacia arriba; Velocidad 250px/s; Cadencia 6/s; Power-ups requieren 7 disparos para activar; Nombre del jugador editable en start screen |
| 01/05/2026 | Fix: nombre de jugador se sincroniza con input al recargar; Game Over muestra nombre y score separados en líneas diferentes |