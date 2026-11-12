import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getAnalytics } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Icon from "../components/Icon.jsx";
import { Avatar, Loader, Stat, formatSize } from "../components/ui.jsx";

function ActivityChart({ data }) {
  const W = 700, H = 220, P = { l: 30, r: 10, t: 14, b: 28 };
  const max = Math.max(3, ...data.map((d) => d.notes + d.files));
  const bw = (W - P.l - P.r) / data.length;
  const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max);
  const ticks = [0, Math.ceil(max / 2), max];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Notes and files created per day over the last 14 days">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
          <text x={P.l - 8} y={y(t) + 3} textAnchor="end">{t}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = P.l + i * bw + bw * 0.2;
        const w = bw * 0.6;
        const nh = y(0) - y(d.notes);
        const fh = y(0) - y(d.files);
        return (
          <g key={d.date}>
            <title>{`${d.date}: ${d.notes} notes, ${d.files} files`}</title>
            <rect x={x} y={y(d.notes)} width={w} height={nh} rx="3" fill="var(--accent)" />
            <rect x={x} y={y(d.notes) - fh} width={w} height={fh} rx="3" fill="var(--blue)" />
            {(i % 2 === 0 || data.length < 8) && (
              <text x={x + w / 2} y={H - 8} textAnchor="middle">{d.date.slice(8)}/{d.date.slice(5, 7)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function Analytics() {
  const { project } = useOutletContext();
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics(project._id)
      .then(setData)
      .catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project._id]);

  if (!data) return <Loader label="Crunching the numbers" />;

  const top = Math.max(1, ...data.members.map((m) => m.total));

  return (
    <div className="stack">
      <section className="stats" style={{ marginBottom: 0 }}>
        <Stat icon="edit" label="Notes created" value={data.totals.notes} tone="amber" />
        <Stat icon="file" label="Files uploaded" value={data.totals.files} tone="blue" />
        <Stat icon="users" label="Team members" value={data.totals.members} tone="violet" />
        <Stat icon="disk" label="Storage used" value={formatSize(data.totals.storage)} tone="green" />
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Icon name="chart" /> Activity · last 14 days</h3>
          <div className="chart-legend">
            <span><i style={{ background: "var(--accent)" }} />Notes</span>
            <span><i style={{ background: "var(--blue)" }} />Files</span>
          </div>
        </div>
        <ActivityChart data={data.activity} />
      </section>

      <section className="card">
        <div className="card-head"><h3><Icon name="users" /> Contributions by member</h3></div>
        {data.members.map((m) => (
          <div className="bar-row" key={m.id}>
            <div className="bar-label"><Avatar name={m.name} size={28} /><span>{m.name}</span></div>
            <div>
              <div className="bar-track" title={`${m.notes} notes · ${m.files} files`}>
                <i style={{ width: `${(m.notes / top) * 100}%`, background: "var(--accent)" }} />
                <i style={{ width: `${(m.files / top) * 100}%`, background: "var(--blue)" }} />
              </div>
              <span className="hint">{m.notes} notes · {m.files} files</span>
            </div>
            <span className="bar-val">{m.total}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
