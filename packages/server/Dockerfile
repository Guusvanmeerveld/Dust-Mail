ARG BASE_IMAGE=node:16-alpine

# Builder
FROM $BASE_IMAGE AS builder

WORKDIR /app

COPY package.json ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

RUN yarn install --production --ignore-scripts --prefer-offline

# Runner
FROM $BASE_IMAGE AS runner

WORKDIR /app

COPY public public

ENV NODE_ENV "production"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["yarn", "start:prod"]