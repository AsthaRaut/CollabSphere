import Note from "../models/Note.js";
import { getProjectForMember, isOwner, isValidId } from "../utils/access.js";

const fail = (res, message, error) => res.status(500).json({ message, error: error.message });

export const createNote = async (req, res) => {
  try {
    const { title, content, projectId, shared } = req.body;

    if (!title?.trim() || !content?.trim() || !projectId) {
      return res.status(400).json({ message: "Title, content and projectId are required" });
    }

    const access = await getProjectForMember(projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const note = await Note.create({
      title: title.trim(),
      content,
      project: projectId,
      createdBy: req.userId,
      shared: Boolean(shared)
    });

    await note.populate("createdBy", "name email");
    res.status(201).json({ message: "Note created successfully", note });
  } catch (error) {
    fail(res, "Note creation failed", error);
  }
};

export const getNotes = async (req, res) => {
  try {
    const access = await getProjectForMember(req.params.projectId, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const notes = await Note.find({ project: req.params.projectId })
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });

    res.json({ notes });
  } catch (error) {
    fail(res, "Failed to fetch notes", error);
  }
};

// Any member can edit; only the author (or project owner) can delete
export const updateNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    if (!isValidId(noteId)) return res.status(400).json({ message: "Invalid note ID" });

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const access = await getProjectForMember(note.project, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    const { title, content, shared } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: "Title cannot be empty" });
      note.title = title.trim();
    }
    if (content !== undefined) {
      if (!content.trim()) return res.status(400).json({ message: "Content cannot be empty" });
      note.content = content;
    }
    if (shared !== undefined) note.shared = Boolean(shared);

    await note.save();
    await note.populate("createdBy", "name email");

    res.json({ message: "Note updated successfully", note });
  } catch (error) {
    fail(res, "Note update failed", error);
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    if (!isValidId(noteId)) return res.status(400).json({ message: "Invalid note ID" });

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const access = await getProjectForMember(note.project, req.userId);
    if (!access.project) return res.status(access.status).json({ message: access.message });

    if (String(note.createdBy) !== req.userId && !isOwner(access.project, req.userId)) {
      return res.status(403).json({ message: "Only the author or project owner can delete this note" });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    fail(res, "Note deletion failed", error);
  }
};
