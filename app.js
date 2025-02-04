


const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();


const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const morgan = require("morgan");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Enable CORS
app.use(
  cors({
    // origin: ["https://farmer-market-placr.vercel.app"], // Update with your frontend's origin if different
     origin: ["https://67a2790869c8d628efddd44d--thunderous-salmiakki-b27809.netlify.app"], 
    // origin: process.env.VITE_ALLOWED_ORIGIN, // Update with your frontend's origin if different
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use(morgan("dev"));
app.use(mongoSanitize());
app.use(xss());

// Test route
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

// Environment variable configuration
// if (process.env.NODE_ENV !== "PRODUCTION") {
//   require("dotenv").config({ path: "config/.env" });
// }

// Import routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const order = require("./controller/order");
const cart = require("./controller/cart"); // Added cart controller

// Route configurations
app.use("/api/v2/user", user);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/cart", cart); // Using cart controller

// Uncomment and configure these routes as needed
// const event = require("./controller/event");
// const coupon = require("./controller/couponCode");
// const payment = require("./controller/payment");
// const withdraw = require("./controller/withdraw");
// const conversation = require("./controller/conversation");
// const message = require("./controller/message");

// app.use("/api/v2/event", event);
// app.use("/api/v2/coupon", coupon);
// app.use("/api/v2/payment", payment);
// app.use("/api/v2/withdraw", withdraw);
// app.use("/api/v2/conversation", conversation);
// app.use("/api/v2/message", message);

// Error handling middleware
app.use(ErrorHandler);

module.exports = app;
