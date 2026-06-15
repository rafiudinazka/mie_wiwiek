# ============================
# Stage 1: Build frontend
# ============================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy root package files and install frontend deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source and build
COPY index.html ./
COPY svelte.config.js ./
COPY vite.config.js ./
COPY jsconfig.json ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# ============================
# Stage 2: Production server
# ============================
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend package files and install production deps only
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --production

# Copy backend source
COPY backend/index.js backend/database.js backend/payment.js ./backend/
COPY backend/seed-images.js backend/seed-images-new.js ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist ./dist

# Railway injects PORT env var
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the backend (which serves the frontend from ./dist)
CMD ["node", "backend/index.js"]
