# Build stage: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code and compile
COPY . .
RUN npm run build

# Runner stage: Lightweight production server
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend server code
COPY server ./server

EXPOSE 3000

CMD ["node", "server/index.js"]

