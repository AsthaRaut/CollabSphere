import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { deleteFile, explainContent, fileUrl, getFileContent, getProjectFiles, uploadFiles } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import { Empty, Loader, Markdown, Modal, copyText, formatSize, timeAgo } from "../components/ui.jsx";

const ext = (name) => name.slice(name.lastIndexOf(".")).toLowerCase();
const IMAGES = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const CODE = [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".cs", ".go", ".rb", ".php", ".html", ".css", ".json", ".sql", ".sh", ".yml", ".yaml"];

const kindOf = (name) => {
  const e = ext(name);
  if (IMAGES.includes(e)) return { icon: "image", tone: "var(--violet)", label: "Image" };
  if (e === ".pdf") return { icon: "file", tone: "var(--red)", label: "PDF" };
  if (CODE.includes(e)) return { icon: "code", tone: "var(--blue)", label: e.slice(1).toUpperCase() };
  return { icon: "file", tone: "var(--green)", label: "Text" };
};

function PreviewModal({ file, onClose }) {
  const toast = useToast();
  const e = ext(file.fileName);
  const isImage = IMAGES.includes(e);
  const isPdf = e === ".pdf";
  const isCode = CODE.includes(e);

  const [text, setText] = useState(null);
  const [explain, setExplain] = useState({ loading: false, text: "" });

  useEffect(() => {
    if (isImage || isPdf) return;
    getFileContent(file._id)
      .then((d) => setText(d))
      .catch((err) => {
        toast.error(err.message);
        setText({ content: "Could not load this file.", truncated: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file._id]);

  const runExplain = async () => {
    setExplain({ loading: true, text: "" });
    try {
      const d = await explainContent(text.content, "code");
      setExplain({ loading: false, text: d.explanation });
    } catch (err) {
      setExplain({ loading: false, text: "" });
      toast.error(err.message);
    }
  };

  return (
    <Modal title={file.fileName} onClose={onClose} wide>
      {isImage && <img className="preview-img" src={fileUrl(file.filePath)} alt={file.fileName} />}
      {isPdf && <iframe className="preview-frame" src={fileUrl(file.filePath)} title={file.fileName} />}
      {!isImage && !isPdf && (text ? (
        <>
          <pre className="code-view">{text.content}</pre>
          {text.truncated && <p className="hint" style={{ marginTop: 8 }}>Preview truncated to the first 200 KB.</p>}
          {isCode && (
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-ai" onClick={runExplain} disabled={explain.loading}>
                {explain.loading ? <span className="spinner" /> : <Icon name="spark" size={16} />} Explain this code with Gemini
              </button>
            </div>
          )}
          {(explain.loading || explain.text) && (
            <div className="ai-panel">
              <div className="card-head">
                <h3><Icon name="spark" /> Gemini's explanation</h3>
                {explain.text && (
                  <button className="btn btn-sm" onClick={async () => ((await copyText(explain.text)) ? toast.success("Copied") : toast.error("Could not copy"))}>
                    <Icon name="copy" size={14} /> Copy
                  </button>
                )}
              </div>
              {explain.loading ? <div className="loader" style={{ padding: 20 }}><span className="spinner" /> Reading the code…</div> : <Markdown>{explain.text}</Markdown>}
            </div>
          )}
        </>
      ) : <Loader label="Loading file" />)}
    </Modal>
  );
}

export default function Files() {
  const { project, isOwner } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);

  const [files, setFiles] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () =>
    getProjectFiles(project._id)
      .then((d) => setFiles(d.files))
      .catch((e) => {
        toast.error(e.message);
        setFiles([]);
      });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  const upload = async (list) => {
    const picked = Array.from(list);
    if (!picked.length) return;
    if (picked.length > 5) {
      toast.error("You can upload up to 5 files at once");
      return;
    }
    setUploading(true);
    try {
      await uploadFiles(picked, project._id);
      toast.success(`${picked.length} file${picked.length > 1 ? "s" : ""} uploaded`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (file) => {
    if (!window.confirm(`Delete "${file.fileName}"?`)) return;
    try {
      await deleteFile(file._id);
      setFiles((f) => f.filter((x) => x._id !== file._id));
      toast.success("File deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!files) return <Loader label="Loading files" />;

  return (
    <>
      <div
        className={`dropzone ${drag ? "drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        <span className="icon-wrap">{uploading ? <span className="spinner" style={{ borderTopColor: "var(--on-accent)" }} /> : <Icon name="upload" size={26} />}</span>
        <h3>{uploading ? "Uploading…" : "Drop files here or click to browse"}</h3>
        <p>Code, text, images and PDFs · up to 5 files at once · 5 MB each</p>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>

      {files.length === 0 ? (
        <Empty icon="upload" title="No files yet" text="Upload code snippets, design assets or documents to share them with your team." />
      ) : (
        <div className="grid">
          {files.map((f) => {
            const k = kindOf(f.fileName);
            const mine = f.uploadedBy?._id === user.id || isOwner;
            return (
              <article className="file-card" key={f._id}>
                <div className="file-top">
                  <span className="file-ico" style={{ "--tone": k.tone }}><Icon name={k.icon} size={20} /></span>
                  <div className="meta">
                    <strong title={f.fileName}>{f.fileName}</strong>
                    <span>{k.label} · {formatSize(f.fileSize)}</span>
                  </div>
                </div>
                <p className="hint">{f.uploadedBy?.name} · {timeAgo(f.createdAt)}</p>
                <div className="file-actions">
                  <button className="btn btn-sm" onClick={() => setPreview(f)}><Icon name="eye" size={14} /> Preview</button>
                  <a className="btn btn-sm" href={fileUrl(f.filePath)} target="_blank" rel="noreferrer" download={f.fileName}><Icon name="download" size={14} /></a>
                  {CODE.includes(ext(f.fileName)) && (
                    <button className="btn btn-sm btn-ai" onClick={() => setPreview(f)}><Icon name="spark" size={14} /> Explain</button>
                  )}
                  {mine && <button className="icon-btn" aria-label="Delete file" onClick={() => remove(f)}><Icon name="trash" size={16} /></button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
    </>
  );
}
