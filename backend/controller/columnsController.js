// controllers/columnController.js
const asyncHandler = require("express-async-handler");
const Board = require("../models/BoardModels");
const Column = require("../models/ColumnModels");
// const Column = require("../models/Column");
// const Board = require("../models/Board");

// Create Column
const createColumn = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { id: boardId } = req.params;

  // Check board exists
  const board = await Board.findById(boardId);
  if (!board) {
    res.status(404);
    throw new Error("Board not found");
  }

  const newColumn = await Column.create({ title, boardId });
  res.status(201).json(newColumn);
});

// Update Column
const updateColumn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;

  const column = await Column.findById(id);
  if (!column) {
    res.status(404);
    throw new Error("Column not found");
  }

  if (title) column.title = title;
  if (position !== undefined) column.position = position;

  const updatedColumn = await column.save();
  res.json(updatedColumn);
});

const getallColumn = asyncHandler(async (req, res) => {
  try {
    const getColumn = await Column.find();
    res.json(getColumn);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteColumn = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const deletecolumn = await Column.findByIdAndDelete(id);
    res.json(deletecolumn);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = { createColumn, updateColumn, getallColumn, deleteColumn };
