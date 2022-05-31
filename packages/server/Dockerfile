ARG BASE_IMAGE=node:12-alpine

# Builder
FROM $BASE_IMAGE AS builder

WORKDIR /app

COPY . .

RUN apk add git

RUN yarn install --frozen-lockfile

RUN yarn build

RUN yarn install --production --ignore-scripts --prefer-offline

# Runner
FROM $BASE_IMAGE AS runner

WORKDIR /app

ENV NODE_ENV production

RUN mkdir /apk

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

CMD ["yarn", "start:prod"]