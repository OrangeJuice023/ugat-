// app/api/ask/route.js
// Live "Ask UGAT" agent — runs on Groq's FREE tier (OpenAI-compatible API).
// If GROQ_API_KEY is missing or the call fails, it falls back to scripted
// reasoning so the demo NEVER breaks. Zero cost either way.

export const runtime = "edge";

const AGENT_CONTEXT = `You are UGAT, an Organizational Reasoning engine. You reason about how an organization behaves and answer WHY before WHAT — like a management consultant crossed with an industrial engineer.

You are grounded in the live state of this organization:

COMPANY: Alab Technologies, Inc. — Makati City, B2B logistics SaaS, Series A, 61 people, 8 departments.

DEPARTMENTS (name · head · size · health/100 · known risks):
- Executive · R. Batumbakal · 3 · 82 · none
- Sales & Accounts · M. Santos · 12 · 74 · quota renegotiation pending
- Operations · J. Dela Cruz · 15 · 69 · SLA breaches trending up
- Finance · A. Reyes · 6 · 41 · APPROVAL BOTTLENECK (root cause), dual-signer backlog
- Procurement · L. Villanueva · 5 · 52 · serialized on Finance sign-off
- Engineering · P. Aquino · 11 · 58 · idle-while-blocked 19%
- People & Admin · C. Mercado · 4 · 78 · none
- IT · G. Tan · 5 · 55 · SINGLE-OWNER ACCESS WORKFLOW (root cause), bus-factor 1

BEHAVIOR METRICS (Organizational DNA, current · 30-day delta): Friction 72 (+18), Decision Velocity 41 (-23), Approval Complexity 3.4 hops (+0.9), Knowledge Flow 55 (-6), Execution Momentum 63 (-4), Context-Switching Cost 38h/wk (+7), Dependency Health 48 (-15), Resilience 61 (-3).

KNOWN ROOT CAUSES already diagnosed:
1. A new PO policy (day 6 of the window) added a 2nd Finance signer for POs over PHP 50k. This tripled Finance approval queue time (0.8d->2.6d) and drove median cycle time up 22% (14.1d->17.2d). 71% of delayed items cross the 50k threshold.
2. The same Finance node serializes a dependency chain Engineering->Procurement->Finance; 4 of 7 stalled epics trace to it. Root causes 1 and 2 are the SAME underlying cause.
3. IT access provisioning is a single-owner silo: 94% of tickets closed by one person (G. Tan); resolution time rose 5x on their leave days; zero backup closers in 90 days.

REASONING RULES (strict):
- Reason via: observation -> competing hypotheses -> evidence -> confidence -> recommendation.
- NEVER invent precise probabilities. Rate hypotheses only "strong", "moderate", or "weak".
- Attribute causes to SYSTEMS — policies, dependencies, workflows, structures — NEVER to individuals. If asked to blame or rank a person, redirect to the system that produced the behavior.
- Stay grounded in the data above. If the data can't support a claim, say so plainly.
- Be concise and specific; use the numbers above.

Respond with ONLY a raw JSON object (no markdown, no code fences) matching exactly:
{
 "observation": "one or two sentences on what the data shows",
 "hypotheses": [ {"label":"short hypothesis","strength":"strong|moderate|weak","why":"one sentence of evidence"} ],
 "confidence": "e.g. Strong evidence for the approval-policy explanation",
 "impact": "the business impact in plain terms",
 "recommendation": "the recommended intervention",
 "translation": {"analyst":"technical phrasing","manager":"operational phrasing","exec":"plain-English phrasing"}
}
Provide 2 to 4 hypotheses.`;

