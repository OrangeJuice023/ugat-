"use client";

import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// UGAT — Organizational Reasoning Platform
// "See what your organization feels before it breaks."
// Light editorial theme (LOKAL-inspired: navy + cream, serif display, italic
// emphasis, numbered sections). Seeded synthetic org + a LIVE grounded agent.
// ============================================================================

const C = {
  bg: "#F6F4EF", bg2: "#EFEDE6",
  panel: "#FFFFFF", panel2: "#F3F1EA", panel3: "#FBFAF7",
  line: "#E4E0D6", line2: "#D6D1C4",
  ink: "#181C2A",
  navy: "#162250", navySoft: "#3A4368",
  sub: "#5B6072", faint: "#8A8E9C", faint2: "#AEB1BC",
  teal: "#0E8C7F", tealDeep: "#0A6B60", tealWash: "#E6F2F0",
  amber: "#B5791F", amberWash: "#F7EFDC",
  red: "#B23A48", redWash: "#F7E7E7",
  green: "#2E7D5B", violet: "#5B4B9E", violetWash: "#ECE9F6",
};
const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`;
const serif = `Georgia, "Iowan Old Style", "Times New Roman", serif`;
const mono = `"SF Mono", ui-monospace, "JetBrains Mono", Menlo, monospace`;
const shadow = "0 2px 10px rgba(20,30,60,.05)";
const shadowUp = "0 12px 44px rgba(20,30,60,.12)";
const VIEWER = "Joshua";

// ============================================================================
// SEEDED SYNTHETIC ORGANIZATION (SEED = 42) — three PLANTED root causes
// ============================================================================
const ORG = { name: "Alab Technologies, Inc.", tag: "Makati City · B2B logistics SaaS · Series A", headcount: 61 };

const DEPTS = {
  exec:  { name: "Executive",        head: "R. Batumbakal", size: 3,  health: 82, deps: ["fin"], risks: [], projects: ["Board deck Q3"], incidents: [] },
  sales: { name: "Sales & Accounts",  head: "M. Santos",     size: 12, health: 74, deps: ["fin"], risks: ["Quota renegotiation pending"], projects: ["Enterprise pilot — Kargo", "Renewal wave"], incidents: [] },
  ops:   { name: "Operations",        head: "J. Dela Cruz",  size: 15, health: 69, deps: ["eng","proc"], risks: ["SLA breaches trending up"], projects: ["Warehouse onboarding", "SLA remediation"], incidents: ["Jun · dispatch outage 4h"] },
  fin:   { name: "Finance",           head: "A. Reyes",      size: 6,  health: 41, deps: [], risks: ["★ Approval bottleneck (root cause)", "Dual-signer backlog"], projects: ["PO policy rollout", "Audit prep"], incidents: ["Jul · approval queue 3.2× SLA"] },
  proc:  { name: "Procurement",       head: "L. Villanueva", size: 5,  health: 52, deps: ["fin"], risks: ["Serialized on Finance sign-off"], projects: ["Vendor consolidation"], incidents: [] },
  eng:   { name: "Engineering",       head: "P. Aquino",     size: 11, health: 58, deps: ["proc","fin"], risks: ["Idle-while-blocked 19%"], projects: ["Route optimizer v2", "Mobile driver app"], incidents: ["Jul · 4 epics stalled upstream"] },
  people:{ name: "People & Admin",    head: "C. Mercado",    size: 4,  health: 78, deps: ["it"], risks: [], projects: ["H2 hiring plan"], incidents: [] },
  it:    { name: "IT",                head: "G. Tan",        size: 5,  health: 55, deps: [], risks: ["★ Single-owner access workflow (root cause)", "Bus-factor = 1"], projects: ["SSO migration"], incidents: ["Jun · provisioning stalled on leave days"] },
};
const DEPT_IDS = Object.keys(DEPTS);

const METRICS = [
  { id: "friction",   label: "Organizational Friction",  val: 72,  delta: +18,  unit: "idx",  tone: "bad",  hint: "Composite of wait-states, rework loops, and blocked handoffs across the graph." },
  { id: "decvel",     label: "Decision Velocity",         val: 41,  delta: -23,  unit: "idx",  tone: "bad",  hint: "Speed from decision-needed to decision-made. Collapsed after the new PO policy." },
  { id: "approx",     label: "Approval Complexity",       val: 3.4, delta: +0.9, unit: "hops", tone: "bad",  hint: "Average approval hops per work item. Rose when a second Finance signer was added." },
  { id: "kflow",      label: "Knowledge Flow",            val: 55,  delta: -6,   unit: "idx",  tone: "warn", hint: "How evenly know-how is distributed vs. siloed. IT provisioning is a near-zero-entropy silo." },
  { id: "momentum",   label: "Execution Momentum",        val: 63,  delta: -4,   unit: "idx",  tone: "warn", hint: "Sustained throughput without stalls." },
  { id: "ctxswitch",  label: "Context-Switching Cost",    val: 38,  delta: +7,   unit: "h/wk", tone: "warn", hint: "Time lost to interruptions and reprioritization." },
  { id: "dephealth",  label: "Dependency Health",         val: 48,  delta: -15,  unit: "idx",  tone: "bad",  hint: "Fragility of cross-team dependencies. One shared upstream node serializes three teams." },
  { id: "resilience", label: "Organizational Resilience", val: 61,  delta: -3,   unit: "idx",  tone: "warn", hint: "Ability to absorb shocks and key-person risk." },
];

const CYCLE_SERIES = [13.8,14.0,14.1,13.9,14.2,14.1,15.0,15.6,16.1,16.4,16.2,16.7,17.0,16.8,17.1,17.3,17.0,17.2,17.4,17.1,17.3,17.5,17.2,17.4,17.3,17.6,17.2,17.4,17.3,17.2];
const POLICY_DAY = 6;

const INSIGHTS = [
  {
    id: "ins-approvals", severity: "critical", metricRef: "Cycle Time +22%", question: "Why are projects slowing down?",
    headline: {
      analyst: "Median cycle time rose 22% (14.1d→17.2d); variance concentrated in the approval wait-state, not active work.",
      manager: "Projects are spending more time waiting for sign-off — not more time being worked on.",
      exec: "Delivery is slowing because decisions take longer, not because the team is working slower.",
    },
    observe: "Cycle time for delivery projects rose from a 14.1-day to a 17.2-day median over the last 30 days (n=46 closed items). Active-work time held roughly flat (+3%). The entire increase sits in time-in-approval — and it begins on a specific day.",
    hasChart: true,
    hypotheses: [
      { id: "A", text: "Team velocity dropped — people working slower or capacity lost.", support: 12, verdict: "weak", why: "Active-work hours per item are flat (+3%). No PTO, attrition, or utilization spike in the window." },
      { id: "B", text: "A new policy added a second Finance signer for POs over ₱50k.", support: 84, verdict: "strong", why: "Policy shipped on day 6. 71% of delayed items cross the ₱50k threshold. Finance approval queue time tripled (0.8d→2.6d) starting exactly that day." },
      { id: "C", text: "Project scope / complexity increased.", support: 28, verdict: "moderate", why: "Task counts per project up ~9% — real, but far too small to explain a 22% cycle jump alone." },
      { id: "D", text: "Seasonal customer surge overloaded intake.", support: 9, verdict: "weak", why: "Intake volume sits within the normal seasonal band; no correlated backlog at the intake stage." },
    ],
    evidence: [
      { label: "Finance approval queue time", before: "0.8d", after: "2.6d", dir: "up" },
      { label: "Delayed items above ₱50k threshold", before: "—", after: "71%", dir: "up" },
      { label: "Active-work time per item", before: "9.2d", after: "9.5d", dir: "flat" },
      { label: "Policy date vs. slowdown onset", before: "—", after: "same day", dir: "match" },
    ],
    confidence: { level: "Strong", label: "Strong evidence for Hypothesis B", note: "Timing, threshold concentration, and queue-time signal all align. UGAT does not report a fabricated percentage here — the causal claim rests on a natural experiment: the policy shipped mid-window, splitting the data into a clean before/after." },
    impact: {
      analyst: "≈3.1 delay-days/project × 46 projects/mo ≈ 143 project-days/month lost to approval queueing.",
      manager: "About two extra days of waiting on every delivery, driven almost entirely by one approval step.",
      exec: "Roughly six delivery-weeks per month are being spent waiting, not working.",
    },
    recommendation: {
      analyst: "Raise the dual-sign threshold to ₱150k or pre-authorize recurring vendors; add an SLA timer with auto-escalation on the Finance approval node.",
      manager: "Let smaller POs clear with one signer and put a 24-hour clock on Finance approvals.",
      exec: "Simplify sign-off on routine spend so decisions stop bottlenecking delivery.",
    },
    outcome: "Est. recovery of ~2.1 of the 3.1 added delay-days → cycle time back toward 15.1d within 3–4 weeks. Reversible, low-risk.",
    nodes: ["fin", "proc", "eng"],
  },
  {
    id: "ins-dependency", severity: "warn", metricRef: "Dependency Health −15", question: "Where is work getting stuck?",
    headline: {
      analyst: "Serial dependency chain Engineering→Procurement→Finance is producing cascading blocked-time; 4 of 7 stalled epics trace to one shared upstream node.",
      manager: "Engineering keeps getting stuck waiting on Procurement — which is itself waiting on Finance.",
      exec: "One slow step upstream is quietly stalling several teams downstream.",
    },
    observe: "Dependency Health fell 15 points. Blocked-time analysis shows Engineering's stalls are not internal: 4 of 7 stalled epics share a single upstream chain terminating at the same Finance approval node from the first insight.",
    hypotheses: [
      { id: "A", text: "Engineering is under-staffed for current load.", support: 22, verdict: "weak", why: "Engineering utilization is 78% — busy but not saturated. Idle-while-blocked time is the larger signal." },
      { id: "B", text: "A shared upstream node (Finance approvals) is serializing three teams.", support: 79, verdict: "strong", why: "The same node appears in every long dependency path. Removing it in simulation cuts chain length by 41%." },
      { id: "C", text: "Poor task sequencing inside Engineering.", support: 31, verdict: "moderate", why: "Some parallelizable work runs serially — real, but secondary to the upstream block." },
    ],
    evidence: [
      { label: "Stalled epics tracing to shared node", before: "—", after: "4 of 7", dir: "up" },
      { label: "Average dependency chain length", before: "2.1", after: "3.4", dir: "up" },
      { label: "Engineering idle-while-blocked", before: "6%", after: "19%", dir: "up" },
    ],
    confidence: { level: "Strong", label: "Strong evidence for Hypothesis B", note: "The same upstream node recurs across independent dependency paths — a structural signature of serialization, not coincidence." },
    impact: {
      analyst: "Chain length 2.1→3.4 propagates ~1.3 extra handoff-days per dependent epic.",
      manager: "Every dependent project inherits the upstream delay on top of its own.",
      exec: "The delay isn't one team's — it multiplies as it flows downstream.",
    },
    recommendation: {
      analyst: "Decouple: grant per-project pre-approved procurement envelopes so Engineering never blocks on per-item Finance sign-off; insert a buffer node.",
      manager: "Give each project a pre-approved spend envelope so teams stop waiting item by item.",
      exec: "Fixing the one upstream approval step also unblocks these teams — it's the same root cause.",
    },
    outcome: "Shares a root cause with the cycle-time insight. One intervention resolves both — high leverage.",
    nodes: ["eng", "proc", "fin"],
  },
  {
    id: "ins-silo", severity: "warn", metricRef: "Key-Person Risk", question: "What hidden risk is building?",
    headline: {
      analyst: "IT access-provisioning is a single-owner silo: 94% of access tickets closed by one individual; knowledge-flow entropy for this workflow is near zero.",
      manager: "Almost all IT access requests depend on one person — when they're out, everything waits.",
      exec: "One critical workflow depends entirely on a single employee. That's a hidden operational risk.",
    },
    observe: "Knowledge Flow dipped 6 points, but the workflow-level view is starker: IT access provisioning shows 94% single-owner concentration. On the two days that owner was on leave, ticket resolution time rose 5×.",
    hypotheses: [
      { id: "A", text: "Ticket volume simply spiked on those days.", support: 14, verdict: "weak", why: "Volume was normal; the delta is resolution time, not arrival rate." },
      { id: "B", text: "The workflow is a single-owner silo (key-person dependency).", support: 88, verdict: "strong", why: "94% closure concentration; 5× resolution time exactly on the owner's leave days; zero secondary closers in 90 days." },
      { id: "C", text: "A tooling outage slowed provisioning.", support: 11, verdict: "weak", why: "No IT incident logged in the window; other IT workflows were unaffected." },
    ],
    evidence: [
      { label: "Access tickets closed by one person", before: "—", after: "94%", dir: "up" },
      { label: "Resolution time on owner's leave days", before: "1×", after: "5×", dir: "up" },
      { label: "Secondary closers in last 90 days", before: "—", after: "0", dir: "flat" },
    ],
    confidence: { level: "Strong", label: "Strong evidence for Hypothesis B", note: "Concentration + leave-day spike + zero backup is a textbook key-person-risk signature." },
    impact: {
      analyst: "Bus-factor = 1 on a workflow touched by every new hire and role change.",
      manager: "Any absence of one person stalls onboarding and access changes company-wide.",
      exec: "A single point of failure sits on a workflow the whole company depends on.",
    },
    recommendation: {
      analyst: "Cross-train a secondary owner; codify the provisioning runbook; add round-robin assignment with the primary as reviewer.",
      manager: "Train a backup and document the steps so it isn't all in one person's head.",
      exec: "Remove the single point of failure by cross-training a second person.",
    },
    outcome: "Bus-factor 1→2 within one sprint. Low cost, removes a company-wide risk.",
    nodes: ["it"],
  },
];

// AGENT_CONTEXT now lives server-side in app/api/ask/route.js (keeps prompt + any keys off the client).

// ============================================================================
// graph layout
// ============================================================================
const POS = { exec:{x:50,y:14}, sales:{x:21,y:32}, ops:{x:79,y:32}, fin:{x:50,y:48}, proc:{x:31,y:64}, eng:{x:69,y:64}, people:{x:17,y:84}, it:{x:83,y:84} };
const EDGES = [["exec","sales"],["exec","ops"],["exec","fin"],["exec","people"],["sales","fin"],["ops","eng"],["ops","proc"],["fin","proc"],["fin","eng"],["proc","eng"],["people","it"],["it","eng"]];

// ============================================================================
// primitives
// ============================================================================
function Eyebrow({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: C.teal, fontFamily: font, ...style }}>{children}</div>;
}
function Pill({ children, tone = "neutral", style }) {
  const m = {
    neutral: [C.panel2, C.sub, C.line2], teal: [C.tealWash, C.tealDeep, "#bfe3dd"],
    amber: [C.amberWash, C.amber, "#e7d3a8"], red: [C.redWash, C.red, "#e8c2c6"],
    violet: [C.violetWash, C.violet, "#d3cae9"], navy: ["#E7EAF3", C.navy, "#c9d0e2"],
  }[tone] || [C.panel2, C.sub, C.line2];
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, padding: "3px 9px", borderRadius: 999, background: m[0], color: m[1], border: `1px solid ${m[2]}`, whiteSpace: "nowrap", ...style }}>{children}</span>;
}
function Spark({ delta }) {
  const up = delta > 0;
  return <span style={{ color: up ? C.red : C.green, fontSize: 12, fontWeight: 800, fontFamily: mono }}>{up ? "▲" : "▼"} {Math.abs(delta)}</span>;
}
function useCountUp(target, ms = 900, go = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!go) return; let raf, start;
    const step = (t) => { if (!start) start = t; const p = Math.min((t - start) / ms, 1); setV(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target, ms, go]);
  return v;
}
const ghostBtn = { cursor: "pointer", background: C.panel, border: `1px solid ${C.line2}`, color: C.sub, borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 600, fontFamily: font };
const pBody = { fontSize: 13.5, lineHeight: 1.65, color: C.sub, margin: 0 };

function Ring({ value, size = 40 }) {
  const r = size / 2 - 4, circ = 2 * Math.PI * r;
  const col = value >= 70 ? C.green : value >= 50 ? C.amber : C.red;
  const v = useCountUp(value, 800);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.line} strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ - (circ * v) / 100} style={{ transition: "stroke-dashoffset .3s" }} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill={col} fontSize="11" fontWeight="800" fontFamily={mono} transform={`rotate(90 ${size/2} ${size/2})`}>{Math.round(v)}</text>
    </svg>
  );
}

// ============================================================================
// Translation Layer
// ============================================================================
const LEVELS = [{ id: "analyst", label: "Analyst", sub: "TECHNICAL" }, { id: "manager", label: "Manager", sub: "OPERATIONAL" }, { id: "exec", label: "Executive", sub: "PLAIN ENGLISH" }];
function LevelToggle({ value, onChange, size = "md" }) {
  return (
    <div style={{ display: "inline-flex", background: C.panel2, border: `1px solid ${C.line2}`, borderRadius: 11, padding: 3, gap: 2 }}>
      {LEVELS.map((l) => {
        const active = value === l.id;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{ cursor: "pointer", border: "none", borderRadius: 8, padding: size === "sm" ? "5px 11px" : "7px 15px", background: active ? C.navy : "transparent", color: active ? "#fff" : C.sub, fontWeight: 700, fontSize: size === "sm" ? 11.5 : 12.5, fontFamily: font, transition: "all .18s", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
            <span>{l.label}</span>
            <span style={{ fontSize: 8, opacity: active ? 0.72 : 0.55, fontWeight: 700, letterSpacing: 0.5 }}>{l.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
function Morph({ k, children }) { return <span key={k} style={{ display: "inline-block", animation: "fadeUp .32s ease" }}>{children}</span>; }

// ============================================================================
// cycle-time chart
// ============================================================================
function CycleChart() {
  const [t, setT] = useState(0);
  useEffect(() => { let raf, s; const go = (x) => { if (!s) s = x; const p = Math.min((x - s) / 1200, 1); setT(p); if (p < 1) raf = requestAnimationFrame(go); }; raf = requestAnimationFrame(go); return () => cancelAnimationFrame(raf); }, []);
  const W = 560, H = 150, pad = 8, min = 13, max = 18.5, n = CYCLE_SERIES.length;
  const shown = Math.max(2, Math.round(t * n));
  const px = (i) => pad + (i / (n - 1)) * (W - pad * 2);
  const py = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2 - 16);
  const pts = CYCLE_SERIES.slice(0, shown).map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const area = `${pad},${H - pad} ` + pts + ` ${px(shown - 1)},${H - pad}`;
  return (
    <div style={{ background: C.panel3, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 14px 8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>Median cycle time · last 30 days</span>
        <span style={{ fontSize: 11, color: C.faint, fontFamily: mono }}>days</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs><linearGradient id="ct" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.teal} stopOpacity="0.22" /><stop offset="100%" stopColor={C.teal} stopOpacity="0" /></linearGradient></defs>
        {t > 0.3 && (<g style={{ animation: "fadeUp .5s ease" }}><line x1={px(POLICY_DAY)} y1={pad} x2={px(POLICY_DAY)} y2={H - pad} stroke={C.amber} strokeWidth="1" strokeDasharray="3 3" opacity="0.8" /><text x={px(POLICY_DAY) + 5} y={pad + 12} fill={C.amber} fontSize="10" fontWeight="700" fontFamily={mono}>PO policy shipped</text></g>)}
        <polygon points={area} fill="url(#ct)" />
        <polyline points={pts} fill="none" stroke={C.teal} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {shown > 0 && <circle cx={px(shown - 1)} cy={py(CYCLE_SERIES[shown - 1])} r="3.5" fill={C.teal} />}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}><span style={{ fontSize: 10, color: C.faint, fontFamily: mono }}>14.1d before</span><span style={{ fontSize: 10, color: C.red, fontFamily: mono, fontWeight: 700 }}>17.2d after · +22%</span></div>
    </div>
  );
}

// ============================================================================
// reasoning loop
// ============================================================================
const LOOP = ["Observe", "Hypotheses", "Evidence", "Confidence", "Recommend", "Outcome"];
const THOUGHTS = ["Reading the organizational graph…", "Isolating the anomaly window…", "Generating competing hypotheses…", "Weighing evidence against each…", "Estimating confidence…"];
function ConfBar({ support, verdict }) {
  const w = useCountUp(support, 700);
  const col = verdict === "strong" ? C.teal : verdict === "moderate" ? C.amber : C.faint;
  return <div style={{ flex: 1, height: 6, background: C.panel2, borderRadius: 999, overflow: "hidden", border: `1px solid ${C.line}` }}><div style={{ width: `${w}%`, height: "100%", background: col, borderRadius: 999 }} /></div>;
}
function Section({ title, subtitle, tone = "neutral", children }) {
  const a = tone === "teal" ? C.teal : tone === "violet" ? C.violet : C.line2;
  return (<div style={{ borderLeft: `2px solid ${a}`, paddingLeft: 16 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: subtitle ? 3 : 12 }}>{title}</div>{subtitle && <div style={{ fontSize: 12, color: C.faint, marginBottom: 14, lineHeight: 1.5 }}>{subtitle}</div>}{children}</div>);
}
function HypothesisRow({ h }) {
  return (
    <div style={{ background: C.panel3, border: `1px solid ${h.verdict === "strong" ? "#bfe3dd" : C.line}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {h.id && <span style={{ fontFamily: mono, fontWeight: 800, color: h.verdict === "strong" ? C.tealDeep : C.sub, fontSize: 13 }}>{h.id}</span>}
        <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 500, flex: 1 }}>{h.text}</span>
        <Pill tone={h.verdict === "strong" ? "teal" : h.verdict === "moderate" ? "amber" : "neutral"}>{h.verdict}</Pill>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <ConfBar support={h.support} verdict={h.verdict} />
        {h.support != null && <span style={{ fontFamily: mono, fontSize: 11.5, color: C.sub, width: 34, textAlign: "right" }}>{h.support}%</span>}
      </div>
      <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.55 }}>{h.why}</p>
    </div>
  );
}

