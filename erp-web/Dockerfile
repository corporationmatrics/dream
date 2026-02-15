# syntax=docker/dockerfile:1.4
# Multi-stage Next.js production image
# Assumes .next and node_modules are pre-built locally
# (Build locally: npm run build)

FROM node:22-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy essential files
COPY package*.json ./
COPY node_modules ./node_modules
COPY .next ./.next
COPY public ./public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start Next.js server
CMD ["npm", "start"]
