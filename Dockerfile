FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY build.js ./build.js
COPY js/ ./js/

RUN pnpm build

FROM nginx:alpine

COPY --from=builder /app/js/*.min.js /usr/share/nginx/html/js/
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]