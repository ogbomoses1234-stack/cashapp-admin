# ═══════════════════════════════════════════════════════════
# BUILD STAGE
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS build
WORKDIR /app

# Give Node a bigger heap during build.
# Vite transforming ~1700 modules peaks at 2-3 GB; default is 2 GB.
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV CI=true

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ═══════════════════════════════════════════════════════════
# RUNTIME STAGE
# ═══════════════════════════════════════════════════════════
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY htpasswd   /etc/nginx/.htpasswd

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]