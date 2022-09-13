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

RUN pnpm run build --filter @dust-mail/web 

RUN pnpm --filter @dust-mail/web --prod deploy /app

FROM nginx:alpine AS runner

COPY --from=deployer /app/dist /usr/share/nginx/html

EXPOSE 80