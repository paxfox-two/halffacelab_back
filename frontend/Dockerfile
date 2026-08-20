# Builds the SPA, then serves the static files AND reverse-proxies
# /api/* to the backend container, all from one Caddy instance — which
# also gets you automatic Let's Encrypt HTTPS for whatever $DOMAIN is set
# to (including a nip.io hostname, for a domain-less temporary deploy).
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# postinstall (scripts/copy-mediapipe-wasm.mjs) needs to exist before
# `npm install` runs it, so it's copied ahead of the rest of the source.
COPY scripts ./scripts
RUN npm ci
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
