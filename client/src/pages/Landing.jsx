import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Logo from "../components/Logo.jsx";
import useTheme from "../components/useTheme.js";

const FEATURES = [
  { icon: "users", tone: "amber", title: "Project collaboration", text: "Create projects, invite teammates by email and see every project you belong to in one dashboard." },
  { icon: "edit", tone: "blue", title: "Markdown notes", text: "A live split-view Markdown editor for docs, brainstorming and task lists, saved straight to the cloud." },
  { icon: "spark", tone: "violet", title: "Gemini built in", text: "Explain a note, get improvement suggestions, document code or draft a README in one click." },
  { icon: "upload", tone: "green", title: "Files with preview", text: "Drag in code, images and PDFs, preview them instantly and ask Gemini to explain any code file." },
  { icon: "chart", tone: "amber", title: "Contribution analytics", text: "See who wrote what, how active the last two weeks were and how much storage the project uses." },
  { icon: "globe", tone: "blue", title: "Public share page", text: "Publish a read-only project page with your README and chosen notes through one unique link." }
];

export default function Landing() {
  const { theme, toggle } = useTheme();

  return (
    <div className="landing">
      <div className="aurora" />
      <div className="grid-bg" />

      <header className="nav-top">
        <Logo />
        <div className="row">
          <button className="icon-btn" onClick={toggle} aria-label="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <Link to="/login" className="btn btn-ghost">Log in</Link>
          <Link to="/register" className="btn btn-primary">Get started</Link>
        </div>
      </header>

      <section className="hero">
        <span className="pill">
          <Icon name="spark" size={14} /> Powered by Google Gemini
        </span>
        <h1>
          Where developers <em>build, write</em> and think together.
        </h1>
        <p className="sub">
          CollabSphere is a calm, fast workspace for your projects, Markdown notes and code files, with an AI
          teammate that explains, documents and improves everything you share.
        </p>
        <div className="cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start for free <Icon name="arrow" size={18} />
          </Link>
          <Link to="/login" className="btn btn-lg">I already have an account</Link>
        </div>

        <div className="mock" aria-hidden="true">
          <div className="mock-bar"><i /><i /><i /></div>
          <div className="mock-body">
            <div className="mock-side"><span /><span /><span /><span /></div>
            <div className="mock-main">
              <div className="line" style={{ width: "46%", height: 20 }} />
              <div className="line" style={{ width: "88%" }} />
              <div className="line" style={{ width: "72%" }} />
              <div className="ai">
                <b><Icon name="spark" size={15} /> Gemini explains</b>
                <div className="line" style={{ width: "94%" }} />
                <div className="line" style={{ width: "62%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <p className="eyebrow">Everything in one place</p>
          <h2>Built for the way teams actually ship</h2>
          <p>Six focused tools that work together, without the clutter of a giant enterprise suite.</p>
        </div>
        <div className="features">
          {FEATURES.map((f) => (
            <article className="feature" key={f.title}>
              <span className={`stat-icon tone-${f.tone}`}><Icon name={f.icon} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <h2>Ready to collaborate smarter?</h2>
          <p>Create your free account and spin up your first project in under a minute.</p>
          <Link to="/register" className="btn btn-lg">Create my workspace <Icon name="arrow" size={18} /></Link>
        </div>
      </section>

      <footer className="site-foot">
        Designed &amp; built by <b>Astha</b> · CollabSphere · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
