// routes/taskRoutes.js
const express = require("express");
const route = express.Router();

const {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getallTask,
} = require("../controller/taskController");
// Create task under column
route.post("/columns/:id/tasks", createTask);

// Update task fields
route.patch("/tasks/:id", updateTask);

// Delete task
route.delete("/tasks/:id", deleteTask);
route.get("/getTask", getallTask);
// Move (drag & drop) task
route.patch("/tasks/:id/move", moveTask);

module.exports = route;
