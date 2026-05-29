# Blasto - Game Balance

## Parámetros del Jugador
| Parámetro | Valor |
|-----------|-------|
| Cadencia de disparo | 40 por segundo (25ms) |
| Daño por impacto | 1 |
| Velocidad de movimiento | 350 px/s |
| Radio de colisión | 18 |
| Posición inicial | Centro-abajo |
| Apuntado | Solo hacia arriba (sin mira) |
| Movimiento | Solo izquierda/derecha |

## Diseños de Nave
| ID | Nombre | Color Default |
|----|--------|---------------|
| triangle | Triángulo | #22d3ee |
| diamond | Diamante | #e879f9 |
| wing | Ala | #a3e635 |
| hexagon | Hexágono | #38bdf8 |
| star | Estrella | #facc15 |
| crescent | Media Luna | #cbd5e1 |
| crux | Cruz | #f43f5e |
| phoenix | Fénix | #f97316 |
| viper | Víbora | #84cc16 |
| falcon | Halcón | #38bdf8 |

## Estilos de Bala
| ID | Nombre |
|----|--------|
| glow | Brillo |
| elongated | Alargado |
| dual | Doble |
| beam | Láser |
| spark | Chispa |
| vortex | Vórtice |
| plasma | Plasma |

## Sistema de Asteroides

### Niveles de Asteroides
| Color | HP | Velocidad de caída (px/s) | Radio |
|-------|----|--------------------------|-------|
| Verde claro (LIGHT) | 10 | 70 | 20 |
| Verde obscuro (MED) | 20 | 50 | 28 |
| Azul (BLUE) | 35 | 50 | 30 |
| Morado (PURPLE) | 50 | 40 | 38 |
| Rojo (RED) | 100 | 30 | 46 |

### Spawn de Asteroides
- Probabilidades fijas (no basadas en score):
  - LIGHT: 40%
  - MED: 30%
  - BLUE: 20%
  - PURPLE: 6%
  - RED: 4%
- Posición horizontal aleatoria
- Caen hacia el centro con ángulo

### Sistema de Split (División)
Al destruir un asteroide, se divide en 2 del siguiente nivel inferior:
- LIGHT (10HP) → NO se divide (es el más pequeño)
- MED (20HP) → 2 × LIGHT
- BLUE (35HP) → 2 × MED
- PURPLE (50HP) → 2 × BLUE
- RED (100HP) → 2 × PURPLE

**Física del split:**
- Impulso vertical hacia arriba: -80 a -120 (pequeño salto)
- Velocidad horizontal: 10% de la velocidad base
- Después de 500ms sin gravedad, el vy se normaliza a fallSpeed
- Los dos hijos se abren en direcciones opuestas (±vx aleatorio)

## Jefes Finales

### Selección
- Aparecen cada **5 waves** (wave 5, 10, 15, 20...)
- El tipo se elige **aleatoriamente** entre los 4 tipos, sin repetir el anterior
- Al destruir cualquier jefe: **+5000 puntos** de bonus
- HP escala con wave: `HP = base × (1 + wave × 0.05)`

### Tipos de Jefe

| Tipo | HP Base | Movimiento | Disparo | Tamaño | Diseño |
|------|---------|------------|---------|--------|--------|
| **horizontal** | 350 | Horizontal 100 px/s, rebota bordes | 1 bala recta abajo, 600ms | 80×60 | Nave alien pentagonal, ojos rojos |
| **asteroid_spawner** | 300 | Estático en centro de pantalla, wobble senoidal | No dispara | r=80 circular | Asteroide negro grande y redondo, grietas rojas brillantes |
| **pattern** | 300 | Horizontal 130 px/s, rebota bordes | Abanico 3-balas (±20°), 800ms | 90×50 | Nave alien en V, ojos cian |
| **stationary** | 500 | Fijo centro-arriba (y=100) | Radial 5-balas (±35°), 700ms | 140×90 | Fortaleza metálica, 3 torretas, núcleo brillante |

### Especial: Asteroide Madre
- Aparece en el **centro de la pantalla**
- Invoca **1 asteroide MED** (20HP, verde obscuro) cada **2 segundos** desde su centro
- Los asteroides invocados se comportannormal (se dividen si se destruyen)
- Colisión circular (radio 80px)
- No dispara balas — su amenaza son los asteroides que genera + colisión corporal

### Escala de HP por Wave
| Wave | horizontal | asteroid_spawner | pattern | stationary |
|------|------------|------------------|---------|------------|
| 5    | 437        | 375              | 375     | 625        |
| 10   | 525        | 450              | 450     | 750        |
| 15   | 612        | 525              | 525     | 875        |
| 20   | 700        | 600              | 600     | 1000       |
| 25   | 787        | 675              | 675     | 1125       |
| 30   | 875        | 750              | 750     | 1250       |

