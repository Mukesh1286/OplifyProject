const mongoose = require("mongoose");
const ColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
    },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Column", ColumnSchema);
