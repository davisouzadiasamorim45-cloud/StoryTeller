import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — "Editorial Night" : ink violet + premiere gold     */
/* ------------------------------------------------------------------ */
const T = {
  ink: "#100E1B",
  surface: "#1B1830",
  surface2: "#242040",
  paper: "#F4EFE6",
  gold: "#E9B44C",
  coral: "#E5644E",
  sage: "#7FB5A8",
  lav: "#8E87A8",
  rose: "#D9A5C0",
  line: "rgba(244,239,230,0.10)",
};
const CHART_COLORS = [T.gold, T.sage, T.coral, T.rose, T.lav, "#C8B8E8", "#E8D5A0", "#9FD0C4"];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Space+Grotesk:wght@300..600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: ${T.ink}; }
.dst-root { background: ${T.ink}; color: ${T.paper}; font-family: 'Space Grotesk', sans-serif; min-height: 100vh; overflow-x: hidden; }
.dst-display { font-family: 'Fraunces', serif; }
.dst-eyebrow { font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: ${T.gold}; font-weight: 500; }
.dst-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1); }
.dst-fade.on { opacity: 1; transform: translateY(0); }
.dst-drop { border: 1px dashed rgba(233,180,76,0.45); border-radius: 20px; padding: 44px 32px; cursor: pointer; transition: border-color .3s, background .3s, transform .3s; background: rgba(233,180,76,0.04); }
.dst-drop:hover, .dst-drop.over { border-color: ${T.gold}; background: rgba(233,180,76,0.09); transform: translateY(-2px); }
.dst-btn { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.04em; padding: 13px 26px; border-radius: 999px; border: 1px solid rgba(244,239,230,0.25); background: transparent; color: ${T.paper}; cursor: pointer; transition: all .25s; }
.dst-btn:hover { border-color: ${T.gold}; color: ${T.gold}; }
.dst-btn.solid { background: ${T.gold}; border-color: ${T.gold}; color: ${T.ink}; font-weight: 600; }
.dst-btn.solid:hover { background: #F2C56A; color: ${T.ink}; }
.dst-btn:focus-visible, .dst-drop:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 3px; }
.dst-chip { display:inline-block; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:${T.lav}; border:1px solid ${T.line}; border-radius:999px; padding:5px 12px; margin:0 6px 8px 0; }
.dst-spine { position: fixed; left: 28px; top: 0; bottom: 0; width: 1px; background: ${T.line}; z-index: 40; }
.dst-spine-fill { position: absolute; top: 0; left: 0; width: 100%; background: linear-gradient(${T.gold}, ${T.coral}); transition: height .15s linear; }
.dst-tick { position: absolute; left: -3.5px; width: 8px; height: 8px; border-radius: 50%; background: ${T.surface2}; border: 1px solid ${T.lav}; transition: background .4s, border-color .4s, box-shadow .4s; }
.dst-tick.hit { background: ${T.gold}; border-color: ${T.gold}; box-shadow: 0 0 12px rgba(233,180,76,0.7); }
.dst-tooltip { background: ${T.surface2}; border: 1px solid ${T.line}; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: ${T.paper}; }
.dst-pulse { animation: dstPulse 2.4s ease-in-out infinite; }
@keyframes dstPulse { 0%,100% { opacity:.4 } 50% { opacity:1 } }
@keyframes dstScan { 0% { transform: translateX(-100%);} 100% { transform: translateX(340%);} }
.dst-scanbar { position:absolute; top:0; bottom:0; width:30%; background: linear-gradient(90deg, transparent, rgba(233,180,76,0.25), transparent); animation: dstScan 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .dst-fade { transition: none; opacity: 1; transform: none; }
  .dst-pulse, .dst-scanbar { animation: none; }
}
@media (max-width: 720px) { .dst-spine { left: 12px; } }
`;

/* ------------------------------------------------------------------ */
/*  SAMPLE DATA — European e-commerce sales                            */
/* ------------------------------------------------------------------ */
const SAMPLE_CSV = `Date,Country,Category,Channel,Revenue,Orders
2025-01-05,Germany,Electronics,Online,18420,112
2025-01-12,France,Home & Living,Online,9310,74
2025-01-19,Netherlands,Electronics,Marketplace,12150,88
2025-01-26,Spain,Fashion,Online,7640,95
2025-02-02,Germany,Fashion,Marketplace,11890,131
2025-02-09,France,Electronics,Online,15230,97
2025-02-16,Portugal,Home & Living,Online,5210,41
2025-02-23,Netherlands,Fashion,Online,8875,102
2025-03-02,Germany,Electronics,Online,21540,128
2025-03-09,Spain,Home & Living,Marketplace,6420,52
2025-03-16,France,Fashion,Online,10110,118
2025-03-23,Italy,Electronics,Online,13780,91
2025-03-30,Germany,Home & Living,Online,8930,66
2025-04-06,Netherlands,Electronics,Online,16890,109
2025-04-13,France,Home & Living,Marketplace,7215,55
2025-04-20,Spain,Electronics,Online,11930,79
2025-04-27,Italy,Fashion,Online,9480,111
2025-05-04,Germany,Electronics,Marketplace,23110,139
2025-05-11,Portugal,Fashion,Online,6090,72
2025-05-18,France,Electronics,Online,17650,105
2025-05-25,Netherlands,Home & Living,Online,7980,58
2025-06-01,Germany,Fashion,Online,13240,148
2025-06-08,Spain,Electronics,Marketplace,12470,83
2025-06-15,Italy,Home & Living,Online,7130,49
2025-06-22,France,Fashion,Marketplace,11560,127
2025-06-29,Germany,Electronics,Online,26380,152
2025-07-06,Netherlands,Fashion,Online,10240,116
2025-07-13,Portugal,Electronics,Online,8360,54
2025-07-20,Spain,Home & Living,Online,6890,51
2025-07-27,France,Electronics,Online,19240,114
2025-08-03,Germany,Home & Living,Marketplace,10120,71
2025-08-10,Italy,Electronics,Online,14980,94
2025-08-17,Netherlands,Electronics,Online,18310,117
2025-08-24,France,Home & Living,Online,8540,61
2025-08-31,Germany,Fashion,Online,14890,163
2025-09-07,Spain,Fashion,Marketplace,9130,104
2025-09-14,Portugal,Home & Living,Online,5760,44
2025-09-21,France,Electronics,Marketplace,16720,101
2025-09-28,Germany,Electronics,Online,28950,161
2025-10-05,Italy,Fashion,Online,10870,122
2025-10-12,Netherlands,Home & Living,Online,8420,60
2025-10-19,Spain,Electronics,Online,13560,87
2025-10-26,France,Fashion,Online,12340,133
2025-11-02,Germany,Electronics,Marketplace,31240,174
2025-11-09,Portugal,Electronics,Online,9540,62
2025-11-16,Netherlands,Fashion,Marketplace,12780,138
2025-11-23,France,Electronics,Online,24870,142
2025-11-30,Germany,Home & Living,Online,12980,89
2025-12-07,Italy,Electronics,Online,19340,118
2025-12-14,Spain,Fashion,Online,14230,157
2025-12-21,Germany,Electronics,Online,36780,198
2025-12-28,France,Home & Living,Marketplace,11450,78`;

/* ------------------------------------------------------------------ */
/*  DATA PROFILING + AGGREGATION ENGINE                                */
/* ------------------------------------------------------------------ */
const fmt = (n) => {
  if (n == null || isNaN(n)) return "–";
  const abs = Math.abs(n);
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: abs < 10 ? 1 : 0 }).format(n);
};
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function profileColumns(rows) {
  const names = Object.keys(rows[0] || {});
  return names.map((name) => {
    const vals = rows.map((r) => r[name]).filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
    if (!vals.length) return { name, type: "skip" };
    const numOk = vals.filter((v) => !isNaN(parseFloat(String(v).replace(/[,€$£\s]/g, ""))) && isFinite(String(v).replace(/[,€$£\s]/g, ""))).length;
    const dateOk = vals.filter((v) => /[-\/]/.test(String(v)) && !isNaN(Date.parse(v))).length;
    const uniq = new Set(vals.map(String)).size;
    if (dateOk / vals.length > 0.8 && numOk / vals.length < 0.5) return { name, type: "date" };
    if (numOk / vals.length > 0.8) return { name, type: "number" };
    if (uniq <= Math.max(30, vals.length * 0.4)) return { name, type: "category", uniq };
    return { name, type: "skip" };
  });
}
const num = (v) => parseFloat(String(v).replace(/[,€$£\s]/g, "")) || 0;

function buildCandidates(rows, cols) {
  const numeric = cols.filter((c) => c.type === "number");
  const cats = cols.filter((c) => c.type === "category");
  const dateCol = cols.find((c) => c.type === "date");
  const out = [];

  numeric.forEach((n) => {
    const total = rows.reduce((s, r) => s + num(r[n.name]), 0);
    out.push({ id: `total-${n.name}`, kind: "kpi", metric: n.name, total,
      desc: `Grand total of ${n.name}: ${fmt(total)} across ${rows.length} rows.` });
  });

  if (dateCol) {
    numeric.forEach((n) => {
      const byMonth = {};
      rows.forEach((r) => {
        const d = new Date(r[dateCol.name]);
        if (isNaN(d)) return;
        const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
        byMonth[k] = (byMonth[k] || 0) + num(r[n.name]);
      });
      const series = Object.keys(byMonth).sort().map((k) => ({
        label: MONTHS[+k.split("-")[1]] + " " + k.split("-")[0].slice(2), value: Math.round(byMonth[k]),
      }));
      if (series.length >= 3) {
        const first = series[0].value, last = series[series.length - 1].value;
        const growth = first ? Math.round(((last - first) / first) * 100) : 0;
        const peak = series.reduce((a, b) => (b.value > a.value ? b : a));
        const low = series.reduce((a, b) => (b.value < a.value ? b : a));
        out.push({ id: `trend-${n.name}`, kind: "line", metric: n.name, data: series, growth, peak, low,
          desc: `${n.name} over time: from ${fmt(first)} (${series[0].label}) to ${fmt(last)} (${series[series.length-1].label}), ${growth >= 0 ? "+" : ""}${growth}% change. Peak: ${peak.label} (${fmt(peak.value)}). Lowest: ${low.label} (${fmt(low.value)}).` });
      }
    });
  }

  cats.forEach((c) => {
    numeric.forEach((n) => {
      const agg = {};
      rows.forEach((r) => { const k = String(r[c.name]); agg[k] = (agg[k] || 0) + num(r[n.name]); });
      const sorted = Object.entries(agg).sort((a, b) => b[1] - a[1]);
      const data = sorted.slice(0, 8).map(([label, value]) => ({ label, value: Math.round(value) }));
      const total = sorted.reduce((s, [, v]) => s + v, 0);
      const share = total ? Math.round((sorted[0][1] / total) * 100) : 0;
      const kind = sorted.length <= 6 ? "donut" : "bar";
      out.push({ id: `${kind}-${c.name}-${n.name}`, kind, dim: c.name, metric: n.name, data, leaderShare: share,
        desc: `${n.name} by ${c.name}: leader is "${sorted[0][0]}" with ${fmt(sorted[0][1])} (${share}% of total). Runner-up: "${sorted[1]?.[0]}" (${fmt(sorted[1]?.[1])}). ${sorted.length} groups total.` });
    });
    if (!numeric.length) {
      const agg = {};
      rows.forEach((r) => { const k = String(r[c.name]); agg[k] = (agg[k] || 0) + 1; });
      const data = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
      out.push({ id: `bar-${c.name}-count`, kind: "bar", dim: c.name, metric: "count", data,
        desc: `Row count by ${c.name}: top group "${data[0].label}" with ${data[0].value}.` });
    }
  });
  return out;
}

/* Fallback narrative if the AI call fails — the demo never breaks. */
function fallbackStory(candidates, fileName) {
  const kpi = candidates.find((c) => c.kind === "kpi");
  const trend = candidates.find((c) => c.kind === "line");
  const bars = candidates.filter((c) => c.kind === "bar" || c.kind === "donut");
  const chapters = [];
  if (trend) chapters.push({ chartId: trend.id, eyebrow: "The journey",
    headline: `${trend.growth >= 0 ? "Up" : "Down"} ${Math.abs(trend.growth)}% from start to finish`,
    narrative: `${trend.metric} moved from ${fmt(trend.data[0].value)} to ${fmt(trend.data[trend.data.length - 1].value)}. The peak arrived in ${trend.peak.label}, while ${trend.low.label} marked the quietest moment of the period.`,
    kpi: { label: "peak month", value: trend.peak.label } });
  bars.slice(0, 3).forEach((b, i) => chapters.push({ chartId: b.id,
    eyebrow: ["The leader", "The split", "The pattern"][i] || "The detail",
    headline: `"${b.data[0].label}" leads ${b.metric} by ${b.dim}`,
    narrative: `With ${fmt(b.data[0].value)}, ${b.data[0].label} accounts for roughly ${b.leaderShare || "a large"}% of the total — ahead of ${b.data[1]?.label || "the rest"} at ${fmt(b.data[1]?.value)}.`,
    kpi: { label: `${b.dim} leader share`, value: (b.leaderShare || 0) + "%" } }));
  return {
    title: "The story inside your data",
    subtitle: `An automated reading of ${fileName}`,
    heroKpi: kpi ? { label: `total ${kpi.metric}`, value: kpi.total } : null,
    chapters: chapters.slice(0, 5),
    closing: "Every dataset hides a narrative. This one just told you its own — no analyst required.",
  };
}

/* AI narrative via the Anthropic API */
async function aiStory(candidates, fileName, rowCount) {
  const facts = candidates.map((c) => `[${c.id}] ${c.desc}`).join("\n");
  const prompt = `You are a sharp, warm data journalist. A user uploaded "${fileName}" (${rowCount} rows). Below are pre-computed facts, each with a chart id in brackets.

