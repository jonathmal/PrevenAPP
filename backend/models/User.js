const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");

const UserSchema = new mongoose.Schema({
  cedula: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["patient", "doctor", "admin"], default: "patient" },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  mustChangePassword: { type: Boolean, default: false },
  securityQuestion: { type: String, trim: true },
  securityAnswerHash: { type: String, select: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (this.isModified("securityAnswerHash") && this.securityAnswerHash && !this.securityAnswerHash.startsWith("$2")) {
    this.securityAnswerHash = await bcrypt.hash(this.securityAnswerHash.toLowerCase().trim(), 12);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.compareSecurityAnswer = async function (answer) {
  if (!this.securityAnswerHash) return false;
  return bcrypt.compare(answer.toLowerCase().trim(), this.securityAnswerHash);
};

UserSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, cedula: this.cedula },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

module.exports = mongoose.model("User", UserSchema);
