// controllers/assigneeController.js
const asyncHandler = require("express-async-handler");
const Task = require("../models/tasksModels");
const User = require("../models/userModels");

const mongoose = require("mongoose");

// POST /tasks/:id/assignees
const addAssignee = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;
  const userId = req.body.userId || req.user?._id;

  if (!userId) {
    res.status(400);
    throw new Error("userId is required (or authenticate request)");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const user = await User.findById(userId).select("_id name email");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Use model method to update (prevents duplicates)
  const updated = await Task.findByIdAndUpdate(
    taskId,
    { $addToSet: { assignees: userId } },
    { new: true }
  ).populate("assignees", "name email");

  return res.status(200).json(updated);
});

// DELETE /tasks/:id/assignees/:userId
const removeAssignee = asyncHandler(async (req, res) => {
  const { id: taskId, userId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const user = await User.findById(userId).select("_id name email");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const updated = await Task.findByIdAndUpdate(
    taskId,
    { $pull: { assignees: userId } },
    { new: true }
  ).populate("assignees", "name email");

  return res.status(200).json(updated);
});

module.exports = { addAssignee, removeAssignee };
