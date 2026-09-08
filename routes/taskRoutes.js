const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/createTask', authMiddleware, async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const newTask = new Task({
      title,
      description,
      status,
      userId: req.user.id,
    });

    await newTask.save();

    res.status(201).json({ status: 'success', data: newTask });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/listTaskByStatus/:status', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.user.id,
      status: req.params.status,
    }).sort({ createdAt: -1 });

    res.json({ status: 'success', data: tasks });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/updateTaskStatus/:id/:status', authMiddleware, async (req, res) => {
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: req.params.status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ status: 'fail', message: 'Task not found' });
    }

    res.json({ status: 'success', data: updatedTask });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/deleteTask/:id', authMiddleware, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedTask) {
      return res.status(404).json({ status: 'fail', message: 'Task not found' });
    }

    res.json({ status: 'success', message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

router.get('/taskStatusCount', authMiddleware, async (req, res) => {
  try {
    const counts = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const formattedCounts = counts.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    res.json({ status: 'success', data: formattedCounts });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message });
  }
});

module.exports = router;