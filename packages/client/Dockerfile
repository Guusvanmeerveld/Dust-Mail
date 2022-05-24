FROM node:16-alpine AS builder

WORKDIR /app

COPY . .

RUN yarn install --frozen-lockfile

ENV NODE_ENV "production"

RUN yarn build


FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80