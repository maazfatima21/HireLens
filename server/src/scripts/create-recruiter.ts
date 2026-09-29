import dotenv from "dotenv";
import bcrypt from "bcrypt";

import { connectDatabase } from "../config/database.js";
import { User } from "../models/user.model.js";

dotenv.config();

const createRecruiter = async (): Promise<void> => {
  await connectDatabase();

  const name = process.env.RECRUITER_NAME;
  const email = process.env.RECRUITER_EMAIL?.toLowerCase();
  const password = process.env.RECRUITER_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "RECRUITER_NAME, RECRUITER_EMAIL, and RECRUITER_PASSWORD are required"
    );
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log("Recruiter account already exists");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "RECRUITER"
  });

  console.log("Recruiter account created successfully");

  process.exit(0);
};

createRecruiter().catch((error) => {
  console.error("Failed to create recruiter:", error);
  process.exit(1);
});
