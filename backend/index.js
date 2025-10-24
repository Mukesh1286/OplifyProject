const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const connectDatabase = require("./config/dbConnect");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(cors());

//Setting up config file
dotenv.config({ path: "config/config.env" });

// Connecting to database
connectDatabase();

const authRouter = require("./routes/authRoute");
const boardRoute = require("./routes/boardRoute");
const columnRoute = require("./routes/columnRoutes");
const taskRoute = require("./routes/taskRoute");
const assigneeRoute = require("./routes/assigneeRoutes");

const { notFound, errorHandler } = require("./middlewares/errorHandler");
// const productRouter = require("./routes/productRoute");
// const blogRouter = require("./routes/blogRoute");
// const categoryRouter = require("./routes/prodcategoryRoute");
// const blogcategoryRouter = require("./routes/blogCatRoute");
// const brandRouter = require("./routes/brandRoute");
// const couponRouter = require("./routes/couponRoute");

app.use("/api/user", authRouter);
app.use("/api/board", boardRoute);
app.use("/api/column", columnRoute);
app.use("/api/task", taskRoute);
app.use("/api/assign", assigneeRoute);
// app.use("/api/product", productRouter);
// app.use("/api/blog", blogRouter);
// app.use("/api/category", categoryRouter);
// app.use("/api/blogcategory", blogcategoryRouter);
// app.use("/api/coupon", couponRouter);
// app.use("/api/brand", brandRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(
    `Server started on Port: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});
