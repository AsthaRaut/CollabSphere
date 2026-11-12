import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";

const POINTS = [
  ["folder", "Projects and teams in one place"],
  ["edit", "Live Markdown notes with AI help"],
  ["spark", "Gemini explains, documents and improves"]
];

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
      navigate(location.state?.from || "/app", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth-art">
        <Link to="/"><Logo /></Link>
        <div>
          <blockquote>
            Ideas are better <em>together</em>.
          </blockquote>
          <div className="auth-points">
            {POINTS.map(([icon, text]) => (
              <div key={text}><Icon name={icon} /> {text}</div>
            ))}
          </div>
        </div>
        <p className="hint">Designed &amp; built by Astha</p>
      </aside>

      <main className="auth-form-wrap">
        <div className="auth-card">
          <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="lead">
            {isRegister ? "Start collaborating in less than a minute." : "Log in to continue to your workspace."}
          </p>

          <form className="form" onSubmit={submit}>
            {error && <div className="form-error" role="alert">{error}</div>}

            {isRegister && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" className="input" value={form.name} onChange={set("name")} placeholder="Your full name" required autoComplete="name" />
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={form.email} onChange={set("email")} placeholder="you@example.com" required autoComplete="email" />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={form.password} onChange={set("password")} placeholder={isRegister ? "At least 6 characters" : "Your password"} required minLength={6} autoComplete={isRegister ? "new-password" : "current-password"} />
            </div>

            <button className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading && <span className="spinner" />}
              {isRegister ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "Already have an account? " : "New to CollabSphere? "}
            <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
