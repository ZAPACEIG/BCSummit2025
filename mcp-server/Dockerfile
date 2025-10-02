# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript configuration and source code
COPY tsconfig.json ./
COPY server.ts ./
COPY services/ ./services/
COPY tools/ ./tools/
COPY types/ ./types/
COPY config/ ./config/

# Install dev dependencies for building
RUN npm ci

# Build the TypeScript project
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcp -u 1001

# Change ownership of the app directory
RUN chown -R mcp:nodejs /app
USER mcp

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, timeout: 2000 }; const request = http.request(options, (res) => { console.log('STATUS: ' + res.statusCode); process.exitCode = res.statusCode === 200 ? 0 : 1; }); request.on('error', () => { process.exit(1); }); request.end();"

# Start the application
CMD ["npm", "start"]