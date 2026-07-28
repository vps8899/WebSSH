FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3000
CMD ["node", "server.js"]
