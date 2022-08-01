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

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0

ENV NODE_ENV "production"

COPY --from=deployer /app/dist ./dist
COPY --from=deployer /app/node_modules ./node_modules
COPY --from=deployer /app/package.json ./npackage.json

CMD ["node", "dist/main"]