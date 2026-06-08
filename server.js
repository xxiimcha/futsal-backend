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
  process.env.FRONTEND_URL
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
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