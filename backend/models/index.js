const User = require("./User");
const Patient = require("./Patient");
const BPReading = require("./BPReading");
const GlucoseReading = require("./GlucoseReading");
const WeightReading = require("./WeightReading");
const { Medication, MedLog } = require("./Medication");
const Screening = require("./Screening");
const { ABCRecord, SMARTGoal, HungerScale, TCCProgress } = require("./TCC");

module.exports = {
  User, Patient, BPReading, GlucoseReading, WeightReading,
  Medication, MedLog, Screening,
  ABCRecord, SMARTGoal, HungerScale, TCCProgress,
};
