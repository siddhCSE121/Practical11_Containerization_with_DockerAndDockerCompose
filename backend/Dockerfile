# Step 2: Backend Dockerfile
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package*.json ./

# Install application dependencies inside image
RUN npm install

# Copy application source code
COPY . .

# Document exposed application port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
