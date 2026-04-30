# Blasto - Game Balance

## Parámetros del Jugador
| Parámetro | Valor |
|-----------|-------|
| Cadencia de disparo | 6 por segundo |
| Daño por impacto | 10 |
| Velocidad de movimiento | 250 px/s |
| Posición inicial | Centro-abajo |
| Apuntado | Solo hacia arriba (sin mira) |
| Movimiento | Solo izquierda/derecha |

## Sistema de Asteroides

### Niveles de Asteroides
| Color | Puntos | HP (disparos) | Velocidad (px/s) | Velocidad congelado |
|-------|--------|---------------|------------------|---------------------|
| Verde claro | 15 | 6 | 80-120 | 40-60 |
| Verde obscuro | 30 | 12 | 70-100 | 35-50 |
| Azul | 60 | 24 | 60-90 | 30-45 |
| Morado | 120 | 48 | 50-80 | 25-40 |
| Rojo | 240 | 96 | 40-60 | 20-30 |

### Spawn de Asteroides
- Inicio: 2 asteroides (1 izq, 1 der)
- Frecuencia inicial: cada 2 segundos
- Rojos aparecen: a los 200 puntos
- Progresión: más asteroides y más rápidos con el tiempo

### Sistema de Split (División)
Al destruir un asteroide, se divide en 2 del siguiente nivel inferior:
- Verde claro (6HP) → NO se divide (es el más pequeño)
- Verde obscuro (12HP) → 2 × Verde claro
- Azul (24HP) → 2 × Verde obscuro
- Morado (48HP) → 2 × Azul
- Rojo (96HP) → 2 × Morado

## Jefes Finales
| Parámetro | Valor |
|-----------|-------|
| Aparece cada | 300 puntos |
| Puntos al destruir | 350 |
| HP | 350 (35 impactos de 10 daño) |
| Velocidad movimiento | 100 px/s (izq → der) |
| Disparos | 225 px/s cada 0.6 segundos |
| Tiempo para matar (solo normal) | 3.5 segundos |

## Sistema de Power-ups

### Distribución (cada 50 puntos)
| Power-up | Probabilidad | Efecto | Duración | Disparos para activar |
|----------|--------------|--------|----------|------------------------|
| Triple disparo | 25% | Normal + 2 a 30° | 8s | 7 |
| Cohete | 25% | 200 daño, busca rojo | 1 impacto | 7 |
| Escudo | 25% | Bloquea todo | 7s | 7 |
| Congelar | 25% | Asteroides 50% más lentos | 7s | 7 |

### Power-up Especial - Vida Extra
| Parámetro | Valor |
|-----------|-------|
| Aparece a los | 150 puntos |
| Probabilidad | 12% |
| Efecto | Protege de 1 impacto (asteroide o bala de jefe), luego se consume |
| Disparos para activar | 7 |

### Comportamiento de Vida Extra
- Se activa al recibir 7 disparos en el power-up de vida
- El indicador muestra el icono ❤
- Cuando el jugador recibe daño de un asteroide o bala de jefe:
  - Si hay escudo activo, el escudo se consume en lugar de la vida
  - Si hay vida activa, la vida se consume y el juego continúa normalmente (sin respawn, sin limpiar asteroides)
- Cuando la vida se consume, la protección desaparece
- Si el jugador recibe daño nuevamente sin vida ni escudo, es Game Over

### Sistema de Activación por Disparo
Todos los power-ups (excepto vida que aparece a los 150pts) requieren **7 disparos** para ser activados:
- Cada disparo que impacta el power-up reduce su HP en 1
- Al llegar a 0 HP, el power-up se activa
- Los disparos que impactan son eliminados

## Efecto de Congelar
- **SOLO afecta a asteroides**
- Jugador, jefe, balas del jugador y balas del jefe NO se ven afectados
- Velocidad de asteroides reducida al 50%

## DPS (Damage Per Second) Analysis

### Sin power-ups
- Disparos normales: 60 DPS (6/s × 10 daño)
- Verde claro (6HP): 1s para destruir
- Verde obscuro (12HP): 2s
- Azul (24HP): 4s
- Morado (48HP): 8s
- Rojo (96HP): 16s
- Jefe (35HP): 5.8s

### Con Power-ups
| Power-up | DPS resultante | Efecto en rojo |
|----------|----------------|----------------|
| Normal | 60 | 2.67s |
| Triple disparo | 180 | ~0.9s |
| Cohete | 200 instantáneo | reduce 16HP → 0HP |

## Notas de Balance
- El juego está diseñado para ser desafiante pero justo
- Los power-ups dan ventaja significativa pero no dominancia
- Los rojos representan amenaza real por su HP alto
- Los jefes requieren constancia (~6s de fuego continuo)
- La velocidad del jugador (250px/s) permite esquivar fácilmente
- Los disparos del jefe (200px/s) requieren reacción pero son evitables
- Freeze SOLO afecta asteroides - no al jugador ni a los jefes
- El power-up de vida NO hace respawn - solo consume la protección y continúa el juego
- El jugador dispara solo hacia arriba (sin mira móvil)

## Indicador Visual de Power-up
Cuando un power-up con duración está activo:
- Icono centrado en un div de 40x40px
- Sombra oscura (`rgba(11, 16, 23, 0.85)`) que crece desde afuera hacia adentro
- El progreso de la sombra está controlado por `--progress` CSS custom property
- `clip-path: inset((1 - progress) * 50%)` - cuando progress=1, sombra invisible; cuando progress=0, sombra cubre todo
- Sin texto de segundos visible

## Historial de Cambios
| Fecha | Descripción |
|-------|-------------|
| 28/04/2026 | Versión inicial del balance |
| 29/04/2026 | Freeze solo afecta asteroides; Vida no hace respawn, solo consume protección; Indicador visual con sombra sin texto |
| 30/04/2026 | Jugador dispara solo hacia arriba; Velocidad 250px/s; Cadencia 6/s; Power-ups requieren 7 disparos para activar; Boss: 1s fire interval, 225 bullet speed; Asteroides HP: 4/8/16/32/64 |