const express = require("express")
const Coach = require("../models/Coach")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const nodemailer = require("nodemailer")

const router = express.Router()

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    const existingCoach = await Coach.findOne({ email })

    if (existingCoach) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const coach = await Coach.create({
      fullName,
      email,
      password
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
    console.error("Register error:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
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

    const isMatch = await coach.matchPassword(password)

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
      {
        id: coach._id,
        email: coach.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
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
    console.error("Login error:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: "Email is required" })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        message: "Email service is not configured"
      })
    }

    const coach = await Coach.findOne({ email })

    if (!coach) {
      return res.status(404).json({
        message: "No coach account found with this email"
      })
    }

    const resetToken = crypto.randomBytes(32).toString("hex")

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    coach.resetPasswordToken = hashedToken
    coach.resetPasswordExpire = Date.now() + 15 * 60 * 1000

    await coach.save()

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: `"Futsal VR Dashboard" <${process.env.EMAIL_USER}>`,
      to: coach.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password for your Futsal VR Dashboard account.</p>
          <p>Click the button below to create a new password:</p>

          <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px;">
            Reset Password
          </a>

          <p>This link will expire in 15 minutes.</p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `
    })

    res.json({
      message: "Password reset link has been sent to your email"
    })
  } catch (error) {
    console.error("Forgot password error:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.put("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: "New password is required" })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      })
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex")

    const coach = await Coach.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: {
        $gt: Date.now()
      }
    })

    if (!coach) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      })
    }

    coach.password = password
    coach.resetPasswordToken = undefined
    coach.resetPasswordExpire = undefined

    await coach.save()

    res.json({
      message: "Password has been reset successfully"
    })
  } catch (error) {
    console.error("Reset password error:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

module.exports = router