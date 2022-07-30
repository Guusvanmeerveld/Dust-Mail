FROM base as deployer

WORKDIR /repo

RUN pnpm --filter @dust-mail/server --prod deploy /app

# Runner
FROM alpine AS runner

WORKDIR /app

COPY apps/server/public public

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0

ENV NODE_ENV "production"

COPY --from=deployer /app/dist ./dist
COPY --from=deployer /app/node_modules ./node_modules

CMD ["node", "dist/main"]