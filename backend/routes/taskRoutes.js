const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');

// Fallback in-memory task list if MongoDB daemon is initializing or offline
let fallbackTasks = [
    { _id: '66fb0123456789abcdef0001', title: 'Containerize React Frontend with Dockerfile', description: 'Multi-stage build', priority: 'high', completed: true, createdAt: new Date() },
    { _id: '66fb0123456789abcdef0002', title: 'Containerize Express Backend with Dockerfile', description: 'Node 18 Alpine base image', priority: 'high', completed: true, createdAt: new Date() },
    { _id: '66fb0123456789abcdef0003', title: 'Orchestrate all 3 services via docker-compose.yml', description: 'Network app-network bridge', priority: 'high', completed: false, createdAt: new Date() }
];

async function getTasksFromDatabase() {
    if (mongoose.connection.readyState === 1) {
        return await Task.find().sort({ createdAt: -1 });
    }
    return fallbackTasks;
}

// GET /tasks - Fetch all tasks
router.get('/', async (req, res, next) => {
    try {
        const tasks = await getTasksFromDatabase();
        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });
    } catch (error) {
        next(error);
    }
});

// GET /tasks/:id - Fetch single task
router.get('/:id', async (req, res, next) => {
    try {
        let task;
        if (mongoose.connection.readyState === 1) {
            task = await Task.findById(req.params.id);
        } else {
            task = fallbackTasks.find(t => t._id.toString() === req.params.id);
        }

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, task });
    } catch (error) {
        next(error);
    }
});

// POST /tasks - Create task
router.post('/', async (req, res, next) => {
    try {
        const { title, description, priority, completed } = req.body || {};

        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required'
            });
        }

        let savedTask;
        if (mongoose.connection.readyState === 1) {
            const newTask = new Task({ title: title.trim(), description, priority, completed });
            savedTask = await newTask.save();
        } else {
            savedTask = {
                _id: 'temp_' + Date.now(),
                title: title.trim(),
                description: description || '',
                priority: priority || 'medium',
                completed: completed || false,
                createdAt: new Date()
            };
            fallbackTasks.unshift(savedTask);
        }

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: savedTask
        });
    } catch (error) {
        next(error);
    }
});

// PUT /tasks/:id - Update task
router.put('/:id', async (req, res, next) => {
    try {
        let task;
        if (mongoose.connection.readyState === 1) {
            task = await Task.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
        } else {
            const item = fallbackTasks.find(t => t._id.toString() === req.params.id);
            if (item) {
                if (req.body.title !== undefined) item.title = req.body.title;
                if (req.body.description !== undefined) item.description = req.body.description;
                if (req.body.completed !== undefined) item.completed = req.body.completed;
                if (req.body.priority !== undefined) item.priority = req.body.priority;
                task = item;
            }
        }

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /tasks/:id - Delete task
router.delete('/:id', async (req, res, next) => {
    try {
        let task;
        if (mongoose.connection.readyState === 1) {
            task = await Task.findByIdAndDelete(req.params.id);
        } else {
            const index = fallbackTasks.findIndex(t => t._id.toString() === req.params.id);
            if (index !== -1) {
                task = fallbackTasks.splice(index, 1)[0];
            }
        }

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