function ReasoningLoop({ insight, level }) {
  const [thinking, setThinking] = useState(true);
  const [thought, setThought] = useState(0);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => { if (!thinking) return; const iv = setInterval(() => setThought((t) => t + 1), 480); const done = setTimeout(() => { setThinking(false); setAuto(true); }, THOUGHTS.length * 480 + 200); return () => { clearInterval(iv); clearTimeout(done); }; }, [thinking]);
  useEffect(() => { if (!auto) return; const iv = setInterval(() => setStep((s) => { if (s >= LOOP.length - 1) { setAuto(false); return s; } return s + 1; }), 1500); return () => clearInterval(iv); }, [auto]);

  if (thinking) {
    return (
      <div style={{ marginTop: 18, padding: "20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: C.teal, animation: `pulse 1s ${i*0.15}s infinite ease-in-out` }} />)}</div>
          <span style={{ fontSize: 13, color: C.tealDeep, fontWeight: 600 }}>UGAT is reasoning…</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{THOUGHTS.slice(0, thought + 1).map((th, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: i === thought ? C.ink : C.faint, animation: "fadeUp .3s ease" }}><span style={{ color: C.teal, fontFamily: mono, fontSize: 11 }}>{i < thought ? "✓" : "▸"}</span>{th}</div>))}</div>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        {LOOP.map((s, i) => {
          const done = i < step, active = i === step;
          return (
            <React.Fragment key={s}>
              <button onClick={() => { setAuto(false); setStep(i); }} style={{ cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", gap: 7, padding: "4px 2px" }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, fontSize: 11, fontWeight: 800, fontFamily: mono, display: "grid", placeItems: "center", background: active ? C.navy : done ? C.tealWash : C.panel2, color: active ? "#fff" : done ? C.tealDeep : C.faint, border: `1px solid ${active ? C.navy : done ? "#bfe3dd" : C.line2}`, transition: "all .3s" }}>{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? C.ink : done ? C.sub : C.faint, transition: "color .3s" }}>{s}</span>
              </button>
              {i < LOOP.length - 1 && <div style={{ width: 20, height: 1.5, margin: "0 6px", background: i < step ? C.teal : C.line2, transition: "background .3s" }} />}
            </React.Fragment>
          );
        })}
        <div style={{ flex: 1 }} />
        {!auto && step < LOOP.length - 1 && <button onClick={() => setAuto(true)} style={ghostBtn}>▶ Auto-play</button>}
      </div>
      <div key={step} style={{ animation: "fadeUp .35s ease" }}>
        {step === 0 && (<Section title="Observe"><p style={{ ...pBody, marginBottom: insight.hasChart ? 14 : 0 }}>{insight.observe}</p>{insight.hasChart && <CycleChart />}</Section>)}
        {step === 1 && (<Section title="Competing hypotheses" subtitle="UGAT never jumps to a conclusion. It weighs alternatives before committing."><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{insight.hypotheses.map((h) => <HypothesisRow key={h.id} h={h} />)}</div></Section>)}
        {step === 2 && (<Section title="Evidence collected"><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{insight.evidence.map((e, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: C.panel3, border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 14px", animation: `fadeUp .3s ${i*0.06}s both` }}><span style={{ fontSize: 13, color: C.ink, flex: 1, fontWeight: 500 }}>{e.label}</span>{e.before !== "—" && <span style={{ fontFamily: mono, fontSize: 12.5, color: C.faint }}>{e.before}</span>}<span style={{ color: C.faint }}>→</span><span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: e.dir === "up" ? C.red : e.dir === "match" ? C.amber : C.teal }}>{e.after}</span></div>))}</div></Section>)}
        {step === 3 && (<Section title="Confidence" tone="teal"><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><Pill tone="teal">{insight.confidence.level.toUpperCase()}</Pill><span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{insight.confidence.label}</span></div><p style={{ ...pBody, fontSize: 12.5 }}>{insight.confidence.note}</p></Section>)}
        {step === 4 && (<Section title="Recommendation" tone="teal" subtitle={`Impact & fix, voiced at ${LEVELS.find(l=>l.id===level).label} level`}><div style={{ background: C.tealWash, border: `1px solid #bfe3dd`, borderRadius: 12, padding: 14, marginBottom: 12 }}><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: C.amber, marginBottom: 6 }}>BUSINESS IMPACT</div><p style={{ ...pBody, margin: 0, color: C.ink }}><Morph k={level}>{insight.impact[level]}</Morph></p></div><div style={{ background: C.tealWash, border: `1px solid #bfe3dd`, borderRadius: 12, padding: 14 }}><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: C.tealDeep, marginBottom: 6 }}>RECOMMENDED INTERVENTION</div><p style={{ ...pBody, margin: 0, color: C.ink }}><Morph k={level}>{insight.recommendation[level]}</Morph></p></div></Section>)}
        {step === 5 && (<Section title="Estimated outcome" tone="violet" subtitle="What we'd expect if the intervention ships — and how we'll measure it."><p style={pBody}>{insight.outcome}</p><div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", color: C.faint, fontSize: 12 }}><span style={{ fontFamily: mono }}>Observe → … → Learn</span><span>·</span><span>the loop closes: outcomes feed back as new observations.</span></div></Section>)}
      </div>
    </div>
  );
}

function InsightCard({ insight, level, expanded, onToggle, onHover }) {
  const tone = insight.severity === "critical" ? "red" : "amber";
  return (
    <div onMouseEnter={() => onHover(insight.nodes)} onMouseLeave={() => onHover([])} style={{ background: C.panel, border: `1px solid ${expanded ? C.line2 : C.line}`, borderRadius: 16, overflow: "hidden", transition: "border-color .2s, box-shadow .2s", boxShadow: expanded ? shadowUp : shadow }}>
      <button onClick={onToggle} style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none", padding: 20, display: "block" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
          <Pill tone={tone}>{insight.severity === "critical" ? "● CRITICAL" : "● WATCH"}</Pill>
          <Pill tone="neutral" style={{ fontFamily: mono }}>{insight.metricRef}</Pill>
          <span style={{ fontSize: 12, color: C.faint, fontStyle: "italic", fontFamily: serif }}>{insight.question}</span>
          <div style={{ flex: 1 }} />
          <span style={{ color: C.faint, fontSize: 20, transform: expanded ? "rotate(45deg)" : "none", transition: "transform .25s", lineHeight: 1 }}>＋</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: C.navy, lineHeight: 1.45, letterSpacing: -0.2, fontFamily: serif }}><Morph k={level}>{insight.headline[level]}</Morph></div>
      </button>
      {expanded && (<div style={{ padding: "0 20px 22px" }}><div style={{ height: 1, background: C.line, marginBottom: 4 }} /><ReasoningLoop insight={insight} level={level} /></div>)}
    </div>
  );
}

// ============================================================================
// org graph
// ============================================================================
function flowPaths(active) { const segs = []; EDGES.forEach(([a, b]) => { if (active.has(a) && active.has(b)) { const pa = POS[a], pb = POS[b]; segs.push(`M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`); } }); return segs; }
function OrgGraph({ highlight, hoverDept, setHoverDept, onPick, picked }) {
  const active = new Set(highlight);
  const hd = hoverDept ? DEPTS[hoverDept] : null;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 0.82", background: `radial-gradient(120% 120% at 50% 0%, ${C.panel} 0%, ${C.bg2} 100%)`, border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden", boxShadow: shadow }}>
      <svg viewBox="0 0 100 82" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {EDGES.map(([a, b], i) => { const pa = POS[a], pb = POS[b], hot = active.has(a) && active.has(b); return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={hot ? C.teal : C.line2} strokeWidth={hot ? 0.7 : 0.35} opacity={hot ? 0.95 : 0.6} style={{ transition: "all .3s" }} />; })}
        {flowPaths(active).map((seg, i) => (<circle key={`f${i}`} r="0.9" fill={C.teal}><animateMotion dur="1.6s" repeatCount="indefinite" path={seg} /></circle>))}
      </svg>
      {DEPT_IDS.map((id) => {
        const d = DEPTS[id], p = POS[id], hot = active.has(id), sel = picked === id;
        const dotCol = d.health < 50 ? C.red : d.health < 70 ? C.amber : C.teal;
        return (
          <button key={id} onClick={() => onPick(sel ? null : id)} onMouseEnter={() => setHoverDept(id)} onMouseLeave={() => setHoverDept(null)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", cursor: "pointer", border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, zIndex: hoverDept === id ? 6 : 2 }}>
            <div style={{ width: hot ? 16 : 13, height: hot ? 16 : 13, borderRadius: 999, background: hot ? C.teal : sel ? C.violet : C.panel, border: `1.5px solid ${hot ? C.teal : sel ? C.violet : dotCol}`, boxShadow: hot ? `0 0 0 4px ${C.tealWash}` : d.health < 50 ? `0 0 0 3px ${C.redWash}` : shadow, transition: "all .3s" }} />
            <span style={{ fontSize: 10, fontWeight: hot ? 700 : 500, color: hot ? C.tealDeep : sel ? C.violet : C.sub, whiteSpace: "nowrap", transition: "color .3s" }}>{d.name}</span>
          </button>
        );
      })}
      {hd && (
        <div style={{ position: "absolute", left: `${Math.min(POS[hoverDept].x, 60)}%`, top: `${Math.min(POS[hoverDept].y + 6, 58)}%`, width: 236, background: C.panel, border: `1px solid ${C.line2}`, borderRadius: 12, padding: 14, zIndex: 10, boxShadow: shadowUp, animation: "fadeUp .18s ease", pointerEvents: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><Ring value={hd.health} /><div><div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{hd.name}</div><div style={{ fontSize: 11, color: C.faint }}>{hd.head} · {hd.size} people</div></div></div>
          <Row label="Dependencies" val={hd.deps.length ? hd.deps.map(x => DEPTS[x].name).join(", ") : "None"} />
          <Row label="Connected projects" val={hd.projects.join(" · ")} />
          <Row label="Hidden risks" val={hd.risks.length ? hd.risks.join(" · ") : "None detected"} tone={hd.risks.length ? "amber" : "sub"} />
          <Row label="Past incidents" val={hd.incidents.length ? hd.incidents.join(" · ") : "None"} tone={hd.incidents.length ? "red" : "sub"} last />
        </div>
      )}
      <div style={{ position: "absolute", top: 12, left: 14, fontSize: 11, color: C.faint, fontFamily: mono }}>organizational graph · {ORG.headcount} people · 8 departments</div>
      <div style={{ position: "absolute", bottom: 12, right: 14, fontSize: 10.5, color: C.faint2, fontFamily: mono }}>hover a node · click to inspect</div>
    </div>
  );
}
function Row({ label, val, tone = "sub", last }) {
  const col = tone === "amber" ? C.amber : tone === "red" ? C.red : C.sub;
  return (<div style={{ paddingBottom: last ? 0 : 8, marginBottom: last ? 0 : 8, borderBottom: last ? "none" : `1px solid ${C.line}` }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, color: C.faint2, marginBottom: 3 }}>{label.toUpperCase()}</div><div style={{ fontSize: 11.5, color: col, lineHeight: 1.4 }}>{val}</div></div>);
}

function MetricTile({ m, onClick, active }) {
  const v = useCountUp(m.val, 1000);
  const col = m.tone === "bad" ? C.red : m.tone === "warn" ? C.amber : C.teal;
  return (
    <button onClick={onClick} style={{ textAlign: "left", cursor: "pointer", background: active ? C.panel2 : C.panel, border: `1px solid ${active ? C.line2 : C.line}`, borderRadius: 14, padding: 16, transition: "all .2s", position: "relative", overflow: "hidden", boxShadow: shadow }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: col }} />
      <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600, marginBottom: 10 }}>{m.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 26, fontWeight: 700, color: C.navy, fontFamily: mono, letterSpacing: -1 }}>{m.unit === "hops" ? v.toFixed(1) : Math.round(v)}</span><span style={{ fontSize: 11, color: C.faint }}>{m.unit}</span><div style={{ flex: 1 }} /><Spark delta={m.delta} /></div>
    </button>
  );
}

