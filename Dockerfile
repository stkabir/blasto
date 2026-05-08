FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY build.js ./build.js
COPY js/ ./js/

RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY --from=builder /app/js/*.min.js ./js/

COPY server/ ./server/
COPY index.html ./
COPY css/ ./css/

EXPOSE 3000

CMD ["node", "server/index.js"]