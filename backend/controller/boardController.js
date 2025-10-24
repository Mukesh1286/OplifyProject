const asyncHandler = require("express-async-handler");
const BoardModels = require("../models/BoardModels");

const createBoard = asyncHandler(async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: no user found" });
    }
    const newBoard = await BoardModels.create({
      title: req.body.title,
      description: req.body.description,
      userId: req.user._id,
      //   members: [req.user._id],
    });

    res.status(201).json(newBoard);
  } catch (error) {
    console.error("Create board error:", error.message);
    res.status(500).json({ message: error.message });
  }
});

const getallBoard = asyncHandler(async (req, res) => {
  try {
    const getBoards = await BoardModels.find();
    res.json(getBoards);
  } catch (error) {
    throw new Error(error);
  }
});

const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const updateBoards = await BoardModels.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updateBoards);
  } catch (error) {
    throw new Error(error);
  }
});
const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deleteboard = await BoardModels.findByIdAndDelete(id);
    res.json(deleteboard);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createBoard,
  getallBoard,
  updateBoard,
  deleteBoard,
};
