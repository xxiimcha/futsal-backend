const express = require("express")
const bcrypt = require("bcryptjs")
const Coach = require("../models/Coach")
const jwt = require("jsonwebtoken")

const router = express.Router()

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    const existingCoach = await Coach.findOne({ email })

    if (existingCoach) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const coach = await Coach.create({
      fullName,
      email,
      password: hashedPassword
    })

    res.status(201).json({
      message: "Coach registered successfully",
      coach: {
        id: coach._id,
        fullName: coach.fullName,
        email: coach.email
      }
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" })
    }

    const coach = await Coach.findOne({ email })

    if (!coach) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const isMatch = await bcrypt.compare(password, coach.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
      { id: coach._id, email: coach.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    )

    res.json({
      message: "Login successful",
      token,
      coach: {
        id: coach._id,
        fullName: coach.fullName,
        email: coach.email
      }
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router