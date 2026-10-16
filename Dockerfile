# ═══════════════════════════════════════════════════════════
# BUILD STAGE
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS build
WORKDIR /app

# Bigger heap for Vite transform. Default 2 GB cap is what
# caused the OOM-killed builds on Coolify.
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

# Remove the base image's default config so ours is authoritative.
# Without this, both default.conf (base) and our copy land in
# /etc/nginx/conf.d/ — nginx loads them both and things collide.
RUN rm -f /etc/nginx/conf.d/default.conf

# App assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Our nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Basic-auth password file
COPY htpasswd /etc/nginx/.htpasswd

# Ensure nginx's worker user can read the htpasswd file.
# Runs as uid 101 (nginx) inside nginx:alpine.
RUN chmod 0644 /etc/nginx/.htpasswd

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]