// ============================================================================
// LIVE AGENT — "Ask UGAT" (calls Claude, grounded in the org graph)
// ============================================================================
const STARTERS = [
  "What should we fix first, and why?",
  "What if we raise the approval threshold to ₱150k?",
  "Which department carries the most hidden risk?",
  "Is Engineering the problem, or something upstream?",
];
function AskUgat({ level, setLevel }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [thought, setThought] = useState(0);
  const [ans, setAns] = useState(null);
  const [raw, setRaw] = useState(null);
  const [err, setErr] = useState(null);
  const [asked, setAsked] = useState(null);

  useEffect(() => { if (!loading) return; setThought(0); const iv = setInterval(() => setThought((t) => (t + 1) % THOUGHTS.length), 620); return () => clearInterval(iv); }, [loading]);

  async function ask(question) {
    if (!question.trim()) return;
    setLoading(true); setErr(null); setAns(null); setRaw(null); setAsked(question);
    try {
      const res = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.parsed && data.parsed.observation) setAns(data.parsed);
      else setRaw(data.raw || "No response received.");
    } catch (e) {
      setErr("The live reasoning call didn't go through. The scripted briefing still works — try again in a moment.");
    }
    setLoading(false);
  }

  const hyps = ans?.hypotheses?.map((h, i) => ({ id: String.fromCharCode(65 + i), text: h.label, verdict: (h.strength || "moderate").toLowerCase(), why: h.why, support: h.strength === "strong" ? 84 : h.strength === "weak" ? 16 : 44 })) || [];

  return (
    <div style={{ padding: "36px 0" }}>
      <Eyebrow>Ask UGAT · live reasoning</Eyebrow>
      <h2 style={{ fontSize: 27, fontWeight: 500, letterSpacing: -0.5, margin: "8px 0 8px", fontFamily: serif, color: C.navy }}>Ask a question. Watch it <span style={{ fontStyle: "italic", color: C.teal }}>reason</span>.</h2>
      <p style={{ fontSize: 14, color: C.sub, maxWidth: 640, lineHeight: 1.6, margin: "0 0 20px" }}>
        This box calls a live model, grounded in Alab's organizational graph, and constrained to UGAT's method — competing hypotheses, honest confidence, systems over individuals. The answer renders in the same reasoning shape as the scripted briefing, and respects the Translation Layer.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(q)} placeholder="e.g. What should we fix first, and why?"
          style={{ flex: 1, background: C.panel, border: `1px solid ${C.line2}`, borderRadius: 11, padding: "12px 14px", fontSize: 14, color: C.ink, fontFamily: font, outline: "none", boxShadow: shadow }} />
        <button onClick={() => ask(q)} disabled={loading} style={{ cursor: loading ? "default" : "pointer", background: C.navy, color: "#fff", border: "none", borderRadius: 11, padding: "0 20px", fontSize: 14, fontWeight: 700, fontFamily: font, opacity: loading ? 0.6 : 1 }}>{loading ? "Reasoning…" : "Ask →"}</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {STARTERS.map((s) => (<button key={s} onClick={() => { setQ(s); ask(s); }} style={{ cursor: "pointer", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 999, padding: "6px 13px", fontSize: 12, color: C.sub, fontFamily: font }}>{s}</button>))}
      </div>

      {loading && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, boxShadow: shadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: 999, background: C.teal, animation: `pulse 1s ${i*0.15}s infinite ease-in-out` }} />)}</div><span style={{ fontSize: 13, color: C.tealDeep, fontWeight: 600 }}>{THOUGHTS[thought]}</span></div>
        </div>
      )}

      {err && !loading && (<div style={{ background: C.redWash, border: `1px solid #e8c2c6`, borderRadius: 14, padding: 16, fontSize: 13, color: C.red }}>{err}</div>)}

      {raw && !loading && (<div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 22, boxShadow: shadow }}><div style={{ fontSize: 12, color: C.faint, marginBottom: 8, fontStyle: "italic" }}>Grounded response:</div><p style={{ ...pBody, whiteSpace: "pre-wrap", color: C.ink }}>{raw}</p></div>)}

      {ans && !loading && (
        <div style={{ background: C.panel, border: `1px solid ${C.line2}`, borderRadius: 16, padding: 22, boxShadow: shadowUp, animation: "fadeUp .4s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <Pill tone="navy">LIVE · grounded in Alab's graph</Pill>
            <span style={{ fontSize: 12, color: C.faint, fontStyle: "italic", fontFamily: serif }}>{asked}</span>
            <div style={{ flex: 1 }} />
            <LevelToggle value={level} onChange={setLevel} size="sm" />
          </div>
          <div style={{ height: 1, background: C.line, margin: "14px 0" }} />
          <Section title="Observe"><p style={pBody}>{ans.observation}</p></Section>
          {hyps.length > 0 && (<div style={{ marginTop: 18 }}><Section title="Competing hypotheses"><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{hyps.map((h) => <HypothesisRow key={h.id} h={h} />)}</div></Section></div>)}
          {ans.confidence && (<div style={{ marginTop: 18 }}><Section title="Confidence" tone="teal"><Pill tone="teal">{ans.confidence}</Pill></Section></div>)}
          <div style={{ marginTop: 18 }}><Section title="Recommendation" tone="teal" subtitle={`Voiced at ${LEVELS.find(l=>l.id===level).label} level`}>
            {ans.impact && (<div style={{ background: C.tealWash, border: `1px solid #bfe3dd`, borderRadius: 12, padding: 14, marginBottom: 12 }}><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: C.amber, marginBottom: 6 }}>BUSINESS IMPACT</div><p style={{ ...pBody, margin: 0, color: C.ink }}>{ans.impact}</p></div>)}
            <div style={{ background: C.tealWash, border: `1px solid #bfe3dd`, borderRadius: 12, padding: 14 }}><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.6, color: C.tealDeep, marginBottom: 6 }}>RECOMMENDED INTERVENTION</div><p style={{ ...pBody, margin: 0, color: C.ink }}>{ans.translation?.[level] || ans.recommendation}</p></div>
          </Section></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// boot
