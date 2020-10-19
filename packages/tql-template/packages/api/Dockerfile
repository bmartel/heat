FROM node:12-alpine

RUN apk add --update \
    python \
    python-dev \
    build-base \
    curl \
    && rm -rf /var/cache/apk/* \
    && curl -L https://dl.minio.io/client/mc/release/linux-amd64/mc -o /usr/bin/mc \
    && chmod +x /usr/bin/mc

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package.json ../../yarn.lock ./

USER node

RUN yarn install

COPY --chown=node:node . .

ENTRYPOINT yarn

CMD start

EXPOSE $PORT
