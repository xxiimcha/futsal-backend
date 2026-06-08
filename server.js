const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()

const authRoutes = require("./routes/authRoutes")
const playerRoutes = require("./routes/playerRoutes")
const progressRoutes = require("./routes/progressRoutes")
const vrAuthRoutes = require("./routes/vrAuthRoutes")
const vrProgressRoutes = require("./routes/vrProgressRoutes")

const app = express()

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    console.log("REQUEST ORIGIN:", origin)

    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    console.log("BLOCKED BY CORS:", origin)
    console.log("ALLOWED ORIGINS:", allowedOrigins)

    return callback(new Error("Not allowed by CORS"))
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

app.use(express.json())

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected")
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error)
  })

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Futsal VR Backend Running"
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/players", playerRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/vr/auth", vrAuthRoutes)
app.use("/api/vr/progress", vrProgressRoutes)

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})