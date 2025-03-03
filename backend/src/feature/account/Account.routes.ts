import express, { Request, Response } from "express";
import { LocalAccountModel } from "./Account.model";
import { AccountStatus } from "./Account.types"; // Import AccountStatus from your types
import bcrypt from "bcrypt"; // For password hashing
import jwt from "jsonwebtoken"; // For generating JWT tokens

const router = express.Router();

// Register new local account
router.post("/register", async (req: Request, res: Response): Promise<any> => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await LocalAccountModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new local account
    const newAccount = new LocalAccountModel({
      email,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      accountType: "local",
      status: AccountStatus.Active,
      userDetails: { name, email },
      security: { password: hashedPassword },
      device: { id: "device123", name: "MyDevice", os: "Windows", version: "10", uniqueIdentifier: "deviceUniqueId", preferences: { theme: "light", language: "en", notifications: true } }
    });

    // Save the new account to the database
    await newAccount.save();

    return res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Local account login
router.post("/login", async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
    // Find the user by email
    const user = await LocalAccountModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.security.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET ?? "your_jwt_secret",
      { expiresIn: "1h" }
    );

    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Update local account details (e.g., name, email)
router.put("/update", async (req: Request, res: Response): Promise<any> => {
  const { userId, name, email } = req.body;

  if (!userId || !name || !email) {
    return res.status(400).json({ message: "User ID, name, and email are required" });
  }

  try {
    // Find the user by ID and update the details
    const user = await LocalAccountModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.userDetails.name = name;
    user.userDetails.email = email;
    user.updated = new Date().toISOString();

    // Save the updated user details
    await user.save();

    return res.status(200).json({ message: "Account updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
});

// Deactivate local account
router.put("/deactivate", async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Find the user by ID and deactivate the account
    const user = await LocalAccountModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = AccountStatus.Inactive;
    user.updated = new Date().toISOString();

    // Save the changes
    await user.save();

    return res.status(200).json({ message: "Account deactivated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err });
  }
});

export default router;
