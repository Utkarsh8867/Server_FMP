const mongoose = require("mongoose");

const connectDatabase = () => {
  mongoose
    .connect("mongodb+srv://kaduutkarsh52:e38xYpPhKYgD4EqN@cluster0.pbsaf.mongodb.net/Node?retryWrites=true&w=majority&appName=Cluster0", {
      // useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((data) => {
      console.log(`mongod connected with server: ${data.connection.host}`);
    });
};

module.exports = connectDatabase;
