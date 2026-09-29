import bcrypt from "bcrypt";
import { User, UserRole } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { generateToken } from "../utils/jwt.js";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginUserInput {
  email: string;
  password: string;
}

export const registerUser = async (
  input: RegisterUserInput
) => {
  const { name, email, password, role } = input;

  const existingUser = await User.findOne({
    email: email.toLowerCase()
  });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "CANDIDATE"
  });

  return user;
};

export const loginUser = async (
  input: LoginUserInput
) => {
  const { email, password } = input;

  const user = await User.findOne({
    email: email.toLowerCase()
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account is inactive");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({
    userId: user._id.toString(),
    role: user.role
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};