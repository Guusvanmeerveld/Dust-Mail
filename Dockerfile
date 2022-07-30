# 
# This Dockerfile combines both the client and the server into a single container
# 

FROM base as deployer

WORKDIR /repo

RUN pnpm --filter @dust-mail/client --prod deploy /app/client
RUN pnpm --filter @dust-mail/server --prod deploy /app/server

# Run nginx + api
FROM nginx:stable-alpine as runner

RUN apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/v3.11/main/ nodejs=12.22.6-r0

COPY --from=deployer /app/client/dist /client

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

WORKDIR /server

ENV NODE_ENV "production"

ENV BASE_PATH "api"

COPY --from=deployer /app/server/dist ./dist
COPY --from=deployer /app/server/node_modules ./node_modules

COPY entrypoint.sh .

COPY apps/server/public public

CMD [ "./entrypoint.sh" ]