# Multi-stage build para optimizar tamaño
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
# Instalar todas las dependencias (incluyendo devDependencies para TypeScript)
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar package files primero para instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar build compilado y cambiar permisos
COPY --from=builder --chown=nodejs:nodejs /app/lib ./lib

# Configurar usuario y permisos
USER nodejs

# Exponer puerto
EXPOSE 3978

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').request('http://localhost:3978/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).end()"

# Comando de inicio
CMD ["npm", "start"]