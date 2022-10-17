ARG BASE_IMAGE=node:16-alpine 

# Builder
FROM $BASE_IMAGE as deployer

RUN apk add --no-cache curl git

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

WORKDIR /repo

COPY pnpm-lock.yaml ./

RUN pnpm fetch

COPY apps ./apps
COPY packages ./packages

COPY package.json pnpm-workspace.yaml .npmrc turbo.json ./

RUN pnpm install -r --offline --ignore-scripts

RUN pnpm run build --filter @dust-mail/server 

RUN pnpm --filter @dust-mail/server --prod deploy /app

# Runner
FROM alpine AS runner

WORKDIR /app

COPY apps/server/public public

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.16/main/ nodejs=16.17.1-r0

ENV NODE_ENV "production"

ENV JWT_SECRET_LOCATION "/data/jwt/secret"

ENV CACHE_DIR "/data/cache"

RUN mkdir /data/jwt /data/cache -p

COPY --from=deployer /app/dist ./dist
COPY --from=deployer /app/node_modules ./node_modules
COPY --from=deployer /app/package.json ./package.json

CMD ["node", "dist/main"]