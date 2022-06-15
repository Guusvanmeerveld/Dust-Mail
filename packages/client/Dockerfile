FROM node:12-alpine AS builder

WORKDIR /app

COPY . .

RUN yarn install --frozen-lockfile

ENV NODE_ENV "production"

ENV VITE_APP_NAME "Dust-Mail"

RUN yarn build


FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80