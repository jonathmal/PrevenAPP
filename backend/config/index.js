require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGODB_URI || "mongodb://localhost:27017/prevenapp",
  jwtSecret: process.env.JWT_SECRET || "prevenapp-dev-secret-change-in-production",
  jwtExpire: process.env.JWT_EXPIRE || "30d",
  nodeEnv: process.env.NODE_ENV || "development",
};

module.exports = config;
