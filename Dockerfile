# 
# This Dockerfile combines both the client and the server into a single container
# 

ARG BASE_IMAGE=node:16-alpine

# Build client
FROM $BASE_IMAGE AS client-builder

WORKDIR /app

COPY ./packages/client/package.json ./

RUN yarn install --frozen-lockfile

COPY ./packages/client .

ENV NODE_ENV "production"

ENV VITE_DEFAULT_SERVER "/api"

ENV VITE_APP_NAME "Dust-Mail"

RUN yarn build

# Build server
FROM $BASE_IMAGE AS server-builder

WORKDIR /app

COPY ./packages/server/package.json ./packages/server/yarn.lock  ./

RUN yarn install --frozen-lockfile

COPY ./packages/server .

RUN yarn build

RUN yarn install --production --ignore-scripts --prefer-offline

# Run nginx + api
FROM nginx:stable-alpine as runner

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0

COPY --from=client-builder /app/dist /client

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

WORKDIR /server

ENV NODE_ENV "production"

ENV BASE_PATH "api"

COPY --from=server-builder /app/dist ./dist
COPY --from=server-builder /app/node_modules ./node_modules
COPY --from=server-builder /app/package.json ./package.json

COPY entrypoint.sh .

COPY packages/server/public public

CMD [ "./entrypoint.sh" ]