// ============================================================================
function Boot({ onDone }) {
  const lines = ["Connecting to organizational graph…", "Ingesting 30 days of work events…", "Detecting anomalies…", "Composing your briefing…"];
  const [i, setI] = useState(0);
  useEffect(() => { const iv = setInterval(() => setI((x) => x + 1), 440); const done = setTimeout(onDone, lines.length * 440 + 350); return () => { clearInterval(iv); clearTimeout(done); }; }, []);
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", fontFamily: font }}>
      <div style={{ width: 340 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}><div style={{ width: 30, height: 30, borderRadius: 9, background: C.navy, display: "grid", placeItems: "center", fontWeight: 800, color: "#fff" }}>U</div><span style={{ fontWeight: 700, fontSize: 18, color: C.navy, letterSpacing: -0.3, fontFamily: serif }}>UGAT</span></div>
        {lines.slice(0, i + 1).map((l, k) => (<div key={k} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: k === i ? C.ink : C.faint, marginBottom: 9, animation: "fadeUp .3s ease" }}><span style={{ color: C.teal, fontFamily: mono, fontSize: 11 }}>{k < i ? "✓" : "▸"}</span>{l}</div>))}
      </div>
    </div>
  );
}

// ============================================================================
// APP
// ============================================================================
const TABS = [
  { id: "briefing", label: "Executive Briefing" },
  { id: "graph", label: "Organizational Graph" },
  { id: "health", label: "Organizational Health" },
  { id: "ask", label: "Ask UGAT" },
  { id: "about", label: "Why UGAT" },
];

