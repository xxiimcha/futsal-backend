const jwt = require("jsonwebtoken")
const Coach = require("../models/Coach")

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const coach = await Coach.findById(decoded.id).select("-password")

    if (!coach) {
      return res.status(401).json({ message: "Coach not found" })
    }

    req.coach = coach
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" })
  }
}

module.exports = protect