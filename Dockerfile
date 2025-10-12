FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl openssl-dev \
    && npm install -g pnpm turbo \
    && npm install -g tsx \
    && rm -rf /root/.npm

COPY . .

RUN pnpm install --filter @oppskills/backend... \
    && pnpm run build:backend \
    && rm -rf /root/.local /root/.cache

EXPOSE 3001

CMD ["sh", "-c", "pnpm start:backend"]