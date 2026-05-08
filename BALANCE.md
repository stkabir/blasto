# Blasto - Game Balance

## Parámetros del Jugador
| Parámetro | Valor |
|-----------|-------|
| Cadencia de disparo | 30 por segundo (33ms) |
| Daño por impacto | 1 |
| Velocidad de movimiento | 350 px/s |
| Posición inicial | Centro-abajo |
| Apuntado | Solo hacia arriba (sin mira) |
| Movimiento | Solo izquierda/derecha |

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
| Parámetro | Valor |
|-----------|-------|
| Aparece cada | 1000 puntos |
| Puntos al destruir | 350 |
| HP | 350 |
| Velocidad movimiento | 100 px/s (izq → der) |
| Disparos | 225 px/s cada 0.6 segundos |

## Sistema de Power-ups

### Spawn
- Cada 70 puntos se verifica spawn
- Si score >= 150 y no hay vida activa: 12% chance vida, sinon spawn random
- Spawn random: 25% probabilidad (TRIPLE, ROCKET, SHIELD, FREEZE)

### Distribución
| Power-up | Probabilidad | Efecto | Duración | HP para activar |
|----------|--------------|--------|----------|-----------------|
| Triple disparo | 25% | Normal + 2 a 30° | 10s | 7 |
| Cohete | 25% | Destruye asteroide más grande | Instantáneo | 7 |
| Escudo | 25% | Bloquea todo | 10s | 7 |
| Congelar | 25% | Asteroides 50% más lentos | 8s | 7 |
| Vida extra | 12% (conditional) | Protege de 1 impacto | Until hit | 7 |

### Comportamiento de Vida Extra
- Se activa al recibir 7 disparos en el power-up de vida
- El indicador muestra el icono ❤
- Cuando el jugador recibe daño de un asteroide o bala de jefe:
  - Si hay escudo activo, el escudo se consume en lugar de la vida
  - Si hay vida activa, la vida se consume y el juego continúa
- Cuando la vida se consume, la protección desaparece
- Si el jugador recibe daño sin vida ni escudo, es Game Over

### Sistema de Activación por Disparo
Todos los power-ups requieren **7 disparos** para ser activados:
- Cada disparo que impacta el power-up reduce su HP en 1
- Al llegar a 0 HP, el power-up se activa
- Los disparos que impactan son eliminados

### Reset de Tiempos
Cuando un power-up ya está activo y destruyes otro del mismo tipo:
- El tiempo se **RESETEAA** la duración completa (no se suma)
- Ejemplo: Si SHIELD tiene 6s y destruyes otro SHIELD → quedan 10s

## Efecto de Congelar
- **SOLO afecta a asteroides**
- Jugador, jefe, balas del jugador y balas del jefe NO se ven afectados
- Velocidad de asteroides reducida al 50%

## DPS (Damage Per Second) Analysis

### Sin power-ups
- Disparos normales: 30 DPS (30/s × 1 daño)
- LIGHT (10HP): 0.33s para destruir
- MED (20HP): 0.67s
- BLUE (35HP): 1.17s
- PURPLE (50HP): 1.67s
- RED (100HP): 3.33s

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