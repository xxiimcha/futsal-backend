const express = require("express")
const Player = require("../models/Player")
const protect = require("../middleware/authMiddleware")

const router = express.Router()

router.get("/", protect, async (req, res) => {
  try {
    const players = await Player.find({ coach: req.coach._id }).sort({ createdAt: -1 })
    res.json(players)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/", protect, async (req, res) => {
  try {
    const { studentId, fullName, team, position } = req.body

    if (!studentId || !fullName) {
      return res.status(400).json({ message: "Player ID and name are required" })
    }

    if (!/^P[0-9]{4}$/.test(studentId)) {
      return res.status(400).json({
        message: "Player ID must follow the format P0001"
      })
    }

    const validPositions = ["Pivot", "Ala", "Fixo", "Goalkeeper"]

    if (position && !validPositions.includes(position)) {
      return res.status(400).json({ message: "Invalid player position" })
    }

    const player = await Player.create({
      studentId,
      fullName,
      team,
      position,
      coach: req.coach._id
    })

    res.status(201).json(player)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Player ID already exists for this coach" })
    }

    res.status(500).json({ message: "Server error" })
  }
})

router.put("/:id", protect, async (req, res) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.coach._id
    })

    if (!player) {
      return res.status(404).json({ message: "Player not found" })
    }

    const { studentId, fullName, team, position } = req.body

    if (studentId && !/^P[0-9]{4}$/.test(studentId)) {
      return res.status(400).json({
        message: "Player ID must follow the format P0001"
      })
    }

    const validPositions = ["Pivot", "Ala", "Fixo", "Goalkeeper"]

    if (position && !validPositions.includes(position)) {
      return res.status(400).json({ message: "Invalid player position" })
    }

    player.studentId = studentId ?? player.studentId
    player.fullName = fullName ?? player.fullName
    player.team = team ?? player.team
    player.position = position ?? player.position

    const updatedPlayer = await player.save()
    res.json(updatedPlayer)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Player ID already exists for this coach" })
    }

    res.status(500).json({ message: "Server error" })
  }
})

router.delete("/:id", protect, async (req, res) => {
  try {
    const player = await Player.findOne({
      _id: req.params.id,
      coach: req.coach._id
    })

    if (!player) {
      return res.status(404).json({ message: "Player not found" })
    }

    await player.deleteOne()

    res.json({ message: "Player deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router