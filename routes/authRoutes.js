const express = require("express")
const Coach = require("../models/Coach")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const nodemailer = require("nodemailer")

const router = express.Router()

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

router.post("/register", async (req, res) => {
  try {
    console.log("REGISTER REQUEST RECEIVED")
    console.log("Request body:", {
      fullName: req.body.fullName,
      email: req.body.email,
      hasPassword: !!req.body.password
    })

    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      console.log("REGISTER FAILED: Missing required fields")
      return res.status(400).json({ message: "All fields are required" })
    }

    if (fullName.trim().length < 3) {
      console.log("REGISTER FAILED: Full name too short")
      return res.status(400).json({ message: "Full name must be at least 3 characters" })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      console.log("REGISTER FAILED: Invalid email format")
      return res.status(400).json({ message: "Please enter a valid email address" })
    }

    if (password.length < 6) {
      console.log("REGISTER FAILED: Password too short")
      return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("REGISTER FAILED: Email service is not configured")
      return res.status(500).json({ message: "Email service is not configured" })
    }

    const existingCoach = await Coach.findOne({ email })

    if (existingCoach) {
      console.log("REGISTER FAILED: Email already registered:", email)
      return res.status(400).json({ message: "Email already registered" })
    }

    const verificationToken = crypto.randomBytes(32).toString("hex")

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex")

    const coach = await Coach.create({
      fullName,
      email,
      password,
      isVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000
    })

    console.log("REGISTER SUCCESS: Coach created:", {
      id: coach._id,
      email: coach.email
    })

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`

    console.log("Verification URL generated:", verificationUrl)

    const transporter = createTransporter()

    try {
      console.log("SENDING VERIFICATION EMAIL TO:", coach.email)

      const mailInfo = await transporter.sendMail({
        from: `"Futsal VR Dashboard" <${process.env.EMAIL_USER}>`,
        to: coach.email,
        subject: "Verify Your Coach Account",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Verify Your Email</h2>
            <p>Hello ${coach.fullName},</p>
            <p>Thank you for registering your Futsal VR Dashboard coach account.</p>
            <p>Click the button below to verify your email address:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 18px; background: #22c55e; color: white; text-decoration: none; border-radius: 8px;">
              Verify Email
            </a>
            <p>This link will expire in 24 hours.</p>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
          </div>
        `
      })

      console.log("REGISTER EMAIL SENT:", {
        to: coach.email,
        messageId: mailInfo.messageId,
        accepted: mailInfo.accepted,
        rejected: mailInfo.rejected
      })
    } catch (emailError) {
      console.error("REGISTER EMAIL FAILED:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response
      })

      return res.status(500).json({
        message: "Account was created but verification email failed to send",
        error: emailError.message
      })
    }

    res.status(201).json({
      message: "Account created successfully. Please check your email to verify your account.",
      coach: {
        id: coach._id,
        fullName: coach.fullName,
        email: coach.email,
        isVerified: coach.isVerified
      }
    })
  } catch (error) {
    console.error("REGISTER ERROR:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.get("/verify-email/:token", async (req, res) => {
  try {
    console.log("VERIFY EMAIL REQUEST RECEIVED")
    console.log("Token received:", !!req.params.token)

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex")

    const coach = await Coach.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: {
        $gt: Date.now()
      }
    })

    if (!coach) {
      console.log("VERIFY EMAIL FAILED: Invalid or expired token")
      return res.status(400).json({
        message: "Invalid or expired verification link"
      })
    }

    coach.isVerified = true
    coach.emailVerificationToken = undefined
    coach.emailVerificationExpire = undefined

    await coach.save()

    console.log("VERIFY EMAIL SUCCESS:", coach.email)

    res.json({
      message: "Email verified successfully. You can now login."
    })
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.post("/login", async (req, res) => {
  try {
    console.log("LOGIN REQUEST RECEIVED")
    console.log("Request body:", {
      email: req.body.email,
      hasPassword: !!req.body.password
    })

    const { email, password } = req.body

    if (!email || !password) {
      console.log("LOGIN FAILED: Missing email or password")
      return res.status(400).json({ message: "Email and password are required" })
    }

    const coach = await Coach.findOne({ email })

    if (!coach) {
      console.log("LOGIN FAILED: Coach not found:", email)
      return res.status(400).json({ message: "Invalid email or password" })
    }

    const isMatch = await coach.matchPassword(password)

    if (!isMatch) {
      console.log("LOGIN FAILED: Incorrect password:", email)
      return res.status(400).json({ message: "Invalid email or password" })
    }

    if (!coach.isVerified) {
      console.log("LOGIN FAILED: Email not verified:", email)
      return res.status(403).json({
        message: "Please verify your email before logging in"
      })
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

    console.log("LOGIN SUCCESS:", email)

    res.json({
      message: "Login successful",
      token,
      coach: {
        id: coach._id,
        fullName: coach.fullName,
        email: coach.email,
        isVerified: coach.isVerified
      }
    })
  } catch (error) {
    console.error("LOGIN ERROR:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.post("/forgot-password", async (req, res) => {
  try {
    console.log("FORGOT PASSWORD REQUEST RECEIVED")
    console.log("Email:", req.body.email)

    const { email } = req.body

    if (!email) {
      console.log("FORGOT PASSWORD FAILED: Email missing")
      return res.status(400).json({ message: "Email is required" })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("FORGOT PASSWORD FAILED: Email service is not configured")
      return res.status(500).json({
        message: "Email service is not configured"
      })
    }

    const coach = await Coach.findOne({ email })

    if (!coach) {
      console.log("FORGOT PASSWORD FAILED: Coach not found:", email)
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

    console.log("Reset URL generated:", resetUrl)

    const transporter = createTransporter()

    try {
      console.log("SENDING RESET EMAIL TO:", coach.email)

      const mailInfo = await transporter.sendMail({
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
          </div>
        `
      })

      console.log("FORGOT PASSWORD EMAIL SENT:", {
        to: coach.email,
        messageId: mailInfo.messageId,
        accepted: mailInfo.accepted,
        rejected: mailInfo.rejected
      })
    } catch (emailError) {
      console.error("FORGOT PASSWORD EMAIL FAILED:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response
      })

      return res.status(500).json({
        message: "Password reset email failed to send",
        error: emailError.message
      })
    }

    res.json({
      message: "Password reset link has been sent to your email"
    })
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

router.put("/reset-password/:token", async (req, res) => {
  try {
    console.log("RESET PASSWORD REQUEST RECEIVED")
    console.log("Token received:", !!req.params.token)
    console.log("Has password:", !!req.body.password)

    const { password } = req.body

    if (!password) {
      console.log("RESET PASSWORD FAILED: Password missing")
      return res.status(400).json({ message: "New password is required" })
    }

    if (password.length < 6) {
      console.log("RESET PASSWORD FAILED: Password too short")
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
      console.log("RESET PASSWORD FAILED: Invalid or expired token")
      return res.status(400).json({
        message: "Invalid or expired reset token"
      })
    }

    coach.password = password
    coach.resetPasswordToken = undefined
    coach.resetPasswordExpire = undefined

    await coach.save()

    console.log("RESET PASSWORD SUCCESS:", coach.email)

    res.json({
      message: "Password has been reset successfully"
    })
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error)

    res.status(500).json({
      message: "Server error",
      error: error.message
    })
  }
})

module.exports = router