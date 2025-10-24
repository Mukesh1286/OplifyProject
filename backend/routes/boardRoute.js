const express = require("express");
const route = express.Router();

const {
  createBoard,
  getallBoard,
  updateBoard,
  deleteBoard,
} = require("../controller/boardController");

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

route.post("/createBoard", authMiddleware, createBoard);
route.get("/getboard", getallBoard);
route.put("/updateBoard/:id", updateBoard);
route.delete("/deleteBoard/:id", deleteBoard);

module.exports = route;
