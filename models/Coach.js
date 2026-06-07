const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const coachSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String
    },
    emailVerificationExpire: {
      type: Date
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

coachSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

coachSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model("Coach", coachSchema)