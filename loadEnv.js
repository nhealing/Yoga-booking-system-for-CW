import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["ACCESS_TOKEN_SECRET", "PORT"];
const missingVars = requiredVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

console.log(`Environment loaded. Mode: ${process.env.NODE_ENV || "development"}`);