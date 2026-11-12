import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Modal } from "./ui.jsx";

export default function CreateProjectModal({ onClose }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { project } = await createProject(form);
      toast.success("Project created");
      navigate(`/app/projects/${project._id}`);
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <Modal title="Create a new project" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="pname">Project name</label>
          <input id="pname" className="input" autoFocus required maxLength={80} placeholder="e.g. MyWebApp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="pdesc">What is it about?</label>
          <textarea id="pdesc" className="textarea" required placeholder="Define the scope in a sentence or two…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading}>
            {loading && <span className="spinner" />} Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}
