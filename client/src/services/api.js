const ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const API_URL = `${ROOT}/api`;

export const fileUrl = (filePath) => `${ROOT}/${filePath}`;

export const getToken = () => localStorage.getItem("token");

export const request = async (endpoint, options = {}) => {
  const headers = { ...(options.headers || {}) };
  const isForm = options.body instanceof FormData;

  if (!isForm && options.body) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event("cs-unauthorised"));
    }
    throw new Error(data.message || "Something went wrong");
  }
  return data;
};

const json = (method, body) => ({ method, body: JSON.stringify(body) });

// auth
export const registerUser = (d) => request("/auth/register", json("POST", d));
export const loginUser = (d) => request("/auth/login", json("POST", d));
export const getMe = () => request("/auth/me");

// projects
export const createProject = (d) => request("/projects", json("POST", d));
export const getProjects = () => request("/projects");
export const getProjectById = (id) => request(`/projects/${id}`);
export const updateProject = (id, d) => request(`/projects/${id}`, json("PUT", d));
export const deleteProject = (id) => request(`/projects/${id}`, { method: "DELETE" });
export const addMember = (id, email) => request(`/projects/${id}/members`, json("POST", { email }));
export const removeMember = (id, userId) => request(`/projects/${id}/members/${userId}`, { method: "DELETE" });
export const saveReadme = (id, readme) => request(`/projects/${id}/readme`, json("PUT", { readme }));
export const makeProjectPublic = (id) => request(`/projects/${id}/public`, { method: "POST" });
export const makeProjectPrivate = (id) => request(`/projects/${id}/public`, { method: "DELETE" });
export const getPublicProject = (slug) => request(`/projects/public/${slug}`);
export const getAnalytics = (id) => request(`/projects/${id}/analytics`);

// notes
export const getNotes = (projectId) => request(`/notes/${projectId}`);
export const createNote = (d) => request("/notes", json("POST", d));
export const updateNote = (id, d) => request(`/notes/${id}`, json("PUT", d));
export const deleteNote = (id) => request(`/notes/${id}`, { method: "DELETE" });

// files
export const getProjectFiles = (projectId) => request(`/files/${projectId}`);
export const deleteFile = (id) => request(`/files/${id}`, { method: "DELETE" });
export const getFileContent = (id) => request(`/files/content/${id}`);
export const uploadFiles = (files, projectId) => {
  const form = new FormData();
  form.append("projectId", projectId);
  if (files.length === 1) {
    form.append("file", files[0]);
    return request("/files/upload", { method: "POST", body: form });
  }
  files.forEach((f) => form.append("files", f));
  return request("/files/upload-multiple", { method: "POST", body: form });
};

// gemini
export const explainContent = (content, type = "text") => request("/gemini/explain", json("POST", { content, type }));
export const improveNote = (content) => request("/gemini/improve", json("POST", { content }));
export const generateDocs = (content) => request("/gemini/docs", json("POST", { content }));
export const generateReadme = (content, projectName) =>
  request("/gemini/readme", json("POST", { content, projectName }));
