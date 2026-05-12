const express = require("express")
const Player = require("../models/Player")
const Progress = require("../models/Progress")
const protect = require("../middleware/authMiddleware")

const router = express.Router()

const skills = ["Passing", "Dribbling", "Shooting"]
const stages = [1, 2, 3, 4]

router.get("/", protect, async (req, res) => {
  try {
    const players = await Player.find({ coach: req.coach._id }).sort({ createdAt: -1 })

    const result = []

    for (const player of players) {
      let playerProgress = await Progress.find({
        player: player._id,
        coach: req.coach._id
      })

      for (const skill of skills) {
        for (const stage of stages) {
          const existing = playerProgress.find(
            (item) => item.skill === skill && item.stage === stage
          )

          if (!existing) {
            const created = await Progress.create({
              player: player._id,
              coach: req.coach._id,
              skill,
              stage,
              score: 0,
              completed: false
            })

            playerProgress.push(created)
          }
        }
      }

      const completedCount = playerProgress.filter((item) => item.completed).length
      const totalStages = skills.length * stages.length
      const progressPercent = Math.round((completedCount / totalStages) * 100)

      result.push({
        playerId: player._id,
        studentId: player.studentId,
        fullName: player.fullName,
        team: player.team,
        level: player.level,
        progressPercent,
        progress: playerProgress
      })
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

router.put("/:id", protect, async (req, res) => {
  try {
    const { score, completed } = req.body

    const progress = await Progress.findOne({
      _id: req.params.id,
      coach: req.coach._id
    })

    if (!progress) {
      return res.status(404).json({ message: "Progress record not found" })
    }

    progress.score = score ?? progress.score
    progress.completed = completed ?? progress.completed

    const updatedProgress = await progress.save()

    res.json(updatedProgress)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router