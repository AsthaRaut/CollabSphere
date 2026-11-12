import mongoose from "mongoose";
import Project from "../models/Project.js";

export const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const isMember = (project, userId) =>
  project.members.some((m) => String(m._id || m) === String(userId));

export const isOwner = (project, userId) => String(project.owner._id || project.owner) === String(userId);

/**
 * Loads a project and checks that the user belongs to it.
 * Returns { project } on success or { status, message } on failure.
 */
export const getProjectForMember = async (projectId, userId) => {
  if (!isValidId(projectId)) return { status: 400, message: "Invalid project ID" };
  const project = await Project.findById(projectId);
  if (!project) return { status: 404, message: "Project not found" };
  if (!isMember(project, userId) && !isOwner(project, userId)) {
    return { status: 403, message: "You are not a member of this project" };
  }
  return { project };
};
