import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/user.model.js";
dotenv.config();
const main = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
  await connectDatabase();
  const email = ADMIN_EMAIL.toLowerCase();
  if (await User.findOne({ email })) { console.log("Admin account already exists"); process.exit(0); }
  await User.create({ name: ADMIN_NAME, email, password: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "ADMIN" });
  console.log("Admin account created successfully"); process.exit(0);
};
main().catch((error) => { console.error("Failed to create admin:", error); process.exit(1); });
