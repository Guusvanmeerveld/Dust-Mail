# 
# This Dockerfile combines both the client and the server into a single container
# 

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

ENV VITE_DEFAULT_SERVER "/api"

RUN pnpm run build

RUN pnpm --filter @dust-mail/client --prod deploy /app/client
RUN pnpm --filter @dust-mail/server --prod deploy /app/server

# Run nginx + api
FROM nginx:stable-alpine as runner

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.16/main/ nodejs=16.16.0-r0

COPY --from=deployer /app/client/dist /client

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

WORKDIR /server

ENV NODE_ENV "production"

ENV BASE_PATH "api"

COPY --from=deployer /app/server/dist ./dist
COPY --from=deployer /app/server/node_modules ./node_modules
COPY --from=deployer /app/server/package.json ./package.json

COPY entrypoint.sh .

COPY apps/server/public public

CMD [ "./entrypoint.sh" ]