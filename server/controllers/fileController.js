import fs from "fs";
import path from "path";
import File from "../models/File.js";
import { UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import { getProjectForMember, isOwner, isValidId } from "../utils/access.js";

const fail = (res, message, error) => res.status(500).json({ message, error: error.message });

const removeFromDisk = (files) => files.forEach((f) => fs.unlink(path.join(UPLOAD_DIR, f.storedName), () => {}));

const toRecord = (file, projectId, userId) => ({
  fileName: file.originalname,
  storedName: file.filename,
  filePath: `uploads/${file.filename}`,
  fileType: file.mimetype,
  fileSize: file.size,
  project: projectId,
  uploadedBy: userId
});

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Please choose a file to upload" });

    const { projectId } = req.body;
    const access = projectId ? await getProjectForMember(projectId, req.userId) : { status: 400, message: "Project ID is required" };
    if (!access.project) {
      removeFromDisk([{ storedName: req.file.filename }]);
      return res.status(access.status).json({ message: access.message });
    }

    const file = await File.create(toRecord(req.file, projectId, req.userId));
    await file.populate("uploadedBy", "name email");
    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (error) {
    fail(res, "File upload failed", error);
  }
};

export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: "Please choose at least one file" });

    const { projectId } = req.body;
    const access = projectId ? await getProjectForMember(projectId, req.userId) : { status: 400, message: "Project ID is required" };
    if (!access.project) {
      removeFromDisk(req.files.map((f) => ({ storedName: f.filename })));
      return res.status(access.status).json({ message: access.message });
    }

    const files = await File.insertMany(req.files.map((f) => toRecord(f, projectId, req.userId)));
    res.status(201).json({ message: "Files uploaded successfully", files });
  } catch (error) {
    fail(res, "Multiple file upload failed", error);
  }
};

export const getProjectFiles = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const files = await File.find({ project: req.params.projectId })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ files });
  } catch (error) {
    fail(res, "Failed to load files", error);
  }
};

// Returns the text of a text/code file so the client can preview it or send it to Gemini
export const getFileContent = async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!isValidId(fileId)) return res.status(400).json({ message: "Invalid file ID" });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const access = await getProjectForMember(file.project, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const ext = path.extname(file.fileName).toLowerCase();
    if ([".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) {
      return res.status(400).json({ message: "This file is not a text file" });
    }

    const full = path.join(UPLOAD_DIR, file.storedName);
    if (!fs.existsSync(full)) return res.status(404).json({ message: "File is missing on the server" });

    const MAX = 200 * 1024;
    const buffer = fs.readFileSync(full);
    const truncated = buffer.length > MAX;

    res.json({
      fileName: file.fileName,
      content: buffer.subarray(0, MAX).toString("utf8"),
      truncated
    });
  } catch (error) {
    fail(res, "Could not read the file", error);
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!isValidId(fileId)) return res.status(400).json({ message: "Invalid file ID" });

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const access = await getProjectForMember(file.project, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    if (String(file.uploadedBy) !== req.userId && !isOwner(access.project, req.userId)) {
      return res.status(403).json({ message: "Only the uploader or project owner can delete this file" });
    }

    removeFromDisk([file]);
    await file.deleteOne();
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    fail(res, "File deletion failed", error);
  }
};