FACTS:
${facts}

Write a scroll-story. Respond ONLY with valid JSON, no markdown fences, matching exactly:
{"title": "short evocative title (max 7 words)","subtitle":"one calm sentence","chapters":[{"chartId":"must be one of the ids above (never a kpi- or total- id)","eyebrow":"2-3 word chapter label","headline":"punchy headline with a real number from the facts (max 12 words)","narrative":"2-3 sentences, concrete numbers, journalist tone, no hype words","kpi":{"label":"tiny caption","value":"short striking figure from the facts"}}],"closing":"one elegant final sentence"}

Rules: 4 to 5 chapters. Use only numbers present in the facts. Prefer one trend chapter first if available, then comparisons. Never invent data.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  const valid = new Set(candidates.map((c) => c.id));
  parsed.chapters = (parsed.chapters || []).filter((ch) => valid.has(ch.chartId) && !ch.chartId.startsWith("total-")).slice(0, 5);
  if (!parsed.chapters.length) throw new Error("no valid chapters");
  const kpi = candidates.find((c) => c.kind === "kpi");
  parsed.heroKpi = kpi ? { label: `total ${kpi.metric}`, value: kpi.total } : null;
  return parsed;
}

/* ------------------------------------------------------------------ */
/*  UI PRIMITIVES                                                      */
/* ------------------------------------------------------------------ */
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, on];
}

