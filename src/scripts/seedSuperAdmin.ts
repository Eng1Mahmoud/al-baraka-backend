// Must be the first import — see the note in app.ts.
import "dotenv/config";

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";

/**
 * Creates the single superadmin account and the settings document.
 * Run once after setting SUPERADMIN_* in .env:  npm run seed:superadmin
 */
const seed = async () => {
  const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ role: "superadmin" });
  if (existing) {
    console.log(`Superadmin already exists: ${existing.email} — nothing to do.`);
  } else {
    await User.create({
      name: SUPERADMIN_NAME || "Super Admin",
      email: SUPERADMIN_EMAIL.toLowerCase(),
      password: await bcrypt.hash(SUPERADMIN_PASSWORD, 10),
      role: "superadmin",
    });
    console.log(`Superadmin created: ${SUPERADMIN_EMAIL}`);
  }

  const settings = await Settings.findOne();
  if (!settings) {
    await Settings.create({});
    console.log("Settings document created with defaults.");
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