// ---- scripted fallback (offline, always available) ------------------------
const SCRIPTED = {
  approvals: {
    observation: "Median cycle time rose 22% (14.1d->17.2d) over 30 days, with the entire increase in the approval wait-state, beginning on the day a new PO policy shipped.",
    hypotheses: [
      { label: "A new policy added a 2nd Finance signer for POs over PHP 50k", strength: "strong", why: "Policy shipped day 6; 71% of delayed items cross the 50k threshold; Finance queue time tripled that day." },
      { label: "Team velocity dropped", strength: "weak", why: "Active-work hours per item are flat (+3%); no attrition or PTO spike." },
      { label: "Project scope increased", strength: "moderate", why: "Task counts up ~9% — real but far too small to explain a 22% jump." },
    ],
    confidence: "Strong evidence for the approval-policy explanation (natural experiment: policy shipped mid-window)",
    impact: "Roughly six delivery-weeks per month spent waiting on one approval step.",
    recommendation: "Raise the dual-sign threshold to PHP 150k or pre-authorize recurring vendors, and add a 24-hour SLA with auto-escalation on the Finance approval node.",
    translation: {
      analyst: "Raise dual-sign threshold to 150k / pre-authorize recurring vendors; add SLA timer + auto-escalation on the Finance approval node.",
      manager: "Let smaller POs clear with one signer and put a 24-hour clock on Finance approvals.",
      exec: "Simplify sign-off on routine spend so decisions stop bottlenecking delivery.",
    },
  },
  dependency: {
    observation: "Dependency Health fell 15 points; 4 of 7 stalled epics trace to a single shared upstream node — the same Finance approval step — serializing Engineering, Procurement and Finance.",
    hypotheses: [
      { label: "A shared upstream node (Finance approvals) is serializing three teams", strength: "strong", why: "The same node recurs in every long dependency path; removing it in simulation cuts chain length 41%." },
      { label: "Engineering is under-staffed", strength: "weak", why: "Utilization is 78% — busy, not saturated; idle-while-blocked is the larger signal." },
      { label: "Poor task sequencing inside Engineering", strength: "moderate", why: "Some parallelizable work runs serially — secondary to the upstream block." },
    ],
    confidence: "Strong evidence that one upstream node is serializing three teams",
    impact: "Every dependent project inherits the upstream delay on top of its own — the delay multiplies downstream.",
    recommendation: "Grant per-project pre-approved procurement envelopes so Engineering never blocks on per-item Finance sign-off. This shares a root cause with the cycle-time issue — one fix resolves both.",
    translation: {
      analyst: "Decouple with per-project pre-approved procurement envelopes; insert a buffer node so Engineering doesn't block on per-item sign-off.",
      manager: "Give each project a pre-approved spend envelope so teams stop waiting item by item.",
      exec: "Fixing the one upstream approval step also unblocks these teams — same root cause.",
    },
  },
  silo: {
    observation: "IT access provisioning is a single-owner silo: 94% of access tickets are closed by one person, and resolution time rose 5x on their leave days, with zero backup closers in 90 days.",
    hypotheses: [
      { label: "The workflow is a single-owner silo (key-person dependency)", strength: "strong", why: "94% closure concentration; 5x resolution time on leave days; no secondary closer in 90 days." },
      { label: "Ticket volume spiked on those days", strength: "weak", why: "Volume was normal; the delta is resolution time, not arrival rate." },
      { label: "A tooling outage slowed provisioning", strength: "weak", why: "No IT incident logged; other IT workflows unaffected." },
    ],
    confidence: "Strong evidence of a key-person risk on a company-wide workflow",
    impact: "A single point of failure sits on a workflow every new hire and role change depends on.",
    recommendation: "Cross-train a secondary owner and codify the provisioning runbook; add round-robin assignment with the primary as reviewer. Bus-factor 1 -> 2 within one sprint.",
    translation: {
      analyst: "Cross-train a secondary owner; codify the runbook; round-robin assignment with primary as reviewer.",
      manager: "Train a backup and document the steps so it isn't all in one person's head.",
      exec: "Remove the single point of failure by cross-training a second person.",
    },
  },
};

function scriptedAnswer(question) {
  const q = (question || "").toLowerCase();
  if (/(stuck|depend|upstream|engineer|block|chain)/.test(q)) return SCRIPTED.dependency;
  if (/(risk|silo|person|bus|hidden|it |access|single)/.test(q)) return SCRIPTED.silo;
  // approvals is the priority/default (also matches: fix first, slow, cycle, threshold, 150)
  return SCRIPTED.approvals;
}

export async function POST(req) {
  let question = "";
  try {
    const body = await req.json();
    question = body.question || "";
  } catch (e) {}

  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  // No key configured -> scripted (still fully functional, zero cost)
  if (!key) {
    return Response.json({ parsed: scriptedAnswer(question), source: "scripted" });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: AGENT_CONTEXT },
          { role: "user", content: `Executive question: "${question}"` },
        ],
      }),
    });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    if (parsed && parsed.observation) {
      return Response.json({ parsed, source: "groq" });
    }
    return Response.json({ parsed: scriptedAnswer(question), source: "scripted-fallback" });
  } catch (e) {
    // Any failure (rate limit, parse error, network) -> graceful scripted fallback
    return Response.json({ parsed: scriptedAnswer(question), source: "scripted-fallback" });
  }
}