function CountUp({ value, prefix = "", suffix = "", active }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (reduced()) { setN(value); return; }
    let raf, start;
    const dur = 1600;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      setN(value * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);
  return <span>{prefix}{fmt(n)}{suffix}</span>;
}

const ChartTooltip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div className="dst-tooltip"><strong>{label ?? payload[0].payload.label}</strong><br />{fmt(payload[0].value)}</div>
  ) : null;

function ChapterChart({ spec, animate }) {
  const common = { data: spec.data, margin: { top: 8, right: 12, bottom: 4, left: -8 } };
  const axis = { stroke: T.lav, fontSize: 12, tickLine: false, axisLine: { stroke: T.line } };
  if (spec.kind === "line")
    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart {...common}>
          <defs><linearGradient id={`g-${spec.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.gold} stopOpacity={0.35} /><stop offset="100%" stopColor={T.gold} stopOpacity={0} />
          </linearGradient></defs>
          <CartesianGrid stroke={T.line} vertical={false} />
          <XAxis dataKey="label" {...axis} /><YAxis {...axis} tickFormatter={fmt} width={54} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke={T.gold} strokeWidth={2.5} fill={`url(#g-${spec.id})`}
            isAnimationActive={animate && !reduced()} animationDuration={1400} dot={{ r: 3, fill: T.gold, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    );
  if (spec.kind === "donut")
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={spec.data} dataKey="value" nameKey="label" innerRadius={78} outerRadius={118} paddingAngle={3}
            isAnimationActive={animate && !reduced()} animationDuration={1200} stroke={T.ink} strokeWidth={2}>
            {spec.data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart {...common}>
        <CartesianGrid stroke={T.line} vertical={false} />
        <XAxis dataKey="label" {...axis} interval={0} tick={{ fill: T.lav, fontSize: 11 }} /><YAxis {...axis} tickFormatter={fmt} width={54} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(244,239,230,0.05)" }} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} isAnimationActive={animate && !reduced()} animationDuration={1200}>
          {spec.data.map((_, i) => <Cell key={i} fill={i === 0 ? T.gold : T.surface2} stroke={i === 0 ? "none" : T.line} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREENS                                                            */
/* ------------------------------------------------------------------ */
function Landing({ onFile, onSample, error }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
        <p className="dst-eyebrow" style={{ marginBottom: 22 }}>Data Storyteller</p>
        <h1 className="dst-display" style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 400, lineHeight: 1.08, marginBottom: 18 }}>
          Your spreadsheet has a <em style={{ color: T.gold }}>story</em> to tell.
        </h1>
        <p style={{ color: T.lav, fontSize: 17, lineHeight: 1.6, marginBottom: 40, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
          Drop a CSV and watch it become a scroll-driven narrative — insights written by AI, charts that move, numbers that matter.
        </p>
        <div
          className={`dst-drop ${over ? "over" : ""}`}
          role="button" tabIndex={0} aria-label="Upload a CSV file"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
        >
          <div style={{ fontSize: 34, marginBottom: 10 }}>⇪</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Drop your CSV here</div>
          <div style={{ fontSize: 13, color: T.lav, marginTop: 6 }}>or click to browse — nothing leaves your browser except an anonymous summary</div>
          <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>
        <div style={{ marginTop: 26 }}>
          <button className="dst-btn" onClick={onSample}>Try with sample data →</button>
        </div>
        {error && <p style={{ color: T.coral, marginTop: 20, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  );
}

function Analyzing({ fileName, step }) {
  const steps = ["Reading columns", "Profiling types & ranges", "Computing aggregates", "Writing your story"];
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <p className="dst-eyebrow" style={{ marginBottom: 14 }}>Analyzing</p>
        <h2 className="dst-display" style={{ fontSize: 30, fontWeight: 400, marginBottom: 34 }}>{fileName}</h2>
        <div style={{ position: "relative", height: 3, background: T.line, borderRadius: 2, overflow: "hidden", marginBottom: 34 }}>
          <div className="dst-scanbar" />
        </div>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", color: i <= step ? T.paper : T.lav, opacity: i <= step ? 1 : 0.45, transition: "all .4s" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? T.sage : i === step ? T.gold : T.line }} className={i === step ? "dst-pulse" : ""} />
            <span style={{ fontSize: 15 }}>{s}{i < step ? "  ✓" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chapter({ ch, spec, index, flip }) {
  const [ref, on] = useInView(0.3);
  return (
    <section ref={ref} data-chapter={index} style={{ minHeight: "92vh", display: "flex", alignItems: "center", padding: "60px clamp(20px, 6vw, 90px)" }}>
      <div style={{ display: "flex", flexDirection: flip ? "row-reverse" : "row", flexWrap: "wrap", gap: "clamp(28px, 5vw, 72px)", alignItems: "center", width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        <div className={`dst-fade ${on ? "on" : ""}`} style={{ flex: "1 1 340px", minWidth: 300 }}>
          <p className="dst-eyebrow" style={{ marginBottom: 14 }}>{String(index + 1).padStart(2, "0")} · {ch.eyebrow}</p>
          <h2 className="dst-display" style={{ fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 450, lineHeight: 1.15, marginBottom: 18 }}>{ch.headline}</h2>
          <p style={{ color: T.lav, fontSize: 16.5, lineHeight: 1.7, marginBottom: 26 }}>{ch.narrative}</p>
          {ch.kpi && (
            <div style={{ borderLeft: `2px solid ${T.gold}`, paddingLeft: 18 }}>
              <div className="dst-display" style={{ fontSize: 40, color: T.gold, fontWeight: 500, lineHeight: 1 }}>
                {typeof ch.kpi.value === "number" ? <CountUp value={ch.kpi.value} active={on} /> : ch.kpi.value}
              </div>
              <div style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: T.lav, marginTop: 8 }}>{ch.kpi.label}</div>
            </div>
          )}
        </div>
        <div className={`dst-fade ${on ? "on" : ""}`} style={{ flex: "1 1 400px", minWidth: 300, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 22, padding: "26px 18px 12px", transitionDelay: ".15s" }}>
          {spec ? <ChapterChart spec={spec} animate={on} /> : <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center", color: T.lav }}>Chart unavailable</div>}
        </div>
      </div>
    </section>
  );
}

function Story({ story, candidates, fileName, onRestart, aiUsed }) {
  const byId = useMemo(() => Object.fromEntries(candidates.map((c) => [c.id, c])), [candidates]);
  const [progress, setProgress] = useState(0);
  const [heroRef, heroOn] = useInView(0.3);
  const [endRef, endOn] = useInView(0.3);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(Math.min(h.scrollTop / (h.scrollHeight - h.clientHeight || 1), 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copySummary = () => {
    const txt = [story.title, story.subtitle, "", ...story.chapters.map((c, i) => `${i + 1}. ${c.headline}\n${c.narrative}`), "", story.closing].join("\n");
    navigator.clipboard?.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); });
  };

  const n = story.chapters.length + 2;
  return (
    <div>
      <div className="dst-spine" aria-hidden="true">
        <div className="dst-spine-fill" style={{ height: `${progress * 100}%` }} />
        {Array.from({ length: n }).map((_, i) => (
          <span key={i} className={`dst-tick ${progress >= i / (n - 1) - 0.02 ? "hit" : ""}`} style={{ top: `${8 + (i / (n - 1)) * 84}%` }} />
        ))}
      </div>

      <section ref={heroRef} style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px" }}>
        <div className={`dst-fade ${heroOn ? "on" : ""}`} style={{ maxWidth: 760 }}>
          <p className="dst-eyebrow" style={{ marginBottom: 20 }}>{fileName} · {aiUsed ? "narrated by AI" : "auto-narrated"}</p>
          <h1 className="dst-display" style={{ fontSize: "clamp(40px, 7vw, 76px)", fontWeight: 400, lineHeight: 1.05, marginBottom: 22 }}>{story.title}</h1>
          <p style={{ color: T.lav, fontSize: 18, marginBottom: 44 }}>{story.subtitle}</p>
          {story.heroKpi && (
            <div>
              <div className="dst-display" style={{ fontSize: "clamp(56px, 9vw, 104px)", color: T.gold, fontWeight: 500, lineHeight: 1 }}>
                <CountUp value={story.heroKpi.value} active={heroOn} />
              </div>
              <div style={{ fontSize: 12, letterSpacing: ".22em", textTransform: "uppercase", color: T.lav, marginTop: 14 }}>{story.heroKpi.label}</div>
            </div>
          )}
          <div style={{ marginTop: 60, color: T.lav, fontSize: 13, letterSpacing: ".12em" }} className="dst-pulse">SCROLL TO BEGIN ↓</div>
        </div>
      </section>

      {story.chapters.map((ch, i) => (
        <Chapter key={i} ch={ch} spec={byId[ch.chartId]} index={i} flip={i % 2 === 1} />
      ))}

      <section ref={endRef} style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 24px" }}>
        <div className={`dst-fade ${endOn ? "on" : ""}`} style={{ maxWidth: 620 }}>
          <p className="dst-eyebrow" style={{ marginBottom: 18 }}>The end — for now</p>
          <p className="dst-display" style={{ fontSize: "clamp(24px, 3.4vw, 36px)", fontWeight: 400, fontStyle: "italic", lineHeight: 1.35, marginBottom: 44 }}>
            “{story.closing}”
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="dst-btn solid" onClick={copySummary}>{copied ? "Copied ✓" : "Copy summary"}</button>
            <button className="dst-btn" onClick={onRestart}>Tell another story</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */
export default function DataStoryteller() {
  const [stage, setStage] = useState("landing");
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [story, setStory] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [aiUsed, setAiUsed] = useState(false);

  const run = useCallback(async (csvText, name) => {
    setError("");
    setFileName(name);
    setStage("analyzing");
    setStep(0);
    try {
      const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });
      const rows = parsed.data.filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== ""));
      if (rows.length < 3) throw new Error("This file has too few rows to tell a story. Try one with at least a handful of records.");
      await new Promise((r) => setTimeout(r, 550));
      setStep(1);
      const cols = profileColumns(rows);
      if (!cols.some((c) => c.type === "number" || c.type === "category")) throw new Error("No numeric or categorical columns found — a story needs at least one of each.");
      await new Promise((r) => setTimeout(r, 550));
      setStep(2);
      const cands = buildCandidates(rows, cols);
      if (!cands.some((c) => c.kind !== "kpi")) throw new Error("Not enough structure in this data to chart. Try a file with categories, dates or numbers.");
      setCandidates(cands);
      await new Promise((r) => setTimeout(r, 450));
      setStep(3);
      let s, usedAi = false;
      try {
        s = await aiStory(cands, name, rows.length);
        usedAi = true;
      } catch {
        s = fallbackStory(cands, name);
      }
      setAiUsed(usedAi);
      setStory(s);
      window.scrollTo({ top: 0, behavior: "auto" });
      setStage("story");
    } catch (e) {
      setError(e.message || "Something went wrong reading that file.");
      setStage("landing");
    }
  }, []);

  const onFile = (file) => {
    if (!/\.csv$/i.test(file.name)) { setError("Only .csv files for now — export your sheet as CSV and try again."); return; }
    const reader = new FileReader();
    reader.onload = () => run(String(reader.result), file.name);
    reader.onerror = () => setError("Could not read that file. Try again?");
    reader.readAsText(file);
  };

  return (
    <div className="dst-root">
      <style>{CSS}</style>
      {stage === "landing" && <Landing onFile={onFile} onSample={() => run(SAMPLE_CSV, "european-sales-2025.csv")} error={error} />}
      {stage === "analyzing" && <Analyzing fileName={fileName} step={step} />}
      {stage === "story" && story && (
        <Story story={story} candidates={candidates} fileName={fileName} aiUsed={aiUsed}
          onRestart={() => { setStory(null); setStage("landing"); window.scrollTo(0, 0); }} />
      )}
    </div>
  );
}
