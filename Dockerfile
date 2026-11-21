FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json /tmp/package.json
RUN npm install --global --no-fund --no-audit "$(node -p "require('/tmp/package.json').packageManager")" \
  && rm /tmp/package.json

USER node
WORKDIR /app
EXPOSE 3000
