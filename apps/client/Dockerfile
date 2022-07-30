FROM base as deployer

WORKDIR /repo

RUN pnpm --filter @dust-mail/client --prod deploy /app

FROM nginx:alpine AS runner

COPY --from=deployer /app/dist /usr/share/nginx/html

EXPOSE 80