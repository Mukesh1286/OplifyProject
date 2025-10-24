const express = require("express");
const route = express.Router();

// const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
  createColumn,
  updateColumn,
  deleteColumn,
  getallColumn,
} = require("../controller/columnsController");

// route.post("/createColumn", createColumn);

// POST new column under a board
route.post("/boards/:id/columns", createColumn);

// PATCH update column
route.patch("/:id", updateColumn);
route.get("/getColumn", getallColumn);
// DELETE column
route.delete("/:id", deleteColumn);
module.exports = route;
