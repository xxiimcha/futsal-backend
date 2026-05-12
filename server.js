const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((error) => {
    console.log(error);
});

app.get("/", (req, res) => {
    res.send("Futsal VR Backend Running");
});

const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes")

app.use("/api/auth", authRoutes)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});