const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Health check endpoint (for Docker healthcheck)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'task-backend',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/tasks', taskRoutes);

// Error Handler
app.use(errorHandler);

// Port and MongoDB connection string
// Step 5: Inside Docker network, MongoDB is resolved by service name 'mongodb'
let serverStarted = false;
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/taskdb';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✓ Successfully connected to MongoDB database');
        if (!serverStarted) {
            serverStarted = true;
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`✓ Practical 11 Backend running on port ${PORT}`);
            });
        }
    })
    .catch((err) => {
        console.error('MongoDB connection notice:', err.message);
        // If connecting to Docker container host 'mongodb' failed on local Windows, fallback to 127.0.0.1
        if (MONGO_URI.includes('mongodb:27017')) {
            const localUri = 'mongodb://127.0.0.1:27017/taskdb';
            console.log(`Attempting local MongoDB connection at: ${localUri}`);
            mongoose.connect(localUri)
                .then(() => {
                    console.log('✓ Successfully connected to local MongoDB database');
                })
                .catch(localErr => {
                    console.error('Local MongoDB fallback notice:', localErr.message);
                });
        }
        if (!serverStarted) {
            serverStarted = true;
            app.listen(PORT, '0.0.0.0', () => {
                console.log(`✓ Practical 11 Backend running on port ${PORT}`);
            });
        }
    });

module.exports = app;
