import crypto from "crypto";
import fs from "fs";
import path from "path";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import File from "../models/File.js";
import { UPLOAD_DIR } from "../middleware/uploadMiddleware.js";
import { getProjectForMember, isOwner, isValidId } from "../utils/access.js";

const fail = (res, message, error) => res.status(500).json({ message, error: error.message });

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ message: "Name and description are required" });
    }

    const project = await Project.create({
      name,
      description,
      owner: req.userId,
      members: [req.userId]
    });

    res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    fail(res, "Project creation failed", error);
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ members: req.userId })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ updatedAt: -1 });

    // quick counters so the dashboard can show them without extra requests
    const ids = projects.map((p) => p._id);
    const [noteCounts, fileCounts] = await Promise.all([
      Note.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: "$project", n: { $sum: 1 } } }]),
      File.aggregate([{ $match: { project: { $in: ids } } }, { $group: { _id: "$project", n: { $sum: 1 } } }])
    ]);
    const nMap = Object.fromEntries(noteCounts.map((c) => [String(c._id), c.n]));
    const fMap = Object.fromEntries(fileCounts.map((c) => [String(c._id), c.n]));

    res.json({
      projects: projects.map((p) => ({
        ...p.toObject(),
        noteCount: nMap[String(p._id)] || 0,
        fileCount: fMap[String(p._id)] || 0
      }))
    });
  } catch (error) {
    fail(res, "Failed to fetch projects", error);
  }
};

export const getProjectById = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const project = await Project.findById(req.params.projectId)
      .populate("owner", "name email")
      .populate("members", "name email");

    res.json({ project });
  } catch (error) {
    fail(res, "Failed to fetch project", error);
  }
};

export const updateProject = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can edit the project" });
    }

    const { name, description } = req.body;
    if (name?.trim()) project.name = name.trim();
    if (description?.trim()) project.description = description.trim();
    await project.save();

    res.json({ message: "Project updated", project });
  } catch (error) {
    fail(res, "Failed to update project", error);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can delete the project" });
    }

    const files = await File.find({ project: project._id });
    files.forEach((f) => fs.unlink(path.join(UPLOAD_DIR, f.storedName), () => {}));

    await Promise.all([
      File.deleteMany({ project: project._id }),
      Note.deleteMany({ project: project._id }),
      project.deleteOne()
    ]);

    res.json({ message: "Project deleted" });
  } catch (error) {
    fail(res, "Failed to delete project", error);
  }
};

export const addMember = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can add members" });
    }

    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No registered user with that email" });

    if (project.members.some((m) => String(m) === String(user._id))) {
      return res.status(400).json({ message: "User is already a member" });
    }

    project.members.push(user._id);
    await project.save();

    res.json({ message: "Member added successfully", project });
  } catch (error) {
    fail(res, "Failed to add member", error);
  }
};

export const removeMember = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can remove members" });
    }
    if (String(project.owner) === req.params.userId) {
      return res.status(400).json({ message: "The owner cannot be removed" });
    }

    project.members = project.members.filter((m) => String(m) !== req.params.userId);
    await project.save();

    res.json({ message: "Member removed", project });
  } catch (error) {
    fail(res, "Failed to remove member", error);
  }
};

export const saveReadme = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can edit the README" });
    }

    project.readme = String(req.body.readme ?? "");
    await project.save();

    res.json({ message: "README saved", project });
  } catch (error) {
    fail(res, "Failed to save README", error);
  }
};

export const makeProjectPublic = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can make the project public" });
    }

    if (!project.publicSlug) project.publicSlug = crypto.randomBytes(8).toString("hex");
    project.isPublic = true;
    await project.save();

    res.json({ message: "Project is now public", publicSlug: project.publicSlug });
  } catch (error) {
    fail(res, "Failed to make project public", error);
  }
};

export const makeProjectPrivate = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });
    const { project } = access;

    if (!isOwner(project, req.userId)) {
      return res.status(403).json({ message: "Only the project owner can change visibility" });
    }

    project.isPublic = false;
    await project.save();

    res.json({ message: "Project is private again" });
  } catch (error) {
    fail(res, "Failed to make project private", error);
  }
};

export const getPublicProject = async (req, res) => {
  try {
    const project = await Project.findOne({ publicSlug: req.params.slug, isPublic: true })
      .populate("owner", "name")
      .populate("members", "name");

    if (!project) return res.status(404).json({ message: "Public project not found" });

    const [notes, files] = await Promise.all([
      Note.find({ project: project._id, shared: true })
        .populate("createdBy", "name")
        .sort({ createdAt: -1 }),
      File.find({ project: project._id }).select("fileName fileType fileSize createdAt").sort({ createdAt: -1 })
    ]);

    res.json({
      project: {
        _id: project._id,
        name: project.name,
        description: project.description,
        readme: project.readme,
        owner: project.owner,
        members: project.members,
        createdAt: project.createdAt
      },
      notes,
      files
    });
  } catch (error) {
    fail(res, "Failed to fetch public project", error);
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const project = await Project.findById(req.params.projectId).populate("members", "name email");
    const [notes, files] = await Promise.all([
      Note.find({ project: project._id }).select("createdBy createdAt"),
      File.find({ project: project._id }).select("uploadedBy createdAt fileSize")
    ]);

    const members = project.members.map((m) => {
      const n = notes.filter((x) => String(x.createdBy) === String(m._id)).length;
      const f = files.filter((x) => String(x.uploadedBy) === String(m._id)).length;
      return { id: m._id, name: m.name, email: m.email, notes: n, files: f, total: n + f };
    });

    // last 14 days of activity
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toISOString().slice(0, 10), notes: 0, files: 0 });
    }
    const bucket = (item, key) => {
      const label = new Date(item.createdAt).toISOString().slice(0, 10);
      const day = days.find((d) => d.label === label);
      if (day) day[key] += 1;
    };
    notes.forEach((n) => bucket(n, "notes"));
    files.forEach((f) => bucket(f, "files"));

    res.json({
      totals: {
        notes: notes.length,
        files: files.length,
        members: project.members.length,
        storage: files.reduce((sum, f) => sum + (f.fileSize || 0), 0)
      },
      members: members.sort((a, b) => b.total - a.total),
      activity: days.map(({ label, notes: n, files: f }) => ({ date: label, notes: n, files: f }))
    });
  } catch (error) {
    fail(res, "Failed to load analytics", error);
  }
};

export { isValidId };
