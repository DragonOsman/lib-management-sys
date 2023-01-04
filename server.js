const express = require("express");
const app = express();
require("dotenv").config({ path: `${__dirname}/.env` });
const MONGO_URI = process.env.MONGO_URI;
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4000;
const router = require("./routes/api/bookRouter");

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/api", router);

mongoose.connect(MONGO_URI);
mongoose.connection.once("open", () => console.log("Connected to the Database"));
mongoose.connection.on("error", error => console.log(`Mongoose Connection Error: ${error}`));
