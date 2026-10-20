# Multi-stage production Dockerfile for ExamCraft Backend
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and configuration
COPY tsconfig.json ./
COPY src/ ./src/
COPY assets/ ./assets/

# Compile TypeScript
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install system fonts and libraries needed for PDF canvas / text metrics
RUN apk add --no-cache \
    fontconfig \
    freetype \
    ttf-dejavu \
    ttf-freefont

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript output and asset fonts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

EXPOSE 5000

CMD ["node", "dist/server.js"]