export default function UGAT() {
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState("briefing");
  const [level, setLevel] = useState("exec");
  const [expanded, setExpanded] = useState("ins-approvals");
  const [hoverNodes, setHoverNodes] = useState([]);
  const [hoverDept, setHoverDept] = useState(null);
  const [picked, setPicked] = useState(null);
  const [metricSel, setMetricSel] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const pickedDept = picked ? DEPTS[picked] : null;
  const deptInsights = picked ? INSIGHTS.filter((i) => i.nodes.includes(picked)) : [];

  if (!booted) return (<><style>{keyframes}</style><Boot onDone={() => setBooted(true)} /></>);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: font, WebkitFontSmoothing: "antialiased" }}>
      <style>{keyframes}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(246,244,239,.86)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 60, gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: C.navy, display: "grid", placeItems: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>U</div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3, fontFamily: serif, color: C.navy }}>UGAT</span>
            <span style={{ fontSize: 11.5, color: C.faint, marginLeft: 2, marginTop: 2 }}>Organizational Reasoning</span>
          </div>
          <div style={{ flex: 1 }} />
          <nav style={{ display: "flex", gap: 4 }}>
            {TABS.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} style={{ cursor: "pointer", border: "none", background: tab === t.id ? C.panel : "transparent", color: tab === t.id ? C.navy : C.sub, fontWeight: 600, fontSize: 13, padding: "7px 12px", borderRadius: 9, fontFamily: font, transition: "all .15s", boxShadow: tab === t.id ? shadow : "none" }}>{t.label}</button>))}
          </nav>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 80px" }}>
        {tab === "briefing" && (
          <div style={{ animation: "fadeUp .4s ease" }}>
            <div style={{ padding: "42px 0 26px" }}>
              <Eyebrow>The Briefing · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {ORG.name}</Eyebrow>
              <h1 style={{ fontSize: 40, fontWeight: 500, letterSpacing: -0.8, margin: "14px 0 16px", lineHeight: 1.12, fontFamily: serif, color: C.navy }}>
                {greeting}, {VIEWER}. Here's what changed —<br />and <span style={{ fontStyle: "italic", color: C.teal }}>why</span>.
              </h1>
              <p style={{ fontSize: 15.5, color: C.sub, maxWidth: 660, lineHeight: 1.65, margin: 0 }}>
                Three things moved this month that deserve your attention. UGAT reasoned through each — weighing competing explanations before committing to a cause. Nothing below is a summary; every item is a diagnosis with its evidence attached.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: C.faint, fontWeight: 600 }}>Read every insight as:</span>
                <LevelToggle value={level} onChange={setLevel} />
                <span style={{ fontSize: 11.5, color: C.faint, fontStyle: "italic", fontFamily: serif }}>← the Translation Layer. Flip it — every insight rewrites itself.</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {INSIGHTS.map((ins) => (<InsightCard key={ins.id} insight={ins} level={level} expanded={expanded === ins.id} onToggle={() => setExpanded(expanded === ins.id ? null : ins.id)} onHover={setHoverNodes} />))}
            </div>
            <div style={{ marginTop: 28, padding: 18, background: `linear-gradient(135deg, ${C.panel}, ${C.tealWash})`, border: `1px solid ${C.line}`, borderRadius: 14, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.navy, display: "grid", placeItems: "center", flexShrink: 0, color: "#fff", fontWeight: 800 }}>✦</div>
              <div><div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 5, color: C.navy }}>UGAT's synthesis</div>
                <p style={{ ...pBody, fontSize: 13, color: C.ink }}>Two of these three insights share a single root cause: the new Finance approval policy. Fixing that one step raises Decision Velocity, relieves the Engineering→Procurement→Finance dependency chain, and pulls cycle time back down — <span style={{ color: C.tealDeep, fontWeight: 600 }}>one intervention, three problems</span>. UGAT recommends prioritizing it first.</p>
              </div>
            </div>
          </div>
        )}

        {tab === "graph" && (
          <div style={{ animation: "fadeUp .4s ease", padding: "38px 0" }}>
            <Eyebrow>The Graph</Eyebrow>
            <h2 style={{ fontSize: 27, fontWeight: 500, letterSpacing: -0.5, margin: "8px 0 8px", fontFamily: serif, color: C.navy }}>Where is work getting <span style={{ fontStyle: "italic", color: C.teal }}>stuck</span>?</h2>
            <p style={{ fontSize: 14, color: C.sub, maxWidth: 660, lineHeight: 1.6, margin: "0 0 24px" }}>UGAT models the company as relationships, not records. Hover a node for its health, dependencies, hidden risks, connected projects, and past incidents. Hover an insight on the right to watch the affected pathway light up and flow animate along the dependency. Click a department to inspect it.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1.45fr 1fr", gap: 20, alignItems: "start" }}>
              <OrgGraph highlight={hoverNodes.length ? hoverNodes : picked ? [picked] : []} hoverDept={hoverDept} setHoverDept={setHoverDept} onPick={setPicked} picked={picked} />
              <div>
                {!pickedDept && (
                  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, boxShadow: shadow }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.navy }}>Insight → graph mapping</div>
                    {INSIGHTS.map((ins) => (<div key={ins.id} onMouseEnter={() => setHoverNodes(ins.nodes)} onMouseLeave={() => setHoverNodes([])} style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}` }}><Pill tone={ins.severity === "critical" ? "red" : "amber"} style={{ marginBottom: 6 }}>{ins.metricRef}</Pill><div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>{ins.headline.exec}</div><div style={{ fontSize: 11, color: C.faint, marginTop: 5, fontFamily: mono }}>touches: {ins.nodes.map((n) => DEPTS[n].name).join(" → ")}</div></div>))}
                  </div>
                )}
                {pickedDept && (
                  <div style={{ background: C.panel, border: `1px solid ${C.line2}`, borderRadius: 14, padding: 18, animation: "fadeUp .3s ease", boxShadow: shadowUp }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}><Ring value={pickedDept.health} size={46} /><div><div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{pickedDept.name}</div><div style={{ fontSize: 12, color: C.faint }}>{pickedDept.head} · {pickedDept.size} people</div></div></div>
                      <button onClick={() => setPicked(null)} style={ghostBtn}>✕</button>
                    </div>
                    {deptInsights.length > 0 ? (<><div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 8 }}>⚠ Implicated in {deptInsights.length} active insight{deptInsights.length > 1 ? "s" : ""}</div>{deptInsights.map((ins) => (<div key={ins.id} style={{ background: C.panel3, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 8 }}><div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5, marginBottom: 8 }}>{ins.headline.manager}</div><button onClick={() => { setTab("briefing"); setExpanded(ins.id); }} style={{ ...ghostBtn, color: C.tealDeep, borderColor: "#bfe3dd" }}>Open reasoning →</button></div>))}</>) : (<div style={{ fontSize: 12.5, color: C.faint }}>No active insights implicate this department. Operating within normal bands.</div>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "health" && (
          <div style={{ animation: "fadeUp .4s ease", padding: "38px 0" }}>
            <Eyebrow>Organizational DNA</Eyebrow>
            <h2 style={{ fontSize: 27, fontWeight: 500, letterSpacing: -0.5, margin: "8px 0 8px", fontFamily: serif, color: C.navy }}>How is the organization actually <span style={{ fontStyle: "italic", color: C.teal }}>behaving</span>?</h2>
            <p style={{ fontSize: 14, color: C.sub, maxWidth: 660, lineHeight: 1.6, margin: "0 0 24px" }}>Behavior metrics, not vanity KPIs. These are UGAT's own instruments — designed to measure how the company <i>works</i>, not how much it produced. Click one to see what it's telling us.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>{METRICS.map((m) => <MetricTile key={m.id} m={m} active={metricSel === m.id} onClick={() => setMetricSel(metricSel === m.id ? null : m.id)} />)}</div>
            {metricSel && (<div style={{ marginTop: 16, background: C.panel, border: `1px solid ${C.line2}`, borderRadius: 14, padding: 18, animation: "fadeUp .3s ease", boxShadow: shadow }}><div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><span style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{METRICS.find((m) => m.id === metricSel).label}</span><Spark delta={METRICS.find((m) => m.id === metricSel).delta} /></div><p style={pBody}>{METRICS.find((m) => m.id === metricSel).hint}</p></div>)}
            <div style={{ marginTop: 26, padding: 22, background: C.navy, borderRadius: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.tealWash, letterSpacing: 1.4, marginBottom: 10, textTransform: "uppercase" }}>Why these, not NPS / velocity / utilization</div>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "#D8DCEA", maxWidth: 720, margin: 0 }}>Generic SaaS KPIs tell you <i>that</i> something moved. UGAT's metrics tell you <i>why</i> — each decomposes into observable events in the graph, so a bad number always has a traceable cause. Friction isn't a mood; it's measurable wait-states, rework loops, and blocked handoffs you can point at.</p>
            </div>
          </div>
        )}

        {tab === "ask" && (<div style={{ animation: "fadeUp .4s ease" }}><AskUgat level={level} setLevel={setLevel} /></div>)}

        {tab === "about" && (
          <div style={{ animation: "fadeUp .4s ease", padding: "38px 0", maxWidth: 780 }}>
            <Eyebrow>The Thesis</Eyebrow>
            <h2 style={{ fontSize: 27, fontWeight: 500, letterSpacing: -0.5, margin: "8px 0 22px", fontFamily: serif, color: C.navy }}>Why UGAT is <span style={{ fontStyle: "italic", color: C.teal }}>not</span> another dashboard</h2>
            {[
              ["It answers WHY before WHAT.", "A BI dashboard shows cycle time went up. UGAT tells you it went up because of a specific approval policy, weighs three other explanations first, and shows the evidence that ruled them out."],
              ["It reasons out loud.", "Every insight walks the same loop: observe → competing hypotheses → evidence → confidence → recommendation → estimated outcome → learn. It never jumps to a conclusion, and it shows its work — including a visible 'thinking' pass and a live agent that reasons on new questions."],
              ["It refuses false precision.", "Where the data can't support a calibrated probability, UGAT says 'strong evidence,' not '91%.' The approval insight rests on a natural experiment — a policy that shipped mid-window — which is honest causal reasoning, not an invented number."],
              ["It speaks three languages.", "The same insight exists for the analyst, the manager, and the executive. The Translation Layer isn't three reports — it's one diagnosis, re-voiced. That's the defining feature."],
              ["It models systems, not people.", "Root causes live in the graph — policies, dependencies, single-owner workflows — never in individuals. The live agent is constrained the same way: ask it to blame a person and it redirects to the system that produced the behavior."],
            ].map(([h, b], i) => (
              <div key={i} style={{ display: "flex", gap: 18, padding: "18px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ fontFamily: mono, fontSize: 15, color: C.teal, fontWeight: 800, width: 28, flexShrink: 0 }}>0{i + 1}</div>
                <div><div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: C.navy }}>{h}</div><p style={pBody}>{b}</p></div>
              </div>
            ))}
            <div style={{ marginTop: 24, padding: 16, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
              <b style={{ color: C.navy }}>Prototype scope, stated honestly.</b> The organization is synthetic and seeded, with three root causes deliberately planted so the reasoning is verifiable. The scripted insights are authored to demonstrate the loop; the <b style={{ color: C.navy }}>Ask UGAT</b> tab is a genuinely live model call, grounded in the same data and constrained to the same rules. In production, deterministic detection (SQL/stats) finds anomalies and the model generates and ranks hypotheses against real event data. Integrations, auth, and scenario simulation are represented, not built.
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, padding: "20px 24px", textAlign: "center", color: C.faint, fontSize: 12 }}>UGAT · <span style={{ fontFamily: serif, fontStyle: "italic" }}>"See what your organization feels before it breaks."</span> · interactive prototype</div>
    </div>
  );
}

const keyframes = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%,100% { opacity: .3; transform: scale(.8); } 50% { opacity: 1; transform: scale(1.15); } }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: ${C.line2}; border-radius: 999px; }
  ::-webkit-scrollbar-track { background: transparent; }
  input::placeholder { color: ${C.faint2}; }
`;
