import express from "express";
import { createNote, getNotes, updateNote, deleteNote } from "../controllers/noteController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createNote);
router.get("/:projectId", authMiddleware, getNotes);
router.put("/:noteId", authMiddleware, updateNote);
router.delete("/:noteId", authMiddleware, deleteNote);

export default router;
