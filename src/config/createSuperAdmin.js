require("dotenv").config();

const bcrypt = require("bcryptjs");

const connectDB = require("./db");
const Admin = require("../models/Admin");

const createSuperAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({
      email: process.env.ADMIN_EMAIL.toLowerCase(),
    });

    if (existingAdmin) {
      console.log("Super Admin already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD,
      12
    );

    const admin = await Admin.create({
      name: "Asif",
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: "SUPER_ADMIN",
      permissions: [
        "quotes:read",
        "quotes:update",
        "quotes:delete",
        "contacts:read",
        "contacts:update",
        "contacts:delete",
        "team:manage",
      ],
      isActive: true,
    });

    console.log(`Super Admin created: ${admin.email}`);

    process.exit(0);
  } catch (error) {
    console.error("Super Admin creation failed:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();