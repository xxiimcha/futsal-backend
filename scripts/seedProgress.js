const mongoose = require("mongoose")
const dotenv = require("dotenv")
const Player = require("../models/Player")
const Progress = require("../models/Progress")

dotenv.config()

const skills = ["Passing", "Dribbling", "Shooting"]

const seedProgress = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const players = await Player.find()

    if (players.length === 0) {
      console.log("No players found")
      process.exit(0)
    }

    const progressData = []

    players.forEach((player) => {
      skills.forEach((skill) => {
        for (let stage = 1; stage <= 4; stage++) {
          const score = Math.floor(Math.random() * 41) + 60

          progressData.push({
            player: player._id,
            coach: player.coach,
            skill,
            stage,
            score,
            completed: score >= 75
          })
        }
      })
    })

    await Progress.deleteMany({})

    await Progress.insertMany(progressData)

    console.log("Sample progress data added successfully")
    process.exit(0)
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

seedProgress()