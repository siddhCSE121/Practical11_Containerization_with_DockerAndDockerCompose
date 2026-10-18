# Step 3 & Supplementary Problem 2: Multi-stage build for React frontend
# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies inside image
RUN npm install

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve stage
EXPOSE 5173

# Serve production build on host 0.0.0.0 port 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
