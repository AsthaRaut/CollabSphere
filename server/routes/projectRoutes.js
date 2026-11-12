import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  saveReadme,
  makeProjectPublic,
  makeProjectPrivate,
  getPublicProject,
  getAnalytics
} from "../controllers/projectController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// public (no login) - must stay above "/:projectId"
router.get("/public/:slug", getPublicProject);

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/:projectId", authMiddleware, getProjectById);
router.put("/:projectId", authMiddleware, updateProject);
router.delete("/:projectId", authMiddleware, deleteProject);

router.post("/:projectId/members", authMiddleware, addMember);
router.delete("/:projectId/members/:userId", authMiddleware, removeMember);

router.put("/:projectId/readme", authMiddleware, saveReadme);
router.post("/:projectId/public", authMiddleware, makeProjectPublic);
router.delete("/:projectId/public", authMiddleware, makeProjectPrivate);
router.get("/:projectId/analytics", authMiddleware, getAnalytics);

export default router;
