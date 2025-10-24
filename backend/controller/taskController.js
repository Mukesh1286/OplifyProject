// controllers/taskController.js
const asyncHandler = require("express-async-handler");
const Column = require("../models/ColumnModels");
const Task = require("../models/tasksModels");
// const Column = require("../models/Column");
const mongoose = require("mongoose");

/**
 * POST /columns/:id/tasks
 * Create a task in a column. Body: { title, description?, position? }
 */
const createTask = asyncHandler(async (req, res) => {
  const { id: columnId } = req.params;
  const { title, description, position } = req.body;

  const column = await Column.findById(columnId);
  if (!column) {
    res.status(404);
    throw new Error("Column not found");
  }

  // Determine position: if provided, shift existing tasks; otherwise append at end
  let taskposition;
  if (position !== undefined && Number.isInteger(position) && position >= 0) {
    taskposition = position;
    // shift tasks with position >= taskposition in this column
    await Task.updateMany(
      { columnId, position: { $gte: taskposition } },
      { $inc: { position: 1 } }
    );
  } else {
    // append to end
    const last = await Task.findOne({ columnId })
      .sort({ position: -1 })
      .select("position");
    taskposition = last ? last.position + 1 : 0;
  }

  const newTask = await Task.create({
    title,
    description,
    columnId,
    position: taskposition,
    createdBy: req.user?._id, // optional: if you're using auth middleware
  });

  res.status(201).json(newTask);
});

const getallTask = asyncHandler(async (req, res) => {
  try {
    const getTask = await Task.find();
    res.json(getTask);
  } catch (error) {
    throw new Error(error);
  }
});

/**
 * PATCH /tasks/:id
 * Update task fields (title, description, dueDate, position (optional — see note)).
 * If user wants to reposition within same column via this endpoint provide logic similar to moveTask.
 */
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // prefer whitelist in prod

  const task = await Task.findById(id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  // If position or columnId are part of update and you want proper reposition behavior,
  // prefer using the move endpoint. Here we only update simple fields.
  const simpleFields = ["title", "description", "dueDate"];
  simpleFields.forEach((f) => {
    if (updates[f] !== undefined) task[f] = updates[f];
  });

  const saved = await task.save();
  res.json(saved);
});

/**
 * DELETE /tasks/:id
 * Remove a task and collapse the positioning in its column.
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the task (avoid .lean() here)
  const task = await Task.findById(id);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const { columnId, order: deletedOrder } = task;

  // Delete by model method (works whether task was a doc or plain object)
  await Task.deleteOne({ _id: id });

  // Shift orders in same column
  await Task.updateMany(
    { columnId, order: { $gt: deletedOrder } },
    { $inc: { order: -1 } }
  );

  res.json({ message: "Task deleted successfully" });
});

/**
 * PATCH /tasks/:id/move
 * Move task to another column or reposition within same column.
 * Body: { toColumnId, toposition }  -- toposition is a zero-based index (or 1-based if you prefer)
 */
const moveTask = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    const { toColumnId, toposition } = req.body;

    if (!toColumnId || toposition === undefined || isNaN(toposition)) {
      res.status(400);
      throw new Error("toColumnId and toposition are required");
    }

    const task = await Task.findById(id).session(session);
    if (!task) {
      res.status(404);
      throw new Error("Task not found");
    }

    const fromColumnId = task.columnId.toString();
    const fromposition = task.position;
    const destinationColumnId = toColumnId;

    // validate destination column exists
    const destColumn = await Column.findById(destinationColumnId).session(
      session
    );
    if (!destColumn) {
      res.status(404);
      throw new Error("Destination column not found");
    }

    // If moving within same column
    if (fromColumnId === destinationColumnId) {
      if (toposition === fromposition) {
        // nothing to do
        await session.commitTransaction();
        session.endSession();
        return res.json(task);
      }

      if (toposition > fromposition) {
        // tasks with position > fromposition and <= toposition decrement by 1
        await Task.updateMany(
          {
            columnId: fromColumnId,
            position: { $gt: fromposition, $lte: toposition },
          },
          { $inc: { position: -1 } },
          { session }
        );
      } else {
        // toposition < fromposition: tasks with position >= toposition and < fromposition increment by 1
        await Task.updateMany(
          {
            columnId: fromColumnId,
            position: { $gte: toposition, $lt: fromposition },
          },
          { $inc: { position: 1 } },
          { session }
        );
      }

      task.position = toposition;
      await task.save({ session });
      await session.commitTransaction();
      session.endSession();
      const updated = await Task.findById(id); // outside session for clean return
      return res.json(updated);
    }

    // Moving to a different column:
    // 1) Collapse positioning in source column: decrement positions > fromposition
    await Task.updateMany(
      { columnId: fromColumnId, position: { $gt: fromposition } },
      { $inc: { position: -1 } },
      { session }
    );

    // 2) Make space in destination column: increment positions >= toposition
    await Task.updateMany(
      { columnId: destinationColumnId, position: { $gte: toposition } },
      { $inc: { position: 1 } },
      { session }
    );

    // 3) Move task
    task.columnId = destinationColumnId;
    task.position = toposition;
    await task.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedTask = await Task.findById(id).populate("columnId");
    res.json(updatedTask);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  getallTask,
};
