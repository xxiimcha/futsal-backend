const express = require("express")
const router = express.Router()
const Player = require("../models/Player")
const Progress = require("../models/Progress")

router.post("/save", async (req, res) => {
  try {
    const { playerId, skill, stage, score, completed } = req.body

    if (!playerId || !skill || !stage) {
      return res.status(400).json({
        success: false,
        message: "Player, skill, and stage are required"
      })
    }

    const player = await Player.findById(playerId)

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      })
    }

    const progress = await Progress.findOneAndUpdate(
      {
        player: player._id,
        skill,
        stage
      },
      {
        player: player._id,
        coach: player.coach,
        skill,
        stage,
        score: score || 0,
        completed: completed || false
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    )

    return res.status(200).json({
      success: true,
      message: "Progress saved successfully",
      progress
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    })
  }
})

module.exports = router