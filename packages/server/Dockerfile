ARG BASE_IMAGE=node:16-alpine

# Builder
FROM $BASE_IMAGE AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

RUN yarn install --production --ignore-scripts --prefer-offline

# Runner
FROM alpine AS runner

WORKDIR /app

COPY public public

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0

ENV NODE_ENV "production"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["node", "dist/main"]