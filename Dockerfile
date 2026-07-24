# ---- Stage 1: build the React client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---- Stage 2: runtime (server + built client) ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Server deps only (no dev deps, no client toolchain in the final image)
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev

COPY server/ ./server/
# The server serves this directory statically (single-service mode)
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001

# Simple healthcheck so `docker ps` shows real status
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

CMD ["node", "server/index.js"]
