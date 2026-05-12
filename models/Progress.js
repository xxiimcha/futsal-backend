const mongoose = require("mongoose")

const progressSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coach",
      required: true
    },
    skill: {
      type: String,
      enum: ["Passing", "Dribbling", "Shooting"],
      required: true
    },
    stage: {
      type: Number,
      min: 1,
      max: 4,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

progressSchema.index({ player: 1, skill: 1, stage: 1 }, { unique: true })

module.exports = mongoose.model("Progress", progressSchema)