import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  uploadFile,
  uploadMultipleFiles,
  getProjectFiles,
  getFileContent,
  deleteFile
} from "../controllers/fileController.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("file"), uploadFile);
router.post("/upload-multiple", authMiddleware, upload.array("files", 5), uploadMultipleFiles);
router.get("/content/:fileId", authMiddleware, getFileContent);
router.get("/:projectId", authMiddleware, getProjectFiles);
router.delete("/:fileId", authMiddleware, deleteFile);

export default router;
