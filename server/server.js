import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import { UPLOAD_DIR } from "./middleware/uploadMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import geminiRoutes from "./routes/geminiRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to server/.env");
  process.exit(1);
}

console.log("Gemini API key loaded:", Boolean(process.env.GEMINI_API_KEY));

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "2mb" }));

app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/files", fileRoutes);

app.get("/", (req, res) => {
  res.json({ message: "CollabSphere API is running", author: "Astha" });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File size must be less than 5 MB" });
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "Too many files. You can upload up to 5 at once" });
  }
  if (error.message === "This file type is not allowed") {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Something went wrong", error: error.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
