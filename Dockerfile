FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY tsconfig.json ./tsconfig.json
COPY build.js ./build.js
COPY src/ ./src/

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/dist/game.min.js /usr/share/nginx/html/dist/
COPY css/ /usr/share/nginx/html/css/
COPY index.html /usr/share/nginx/html/
COPY favicon.svg /usr/share/nginx/html/
COPY favicon.png /usr/share/nginx/html/
COPY favicon-64.png /usr/share/nginx/html/
COPY favicon-128.png /usr/share/nginx/html/
COPY favicon-192.png /usr/share/nginx/html/
COPY favicon-512.png /usr/share/nginx/html/
COPY social.png /usr/share/nginx/html/
COPY robots.txt /usr/share/nginx/html/
COPY sitemap.xml /usr/share/nginx/html/
COPY site.webmanifest /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
