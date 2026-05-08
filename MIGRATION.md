# Migración a VPS con Dokploy

Guía para migrar el juego completo (frontend + leaderboard API) a tu VPS con Dokploy.

## 1. Desplegar la API del Leaderboard

### En Dokploy:

1. Crear nuevo **Application** → seleccionar **Dockerfile**
2. Conectar el repositorio (o subir la carpeta `server/`)
3. Configurar **Dockerfile path**: `server/Dockerfile`
4. Agregar **MariaDB** como servicio vinculado en Dokploy (Database → MariaDB)
5. Configurar **Environment Variables**:

```
DB_HOST=mariadb          (el nombre del servicio en Dokploy)
DB_USER=root
DB_PASS=tu_password
DB_NAME=blasto
DB_PORT=3306
ALLOWED_ORIGIN=https://tu-dominio.com
PORT=3000
```

6. **Deploy** — la tabla `scores` se crea automáticamente al iniciar
7. Verificar: `https://tu-api-dominio.com/api/health` → `{"status":"ok"}`

### Inicializar la tabla manualmente (opcional):

Si prefieres crear la tabla manualmente, ejecuta el SQL en MariaDB:

```bash
docker exec -i <mariadb_container> mysql -uroot -ptu_password blasto < server/init.sql
```

## 2. Desplegar el Frontend

### Opción A: Seguir en Netlify (recomendado para empezar)

Solo necesitas cambiar la variable de entorno en Netlify:

1. Netlify → Site → Environment Variables
2. Cambiar `LEADERBOARD_API_URL` a la URL de tu API en Dokploy
3. Redesplegar

### Opción B: Migrar todo al VPS

1. Crear otro **Application** en Dokploy (o un **Compose** que incluya ambos)
2. Servir los archivos estáticos del juego con nginx o un servidor Node simple:

```javascript
// server/static.js
const express = require('express');
const app = express();
app.use(express.static(__dirname + '/../'));
app.listen(8080);
```

3. O usar Dockerfile multi-stage:

```dockerfile
FROM node:20-alpine AS api
WORKDIR /app
COPY server/package.json ./
RUN npm install --production
COPY server/server.js ./

FROM nginx:alpine
COPY --from=api /app /api
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

4. Configurar nginx para servir el frontend y proxy al API:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
    }
}
```

5. Eliminar las Netlify Functions (`netlify/`) y `netlify.toml`
6. Cambiar las llamadas fetch en `js/game.js`:
   - `/.netlify/functions/submit-score` → `/api/scores` (POST)
   - `/.netlify/functions/get-leaderboard` → `/api/scores` (GET)

## 3. Variables de entorno resumen

### Netlify (si sigues ahí):
| Variable | Valor |
|----------|-------|
| `LEADERBOARD_API_URL` | `https://tu-api-dominio.com` |

### Dokploy (API):
| Variable | Valor |
|----------|-------|
| `DB_HOST` | `mariadb` (nombre del servicio) |
| `DB_USER` | `root` |
| `DB_PASS` | tu password |
| `DB_NAME` | `blasto` |
| `ALLOWED_ORIGIN` | `https://tu-dominio.com` |
| `PORT` | `3000` |

## 4. Verificar después de migrar

1. `GET https://tu-api/api/health` → `{"status":"ok"}`
2. Jugar una partida → verificar que el score se envía
3. Verificar leaderboard global en la pantalla de game over
4. Verificar que los scores persisten después de reiniciar el contenedor
