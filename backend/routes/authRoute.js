const express = require("express");
const route = express.Router();

const {
  createUser,
  loginUserCtrl,
  getallUser,
  handleRefreshToken,
  logout,
} = require("../controller/userController");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

route.post("/register", createUser);
route.post("/login", loginUserCtrl);
route.get("/all-users", authMiddleware, isAdmin, getallUser);
route.get("/refresh", handleRefreshToken);
route.get("/logout", logout);

module.exports = route;
