// routes/assigneeRoutes.js
const express = require("express");
const router = express.Router();

const {
  addAssignee,
  removeAssignee,
} = require("../controller/assigneeController");

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Add an assignee to a task
router.post("/tasks/:id/assignees", authMiddleware, isAdmin, addAssignee);

// Remove an assignee from a task
router.delete(
  "/tasks/:id/assignees/:userId",
  authMiddleware,
  isAdmin,
  removeAssignee
);

module.exports = router;
