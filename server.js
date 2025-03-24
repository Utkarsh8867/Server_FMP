const app = require("./app");
const connectDatabase = require("./db/Database");
// const cloudinary = require("cloudinary");
const cloudinary = require('cloudinary').v2;

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});

// connect db
connectDatabase();

// create server
const server = app.listen(3000, () => {
  console.log(
    // `Server is running on http://localhost:${process.env.PORT}`
    `Server is running on http://localhost:3000`
  );
});

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
