const User = require("./User");
const Patient = require("./Patient");
const BPReading = require("./BPReading");
const GlucoseReading = require("./GlucoseReading");
const WeightReading = require("./WeightReading");
const { Medication, MedLog } = require("./Medication");
const Screening = require("./Screening");
const { TCCProgress, ABCRecord, SMARTGoal, HungerScale } = require("./TCC");
const Vaccination = require("./Vaccination");

module.exports = {
  User, Patient, BPReading, GlucoseReading, WeightReading,
  Medication, MedLog, Screening,
  TCCProgress, ABCRecord, SMARTGoal, HungerScale,
  Vaccination,
};