### Anuncios de Aparición
| Tipo | Texto | Color | Tamaño |
|------|-------|-------|--------|
| Todos | ¡JEFE! | Rojo #ef4444 | 80px |

### Colores de Explosión al Morir
| Tipo | Color |
|------|-------|
| horizontal | Rojo #ef4444 |
| pattern | Púrpura #a855f7 |
| asteroid_spawner | Gris #6b7280 |
| stationary | Ámbar #f59e0b |

## Sistema de Power-ups

### Spawn
- Cada **10 kills** de asteroides se verifica spawn
- Si no hay vida activa: **8%** chance de vida
- Si no sale vida: **15%** chance de power-up regular (TRIPLE, ROCKET, SHIELD, FREEZE)
- Probabilidad efectiva por ciclo (cada 10 kills):
  - LIFE: 8% (solo si no hay vida activa)
  - Regular: 15%
  - Sin spawn: 77%
- Power-up cae a 60 px/s (30 px/s con FREEZE activo)

### Distribución
| Power-up | Probabilidad | Efecto | Duración | HP para activar |
|----------|--------------|--------|----------|-----------------|
| Triple disparo | 25% (dentro del 15%) | Normal + 2 a 30° | 10s | 7 |
| Cohete | 25% (dentro del 15%) | Destruye asteroide más grande | Instantáneo | 7 |
| Escudo | 25% (dentro del 15%) | Bloquea todo | 10s | 7 |
| Congelar | 25% (dentro del 15%) | Asteroides 50% más lentos | 8s | 7 |
| Vida extra | 8% (independiente) | Protege de 1 impacto | Until hit | 7 |

### Comportamiento de Vida Extra
- Se activa al recibir 7 disparos en el power-up de vida
- El indicador muestra el icono ❤
- Cuando el jugador recibe daño de un asteroide o bala de jefe:
  - Si hay escudo activo, el escudo se consume en lugar de la vida
  - Si hay vida activa, la vida se consume y el juego continúa
- Después de perder la vida: **4 segundos de invulnerabilidad** (parpadeo)
- Cuando la vida se consume, la protección desaparece
- Si el jugador recibe daño sin vida ni escudo, es Game Over

### Sistema de Activación por Disparo
Todos los power-ups requieren **7 disparos** para ser activados:
- Cada disparo que impacta el power-up reduce su HP en 1
- Al llegar a 0 HP, el power-up se activa
- Los disparos que impactan son eliminados

### Reset de Tiempos
Cuando un power-up ya está activo y destruyes otro del mismo tipo:
- El tiempo se **RESETEA** a la duración completa (no se suma)
- Ejemplo: Si SHIELD tiene 6s y destruyes otro SHIELD → quedan 10s

## Efecto de Congelar
- **SOLO afecta a asteroides**
- Jugador, jefe, balas del jugador y balas del jefe NO se ven afectados
- Velocidad de asteroides reducida al 50% (tanto caída como movimiento horizontal)

## DPS (Damage Per Second) Analysis

### Sin power-ups
- Disparos normales: **40 DPS** (40/s × 1 daño)
- LIGHT (10HP): 0.25s para destruir
- MED (20HP): 0.50s
- BLUE (35HP): 0.88s
- PURPLE (50HP): 1.25s
- RED (100HP): 2.50s

### Con Triple Disparo (40/s × 3 balas)
- DPS efectivo: **~120** (si todas las balas impactan)
- LIGHT (10HP): ~0.08s
- RED (100HP): ~0.83s

## Indicador Visual de Power-up
- Iconos con glow que se desvanece proporcional al tiempo restante
- Box-shadow, background, border y text-shadow con opacidad basada en progress
- Parpadeo suave cuando quedan ≤ 3 segundos (Math.sin con período 200ms)
- Fade-out suave al expirar (300ms transition)
- LIFE se muestra con opacidad fija (infinito hasta hit)

## Historial de Cambios
| Fecha | Descripción |
|-------|-------------|
| 28/04/2026 | Versión inicial del balance |
| 29/04/2026 | Freeze solo afecta asteroides; Vida no hace respawn |
| 30/04/2026 | Jugador dispara solo hacia arriba; Cadencia 6/s |
| 01/05/2026 | Asteroides spawnean hacia el centro; Split con apertura |
| 02/05/2026 | Sistema nuevo: 30 balas/s, daño 1, HP escalado 10-100, spawn probabilístico, glow dinámico en power-ups, física de split con salto hacia arriba |
| 23/05/2026 | Cadencia corregida a 40/s (25ms); spawn power-ups cada 10 kills (8% vida, 15% regular); +6 naves +4 balas; DPS recalculado; invulnerabilidad post-vida documentada |
| 25/05/2026 | Sistema de 4 tipos de jefe: horizontal, asteroid_spawner, pattern, stationary; selección aleatoria sin repetir; HP escala con wave; bonus 5000 pts; asteroid_spawner invoca LIGHT cada 2s |
