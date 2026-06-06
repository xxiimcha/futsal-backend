const mongoose = require("mongoose")

const playerSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      enum: ["Pivot", "Ala", "Fixo", "Goalkeeper"],
      default: "Pivot"
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    team: {
      type: String,
      default: ""
    },
    level: {
      type: String,
      default: "Beginner"
    },
    completedDrills: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coach",
      required: true
    }
  },
  {
    timestamps: true
  }
)

playerSchema.index({ studentId: 1, coach: 1 }, { unique: true })

module.exports = mongoose.model("Player", playerSchema)