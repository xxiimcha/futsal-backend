const express = require("express")
const router = express.Router()
const Player = require("../models/Player")

router.post("/login", async (req, res) => {
  try {
    const { studentId } = req.body

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Player ID is required"
      })
    }

    const player = await Player.findOne({
      studentId: studentId.trim()
    }).populate("coach", "fullName email")

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      player: {
        id: player._id.toString(),
        studentId: player.studentId,
        fullName: player.fullName,
        team: player.team,
        position: player.position
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

module.exports = router