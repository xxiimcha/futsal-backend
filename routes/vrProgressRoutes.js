const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const Player = require("../models/Player")
const Progress = require("../models/Progress")

router.post("/save", async (req, res) => {
  try {
    const { playerId, studentId, skill, stage, score, completed } = req.body

    if ((!playerId && !studentId) || !skill || !stage) {
      return res.status(400).json({
        success: false,
        message: "Player ID or Student ID, skill, and stage are required"
      })
    }

    if (!["Passing", "Dribbling", "Shooting"].includes(skill)) {
      return res.status(400).json({
        success: false,
        message: "Invalid skill"
      })
    }

    const stageNumber = Number(stage)

    if (Number.isNaN(stageNumber) || stageNumber < 1 || stageNumber > 4) {
      return res.status(400).json({
        success: false,
        message: "Stage must be a number from 1 to 4"
      })
    }

    let player = null

    if (playerId) {
      if (!mongoose.Types.ObjectId.isValid(playerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid player ID"
        })
      }

      player = await Player.findById(playerId)
    } else {
      player = await Player.findOne({ studentId })
    }

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
        stage: stageNumber
      },
      {
        player: player._id,
        coach: player.coach,
        skill,
        stage: stageNumber,
        score: Number(score) || 0,
        completed: Boolean(completed)
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
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
      message: "Server error",
      error: error.message
    })
  }
})

router.get("/player/:playerId", async (req, res) => {
  try {
    const { playerId } = req.params

    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID"
      })
    }

    const player = await Player.findById(playerId)

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      })
    }

    const progress = await Progress.find({ player: player._id }).sort({
      skill: 1,
      stage: 1
    })

    return res.status(200).json({
      success: true,
      player,
      progress
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    })
  }
})

router.get("/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params

    const player = await Player.findOne({ studentId })

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      })
    }

    const progress = await Progress.find({ player: player._id }).sort({
      skill: 1,
      stage: 1
    })

    return res.status(200).json({
      success: true,
      player,
      progress
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    })
  }
})

module.exports = router