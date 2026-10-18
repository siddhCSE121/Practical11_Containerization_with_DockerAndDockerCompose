# Practical 11: Containerization with Docker and Docker Compose

**Course**: Advanced Web Development Frameworks (ITUE301)  
**Department**: CSE - CSPIT, CHARUSAT  
**Semester**: 5th  

---

## 📌 Objective
To containerize a full-stack application (React frontend, Node/Express backend, and MongoDB database) using **Docker** and orchestrate all three services with a single command using **Docker Compose**.

---

## 🏗️ Architecture & Docker Compose Diagram

```text
docker-compose.yml
 ├── frontend (React + Vite, built & served on port 5173)
 ├── backend  (Node.js / Express API, listening on port 5000)
 └── mongodb  (Official MongoDB image, listening on port 27017)

Internal Docker Network: app-network (bridge)
   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │   [frontend:5173] ──► [backend:5000] ──► [mongodb:27017] │
   │                                             │           │
   └─────────────────────────────────────────────┼───────────┘
                                                 ▼
                                        [mongo-data (volume)]
```

* **Frontend**: Accessible on the host at `http://localhost:5173`
* **Backend API**: Accessible on the host at `http://localhost:5000`
* **MongoDB**: Accessible on the host at `mongodb://localhost:27017`
* **Internal Inter-Container DNS**: Backend communicates directly with MongoDB using `mongodb://mongodb:27017/taskdb` over `app-network`.

---

## 🐳 Dockerfiles & Orchestration Breakdown

### 1. Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```
* Uses lightweight `node:18-alpine` base image.
* Employs layer caching by copying `package*.json` and running `npm install` before copying source code.

### 2. Frontend Multi-Stage Dockerfile (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve stage
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
```
* **Multi-Stage Build (Supplementary Problem 2)**: Separates the heavy build tooling environment from the production runtime container.

### 3. Docker Compose Configuration (`docker-compose.yml`)
* Orchestrates all 3 containers with restart policies, port forwarding, shared bridge network, and volume mounts.
* Automatically establishes inter-service DNS resolution so `backend` references `mongodb` directly by service name.

---

## 💡 Supplementary Solutions Implemented

1. **`.dockerignore` Optimization (Supplementary Problem 1)**:
   - Added in both [backend/.dockerignore](file:///d:/REACT-AWDF/prac11/backend/.dockerignore) and [frontend/.dockerignore](file:///d:/REACT-AWDF/prac11/frontend/.dockerignore).
   - Prevents host `node_modules/` and sensitive `.env` files from bloating the Docker build context.

2. **Multi-Stage Build for React (Supplementary Problem 2)**:
   - Configured in [frontend/Dockerfile](file:///d:/REACT-AWDF/prac11/frontend/Dockerfile) to streamline final runtime dependencies.

3. **Persistent Named Volume for MongoDB (Supplementary Problem 3)**:
   - Configured in `docker-compose.yml`:
     ```yaml
     volumes:
       - mongo-data:/data/db
     ```
   - Guarantees that task data is persisted on the host system across container restarts and rebuilds.

---

## 🧠 Key Viva Questions & Theory Analysis

### Q1: Why does the backend container need to reference the MongoDB container by its service name (`mongodb`) rather than `localhost`?
> **Answer**:  
> Each Docker container runs in its own isolated network namespace with its own `localhost` (loopback interface `127.0.0.1`). If the backend attempts to connect to `mongodb://localhost:27017`, it looks for MongoDB running **inside its own container**, where no database daemon is running.  
> When containers are connected via a user-defined bridge network in Docker Compose (e.g., `app-network`), Docker provides an **embedded DNS server** that resolves container service names (such as `mongodb` and `backend`) directly to their internal container IP addresses.

### Q2: What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
> **Answer**:  
> - **`EXPOSE` (Dockerfile)**: Serves primarily as documentation and metadata indicating which port the application inside the container intends to listen on. It does **not** publish or bind the port to the host machine.  
> - **`ports` (docker-compose.yml)**: Actually opens and binds the container port to the host interface (`host_port:container_port`, e.g. `5000:5000`). This makes the service accessible from outside Docker (e.g. from the host machine's browser or Postman).

### Q3: Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
> **Answer**:  
> 1. **OS / Architecture Incompatibility**: Many Node packages (e.g., `bcrypt`, `sharp`, `canvas`) compile native C++ binaries during installation for the host OS (e.g., Windows x64). Copying host `node_modules` into a Linux-based Alpine container will crash the app due to binary incompatibility.  
> 2. **Build Context Bloat**: Copying hundreds of megabytes of `node_modules` makes the `docker build` context transfer painfully slow. Running `npm install` inside the container ensures clean, container-native binaries and leverages Docker layer caching.

---

## 🚀 Steps to Run

Follow these commands in your terminal to build, orchestrate, and verify Practical 11:

### 1. Navigate to Practical Directory
```bash
cd prac11
```

### 2. Build and Launch the Multi-Container Stack
Run Docker Compose in the root of `prac11`:
```bash
docker-compose up --build -d
```
*(Or with modern Docker CLI: `docker compose up --build -d`)*
* Builds custom Docker images for `backend` and `frontend` using their respective `Dockerfile`s.
* Pulls the official `mongo:latest` image.
* Mounts named volume `mongo-data` and joins all three containers to the user-defined bridge network `app-network`.

### 3. Verify Running Containers
```bash
docker ps
```
* Confirms `task-mongodb`, `task-backend`, and `task-frontend` are all in `Up` status.

### 4. Access Services in Browser
* **Frontend React Application**: `http://localhost:5173`
* **Backend Health Check**: `http://localhost:5000/health`
* **Backend Tasks API**: `http://localhost:5000/tasks`

### 5. Tear Down Stack
```bash
docker-compose down
```
*(To remove the persistent database volume as well, run `docker-compose down -v`)*

---

## 📸 Screenshots to Include in Lab File / Report

Capture and paste the following screenshots into your practical document:

1. **Screenshot 1 - `docker-compose up --build` Terminal Execution**:
   - *Capture*: Terminal output showing Docker Compose building the backend and frontend image layers, pulling Mongo, creating `app-network`, and starting all 3 containers.
2. **Screenshot 2 - `docker ps` Active Containers Table**:
   - *Capture*: Terminal output of `docker ps` showing the 3 active containers (`task-frontend` on port 5173, `task-backend` on port 5000, and `task-mongodb` on port 27017) with status `Up`.
3. **Screenshot 3 - Backend Health Check Endpoint**:
   - *Capture*: Browser or Postman executing `GET http://localhost:5000/health` showing HTTP `200 OK` with JSON response `{ "status": "UP", "service": "task-backend", "dbStatus": "connected" }`.
4. **Screenshot 4 - React Frontend Running in Docker**:
   - *Capture*: Browser window at `http://localhost:5173` showing the containerized Task Management UI communicating with the containerized backend.
5. **Screenshot 5 - End-to-End Task Creation & Retrieval**:
   - *Capture*: Adding a new task via the frontend and seeing it rendered in the list, proving communication between Frontend &rarr; Backend &rarr; MongoDB across the Docker bridge network.
6. **Screenshot 6 - Docker Volume Data Persistence (Supplementary Evidence)**:
   - *Capture*: Terminal showing `docker-compose restart`, followed by refreshing `http://localhost:5173` showing all previously created tasks still intact, proving data persisted in named volume `mongo-data`.
7. **Screenshot 7 - `docker network inspect` DNS Verification**:
   - *Capture*: Terminal executing `docker network inspect prac11_app-network` showing all 3 container IP allocations on the bridge network.

