FROM node:16-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc ./

RUN apk add autoconf automake

RUN yarn install --frozen-lockfile

ENV NODE_ENV "production"

ENV VITE_APP_NAME "Dust-Mail"

COPY . .

RUN yarn build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80