import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#1A1D1A", card: "#2D312E", card2: "#252825",
  rose: "#E8A2A8", green: "#A5D6A7", blue: "#9EB8D9",
  primary: "#F0F4F0", secondary: "#B8C0B8", muted: "#7E8A7E",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_LOGS = [
  { type: "SUCCESS", path: "/home.html", delay: 400 },
  { type: "SUCCESS", path: "/about.html", delay: 800 },
  { type: "SUCCESS", path: "/services/index.html", delay: 1200 },
  { type: "ERROR",   path: "/pricing/compare",      delay: 1600 },
  { type: "SUCCESS", path: "/blog/2024-launch.html", delay: 2000 },
  { type: "AI_ANALYSIS", path: "/pricing/compare",  delay: 2400 },
  { type: "SUCCESS", path: "/contact.html",          delay: 2800 },
  { type: "WAYBACK",     path: "Querying archive.org…", delay: 3200 },
  { type: "SUCCESS", path: "/team/index.html",       delay: 3600 },
  { type: "ERROR",   path: "/case-studies/acme-corp",delay: 4000 },
  { type: "AI_ANALYSIS", path: "/case-studies/acme-corp", delay: 4400 },
  { type: "WAYBACK",     path: "Snapshot found: 2023-08-14", delay: 4800 },
  { type: "SUCCESS", path: "/privacy-policy.html",   delay: 5200 },
  { type: "ERROR",   path: "/docs/v1/api-ref",       delay: 5600 },
  { type: "ERROR",   path: "/partners/techcorp",     delay: 6000 },
];

const MOCK_RESULTS = [
  {
    id: 1, code: "404", path: "/pricing/compare", foundOn: "Home page",
    context: "The pricing comparison table was linked from the main navigation and referenced in 3 blog posts. It contained a detailed breakdown of all plan tiers including Enterprise pricing.",
    wayback: { status: "Snapshot found", date: "August 14, 2023", url: "https://web.archive.org/web/20230814/pricing/compare" },
    ai: { suggestion: "Redirect to /pricing with #comparison anchor. Update all internal links referencing this path. The page content is recoverable from the August snapshot.", confidence: 87 },
    recovered: "Three-tier pricing table: Starter $29/mo, Pro $79/mo, Enterprise custom. All feature comparisons intact.",
    similarPages: ["/pricing", "/pricing/plans", "/billing"],
  },
  {
    id: 2, code: "404", path: "/case-studies/acme-corp", foundOn: "Blog sidebar",
    context: "Featured case study linked from the blog sidebar widget and the homepage 'Success Stories' section. Referenced as a key conversion driver in Q3 analytics.",
    wayback: { status: "Snapshot found", date: "November 2, 2023", url: "https://web.archive.org/web/20231102/case-studies/acme-corp" },
    ai: { suggestion: "Restore page from Wayback snapshot or redirect to /case-studies with Acme Corp filter. Content is fully recoverable.", confidence: 92 },
    recovered: "Acme Corp case study: 340% ROI over 6 months. Includes executive quotes, metrics, and implementation timeline.",
    similarPages: ["/case-studies", "/case-studies/enterprise", "/success-stories"],
  },
  {
    id: 3, code: "404", path: "/docs/v1/api-ref", foundOn: "Documentation hub",
    context: "API reference linked from onboarding emails and the developer portal. High-traffic page used by integrating customers daily.",
    wayback: { status: "Snapshot found", date: "January 8, 2024", url: "https://web.archive.org/web/20240108/docs/v1/api-ref" },
    ai: { suggestion: "Redirect to /docs/v2/api-reference — content was migrated during the v2 docs rewrite but old links were not updated.", confidence: 95 },
    recovered: "Full REST API reference for v1 endpoints including authentication, rate limits, and all resource types.",
    similarPages: ["/docs/v2/api-reference", "/docs/api", "/developers"],
  },
  {
    id: 4, code: "404", path: "/partners/techcorp", foundOn: "Partners page",
    context: "Partner spotlight page for TechCorp, linked from the main /partners directory and a press release from Q2 2023.",
    wayback: { status: "No snapshot found", date: null, url: null },
    ai: { suggestion: "No archived version found. Recommend creating a new partner page or redirecting to /partners with a TechCorp filter.", confidence: 41 },
    recovered: null,
    similarPages: ["/partners", "/partners/enterprise"],
  },
];

const ANALYTICS_DATA = [
  { date: "Jan 1",  scans: 12,  broken: 34 },
  { date: "Jan 8",  scans: 19,  broken: 52 },
  { date: "Jan 15", scans: 28,  broken: 41 },
  { date: "Jan 22", scans: 35,  broken: 67 },
  { date: "Jan 29", scans: 44,  broken: 55 },
  { date: "Feb 5",  scans: 58,  broken: 88 },
  { date: "Feb 12", scans: 71,  broken: 72 },
  { date: "Feb 19", scans: 89,  broken: 91 },
  { date: "Feb 26", scans: 103, broken: 78 },
  { date: "Mar 5",  scans: 117, broken: 103 },
  { date: "Mar 12", scans: 134, broken: 96 },
  { date: "Mar 19", scans: 148, broken: 112 },
];

const TOP_BROKEN = [
  { domain: "quantumdesigns.io", broken: 14, fixed: 11 },
  { domain: "acmecorp.dev",       broken: 9,  fixed: 7  },
  { domain: "techventures.co",    broken: 7,  fixed: 4  },
  { domain: "startupbase.io",     broken: 5,  fixed: 5  },
  { domain: "devhub.net",         broken: 3,  fixed: 1  },
];

const HISTORY = [
  { id: "sc_001", domain: "quantumdesigns.io", date: "Apr 10, 2026, 14:32", scanned: 112, broken: 4,  fixed: 2, status: "partial" },
  { id: "sc_002", domain: "acmecorp.dev",       date: "Apr 9, 2026, 09:14",  scanned: 88,  broken: 9,  fixed: 9, status: "done"    },
  { id: "sc_003", domain: "techventures.co",    date: "Apr 8, 2026, 17:50",  scanned: 203, broken: 7,  fixed: 4, status: "partial" },
  { id: "sc_004", domain: "startupbase.io",     date: "Apr 6, 2026, 11:05",  scanned: 54,  broken: 5,  fixed: 5, status: "done"    },
  { id: "sc_005", domain: "devhub.net",          date: "Apr 3, 2026, 08:22",  scanned: 31,  broken: 3,  fixed: 1, status: "partial" },
];

const PLANS = [
  {
    name: "Free", price: { monthly: 0, annual: 0 }, cta: "Get Started", color: C.muted,
    features: ["1 scan / day", "Up to 50 pages", "Basic broken link report", "CSV export"],
  },
  {
    name: "Pro", price: { monthly: 29, annual: 23 }, cta: "Start Free Trial", color: C.rose, popular: true,
    features: ["Unlimited scans", "Unlimited pages", "AI recovery suggestions", "Wayback integration", "PDF + CSV export", "Fix history & audit log", "Priority support"],
  },
  {
    name: "Agency", price: { monthly: 99, annual: 79 }, cta: "Contact Sales", color: C.blue,
    features: ["Everything in Pro", "10 sites / workspaces", "5 team seats", "API access", "White-label reports", "Dedicated onboarding"],
  },
];

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function SectionLabel({ children, color }) {
  return <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: color || C.secondary, fontFamily: "'DM Mono', monospace" }}>{children}</span>;
}

function Tag({ children, color = C.rose }) {
  return <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, fontFamily: "'DM Mono', monospace", background: `${color}18`, color, border: `1px solid ${color}28` }}>{children}</span>;
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(240,244,240,0.05)" }} />;
}

function ProgressBar({ progress, color }) {
  return (
    <div style={{ width: "100%", borderRadius: 99, overflow: "hidden", background: "rgba(240,244,240,0.06)", height: 6 }}>
      <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: color || C.rose, transition: "width 0.5s ease" }} />
    </div>
  );
}

function ConfidenceBar({ score }) {
  const color = score >= 80 ? C.green : score >= 50 ? "#F0C987" : C.rose;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
      <div style={{ flex: 1, borderRadius: 99, overflow: "hidden", background: `${color}18`, height: 5 }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 99, background: color, transition: "width 1s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color }}>{score}%</span>
    </div>
  );
}

function Btn({ children, onClick, href, variant = "ghost", disabled, small, fullWidth, icon }) {
  const [hov, setHov] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    borderRadius: 10, fontSize: small ? 11 : 12, fontWeight: 500, letterSpacing: "0.02em",
    cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "all 0.15s ease",
    fontFamily: "inherit", padding: small ? "6px 13px" : "9px 18px",
    width: fullWidth ? "100%" : undefined, opacity: disabled ? 0.5 : 1,
  };
  const vs = {
    ghost:   { ...base, background: hov && !disabled ? "rgba(240,244,240,0.09)" : "rgba(240,244,240,0.05)", color: C.secondary, border: "1px solid rgba(240,244,240,0.09)", transform: hov && !disabled ? "scale(1.02)" : "scale(1)" },
    rose:    { ...base, background: hov && !disabled ? "#f0b5ba" : C.rose, color: "#1A1D1A", fontWeight: 600, transform: hov && !disabled ? "scale(1.03)" : "scale(1)" },
    green:   { ...base, background: hov && !disabled ? "#bde3bf" : C.green, color: "#1A1D1A", fontWeight: 600, transform: hov && !disabled ? "scale(1.03)" : "scale(1)" },
    outline: { ...base, background: "transparent", color: C.rose, border: `1px solid ${C.rose}55`, transform: hov && !disabled ? "scale(1.02)" : "scale(1)" },
  };
  const props = { style: vs[variant], onClick, disabled, onMouseEnter: () => setHov(true), onMouseLeave: () => setHov(false), "aria-label": typeof children === "string" ? children : undefined };
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{icon && <span>{icon}</span>}{children}</a>;
  return <button {...props}>{icon && <span>{icon}</span>}{children}</button>;
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, width = 700 }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(10,12,10,0.84)", backdropFilter: "blur(8px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}>
        {children}
      </div>
    </div>
  );
}

// ─── PRICING MODAL ────────────────────────────────────────────────────────────
function PricingModal({ open, onClose }) {
  const [annual, setAnnual] = useState(false);
  return (
    <Modal open={open} onClose={onClose} width={880}>
      <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: C.primary, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Choose a plan</h2>
            <p style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>Scale as you grow. Cancel any time.</p>
          </div>
          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: C.muted }}>Monthly</span>
            <button onClick={() => setAnnual(a => !a)} style={{ position: "relative", width: 40, height: 22, borderRadius: 99, background: annual ? C.green : "rgba(240,244,240,0.10)", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
              <span style={{ position: "absolute", top: 3, left: annual ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: annual ? "#1A1D1A" : C.muted, transition: "left 0.2s ease" }} />
            </button>
            <span style={{ fontSize: 11, color: C.muted }}>Annual <span style={{ color: C.green }}>−20%</span></span>
          </div>
        </div>

        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{ position: "relative", borderRadius: 18, padding: 28, display: "flex", flexDirection: "column", gap: 22, background: plan.popular ? "rgba(232,162,168,0.07)" : C.card2, border: plan.popular ? `1.5px solid ${C.rose}44` : "1.5px solid rgba(240,244,240,0.07)" }}>
              {plan.popular && (
                <span style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", fontSize: 10, padding: "4px 12px", borderRadius: 99, background: C.rose, color: "#1A1D1A", fontWeight: 700, fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap" }}>Most Popular</span>
              )}
              <div>
                <SectionLabel color={plan.color}>{plan.name}</SectionLabel>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginTop: 12 }}>
                  <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", color: C.primary, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
                    {plan.price.monthly === 0 ? "Free" : `$${plan.price[annual ? "annual" : "monthly"]}`}
                  </span>
                  {plan.price.monthly > 0 && <span style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>/mo</span>}
                </div>
                {annual && plan.price.monthly > 0 && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Billed ${plan.price.annual * 12}/yr</p>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: C.green, fontSize: 11 }}>✓</span>
                    <span style={{ fontSize: 12, color: C.secondary, lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Btn variant={plan.popular ? "rose" : "ghost"} fullWidth>{plan.cta}</Btn>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, textAlign: "center", color: C.muted }}>No credit card required for Free. Pro trial is 14 days, no charge.</p>
      </div>
    </Modal>
  );
}

// ─── PREVIEW FIX MODAL ────────────────────────────────────────────────────────
function PreviewModal({ open, onClose, result }) {
  if (!result) return null;
  return (
    <Modal open={open} onClose={onClose} width={920}>
      <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="modal-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: C.primary, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Preview Fix</h2>
            <p style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, marginTop: 4 }}>{result.path}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(240,244,240,0.06)", border: "1px solid rgba(240,244,240,0.09)", borderRadius: 8, cursor: "pointer", color: C.muted, padding: "6px 12px", fontFamily: "inherit", fontSize: 12 }}>✕ Close</button>
        </div>
        <Divider />
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* BEFORE */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag color={C.rose}>BEFORE</Tag>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>{result.path}</span>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", border: `1.5px solid ${C.rose}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: `${C.rose}10` }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.rose, display: "inline-block" }} />
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>404 Not Found</span>
              </div>
              <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 200, background: C.card2 }}>
                <span style={{ fontSize: 56, fontWeight: 600, color: `${C.rose}55`, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>404</span>
                <p style={{ fontSize: 13, color: C.muted, textAlign: "center", maxWidth: 200, lineHeight: 1.6 }}>This page could not be found. The link may be broken or the page may have moved.</p>
              </div>
            </div>
          </div>
          {/* AFTER */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tag color={C.green}>AFTER AI FIX</Tag>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>{result.similarPages?.[0]}</span>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden", border: `1.5px solid ${C.green}30` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: `${C.green}10` }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>200 OK — Redirected</span>
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12, minHeight: 200, background: C.card2 }}>
                <div className="shimmer" style={{ height: 14, borderRadius: 6, width: "60%", background: `${C.green}20` }} />
                <div className="shimmer" style={{ height: 10, borderRadius: 6, width: "100%", background: "rgba(240,244,240,0.06)" }} />
                <div className="shimmer" style={{ height: 10, borderRadius: 6, width: "85%", background: "rgba(240,244,240,0.06)" }} />
                <div className="shimmer" style={{ height: 10, borderRadius: 6, width: "90%", background: "rgba(240,244,240,0.06)" }} />
                <div style={{ marginTop: 8, borderRadius: 12, padding: 14, background: `${C.green}10`, border: `1px solid ${C.green}25` }}>
                  <p style={{ fontSize: 12, color: C.green, lineHeight: 1.6 }}>{result.recovered || result.ai.suggestion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar pages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>SIMILAR EXISTING PAGES DETECTED</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {result.similarPages?.map((p) => (
              <span key={p} style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", padding: "5px 12px", borderRadius: 8, background: "rgba(240,244,240,0.05)", color: C.secondary, border: "1px solid rgba(240,244,240,0.08)" }}>{p}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="green" icon="✓">Apply This Fix</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── BULK UPLOAD MODAL ────────────────────────────────────────────────────────
function BulkModal({ open, onClose }) {
  const [text, setText] = useState("");
  const lines = text.split("\n").filter(l => l.trim()).length;
  return (
    <Modal open={open} onClose={onClose} width={580}>
      <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.primary, fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Bulk URL Scan</h2>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>Paste URLs or upload a CSV. One URL per line.</p>
        </div>
        <Divider />
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={8}
          placeholder={"https://yoursite.io\nhttps://othersite.com\nhttps://docs.example.io"}
          style={{ background: "rgba(240,244,240,0.04)", border: "1.5px solid rgba(240,244,240,0.09)", borderRadius: 12, color: C.primary, fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1.8, padding: "14px 16px", resize: "vertical", outline: "none", width: "100%" }}
        />
        <div className="modal-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>{lines} URL{lines !== 1 ? "s" : ""} detected</span>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="rose" disabled={lines === 0}>Scan {lines > 0 ? `${lines} URLs` : "URLs"}</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────
function ResultCard({ result, onPreview }) {
  const [open, setOpen] = useState({ context: true, wayback: false, ai: true, recovered: false });
  const [copied, setCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [liveAI, setLiveAI] = useState(null);
  const toggle = (k) => setOpen(p => ({ ...p, [k]: !p[k] }));
  const noWayback = result.wayback.status === "No snapshot found";

  const fetchLiveAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `A website has a broken link: "${result.path}" (HTTP 404). Found on: "${result.foundOn}". Context: "${result.context}". Similar existing pages: ${result.similarPages?.join(", ")}. Provide a concise, actionable recovery recommendation in 2-3 sentences. End with "Confidence: XX%".`,
          }],
        }),
      });
      const data = await res.json();
      setLiveAI(data.content?.map(b => b.text || "").join("") || "No response received.");
    } catch {
      setLiveAI("Could not reach AI service. Using cached suggestion below.");
    }
    setAiLoading(false);
  };

  return (
    <div style={{ borderRadius: 20, background: C.card, boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
      {/* Header */}
      <div className="result-card-header modal-padding" style={{ padding: "32px 32px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{ borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, flexShrink: 0, width: 64, height: 64, background: "rgba(232,162,168,0.10)", color: C.rose, border: "1px solid rgba(232,162,168,0.18)", fontFamily: "'DM Sans', sans-serif" }}>
            {result.code}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: C.primary, fontFamily: "'DM Sans', sans-serif" }}>{result.path}</span>
            <span style={{ fontSize: 12, color: C.muted }}>Found on <span style={{ color: C.rose }}>{result.foundOn}</span></span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {result.similarPages?.slice(0, 2).map(p => (
                <span key={p} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", padding: "3px 9px", borderRadius: 6, background: "rgba(240,244,240,0.05)", color: C.muted }}>→ {p}</span>
              ))}
            </div>
          </div>
        </div>
        <Tag color={C.rose}>Broken</Tag>
      </div>
      <Divider />

      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Context */}
        <Collapsible label="ORIGINAL CONTEXT" open={open.context} onToggle={() => toggle("context")}>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: C.secondary }}>{result.context}</p>
        </Collapsible>

        {/* Wayback */}
        <Collapsible label="WAYBACK MACHINE SOURCE" open={open.wayback} onToggle={() => toggle("wayback")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Tag color={noWayback ? C.rose : C.green}>{result.wayback.status}</Tag>
            {result.wayback.date && <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>Snapshot: {result.wayback.date}</span>}
          </div>
        </Collapsible>

        {/* AI Suggestion */}
        <Collapsible label="AI RECOVERY SUGGESTION" open={open.ai} onToggle={() => toggle("ai")} accent={C.green}>
          <div style={{ borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14, background: "rgba(165,214,167,0.06)", borderLeft: `3px solid ${C.green}` }}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: C.green }}>{liveAI || result.ai.suggestion}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, fontFamily: "'DM Mono', monospace" }}>Confidence</span>
              <div style={{ flex: 1 }}><ConfidenceBar score={result.ai.confidence} /></div>
            </div>
            <Btn variant="ghost" small icon={aiLoading ? "…" : "✦"} onClick={fetchLiveAI} disabled={aiLoading}>
              {aiLoading ? "Fetching live AI analysis…" : "Re-analyze with Live AI"}
            </Btn>
          </div>
        </Collapsible>

        {/* Recovered */}
        {result.recovered && (
          <Collapsible label="RECOVERED TEXT" open={open.recovered} onToggle={() => toggle("recovered")}>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: C.secondary }}>{result.recovered}</p>
          </Collapsible>
        )}
      </div>

      <Divider />
      <div style={{ padding: "18px 32px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {result.wayback.url && <Btn variant="ghost" icon="↗" small href={result.wayback.url}>Visit Wayback Archive</Btn>}
        <Btn variant="ghost" icon={copied ? "✓" : "⎘"} small onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copied!" : "Copy Suggestion"}</Btn>
        <Btn variant="ghost" icon="⊡" small onClick={() => onPreview(result)}>Preview Fix</Btn>
        <Btn variant="rose" icon="→" small>Fix Link</Btn>
      </div>
    </div>
  );
}

function Collapsible({ label, open, onToggle, children, accent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <button onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%", textAlign: "left" }}>
        <SectionLabel color={accent}>{label}</SectionLabel>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto", display: "inline-block", transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const totalScans  = ANALYTICS_DATA.reduce((a, b) => a + b.scans, 0);
  const totalBroken = ANALYTICS_DATA.reduce((a, b) => a + b.broken, 0);
  const fixRate = 73;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          { label: "Total Scans",        value: totalScans,  color: C.primary },
          { label: "Broken Links Found", value: totalBroken, color: C.rose    },
          { label: "Fix Rate",           value: `${fixRate}%`, color: C.green  },
        ].map((s) => (
          <div key={s.label} style={{ borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 10, background: C.card, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <SectionLabel>{s.label}</SectionLabel>
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.03em", color: s.color, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 20, padding: 32, background: C.card, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <SectionLabel>SCANS & BROKEN LINKS OVER TIME</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {[{ color: C.rose, label: "Broken" }, { color: C.green, label: "Scans" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: C.muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ANALYTICS_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,244,240,0.05)" />
            <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.muted, fontSize: 10, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.card2, border: "1px solid rgba(240,244,240,0.08)", borderRadius: 10, color: C.primary, fontSize: 12, fontFamily: "'DM Mono', monospace" }} />
            <Line type="monotone" dataKey="broken" stroke={C.rose}  strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="scans"  stroke={C.green} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ borderRadius: 20, padding: 32, background: C.card, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <SectionLabel>MOST BROKEN DOMAINS</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
          {TOP_BROKEN.map((d) => {
            const rate = Math.round((d.fixed / d.broken) * 100);
            return (
              <div key={d.domain} className="domain-row" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: C.secondary, width: 180, flexShrink: 0 }}>{d.domain}</span>
                <div style={{ flex: 1 }}><ProgressBar progress={rate} color={rate === 100 ? C.green : C.rose} /></div>
                <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, width: 70, textAlign: "right", flexShrink: 0 }}>{d.fixed}/{d.broken} fixed</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
function HistoryTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="history-container" style={{ borderRadius: 20, overflow: "hidden", background: C.card, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div className="history-inner">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 80px 80px 80px 110px", padding: "16px 24px", borderBottom: "1px solid rgba(240,244,240,0.05)" }}>
          {["Domain", "Date", "Scanned", "Broken", "Fixed", "Status"].map(h => (
            <span key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: C.muted, fontFamily: "'DM Mono', monospace" }}>{h}</span>
          ))}
        </div>
        {HISTORY.map((row, i) => (
          <div key={row.id}
            style={{ display: "grid", gridTemplateColumns: "1fr 200px 80px 80px 80px 110px", alignItems: "center", padding: "16px 24px", borderBottom: i < HISTORY.length - 1 ? "1px solid rgba(240,244,240,0.04)" : "none", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(240,244,240,0.02)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: C.primary }}>{row.domain}</span>
            <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>{row.date}</span>
            <span style={{ fontSize: 13, color: C.secondary }}>{row.scanned}</span>
            <span style={{ fontSize: 13, color: C.rose }}>{row.broken}</span>
            <span style={{ fontSize: 13, color: C.green }}>{row.fixed}</span>
            <Tag color={row.status === "done" ? C.green : "#F0C987"}>{row.status === "done" ? "All Fixed" : "Partial"}</Tag>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [activeTab, setActiveTab] = useState("scanner");
  const [showPricing, setShowPricing] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [fixAllDone, setFixAllDone] = useState(false);
  const logsRef = useRef(null);
  const timersRef = useRef([]);

  const isValid = (v) => { try { new URL(v.startsWith("http") ? v : `https://${v}`); return true; } catch { return false; } };
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const handleScan = () => {
    if (!url.trim()) { setUrlError("Please enter a URL to scan."); return; }
    if (!isValid(url.trim())) { setUrlError("Invalid URL. Please enter a valid website address."); return; }
    setUrlError(""); setPhase("scanning"); setProgress(0); setLogs([]); setShowResults(false); setFixAllDone(false); clearTimers();
    let p = 0;
    const tick = () => {
      p += Math.random() * 6 + 2;
      if (p >= 100) { setProgress(100); timersRef.current.push(setTimeout(() => { setPhase("done"); setShowResults(true); }, 500)); return; }
      setProgress(Math.round(p));
      timersRef.current.push(setTimeout(tick, 350));
    };
    tick();
    MOCK_LOGS.forEach((log) => {
      timersRef.current.push(setTimeout(() => {
        setLogs(prev => [...prev, log]);
        if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }, log.delay));
    });
  };

  const handleReset = () => { clearTimers(); setPhase("idle"); setProgress(0); setLogs([]); setShowResults(false); setUrl(""); setUrlError(""); setFixAllDone(false); };

  const scanning = phase === "scanning";
  const done = phase === "done";
  const TABS = [{ id: "scanner", label: "Scanner" }, { id: "analytics", label: "Analytics" }, { id: "history", label: "History" }];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.primary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(240,244,240,0.12); border-radius: 4px; }
        input::placeholder, textarea::placeholder { color: #3E453E; }
        input:focus { outline: none; }
        .shimmer { background: linear-gradient(90deg, rgba(240,244,240,0.04) 25%, rgba(240,244,240,0.09) 50%, rgba(240,244,240,0.04) 75%); background-size: 400% 100%; animation: shimmer 1.6s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; display: inline-block; }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
              /* RESPONSIVE STYLES */
        @media (max-width: 768px) {
          .nav-container { flex-direction: column !important; height: auto !important; padding: 16px !important; gap: 16px !important; }
          .nav-actions { display: none !important; }
          .main-content { padding: 24px 16px !important; }
          .url-input-group { flex-direction: column !important; }
          .url-input-group button, .url-input-group input { width: 100% !important; min-width: unset !important; }
          .crawl-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .crawl-stats { border-left: none !important; padding-left: 0 !important; border-top: 1px solid rgba(240,244,240,0.06); padding-top: 24px; flex-direction: row !important; flex-wrap: wrap !important; justify-content: space-between; gap: 16px !important; }
          .results-header { flex-direction: column; align-items: flex-start !important; gap: 16px !important; }
          .result-card-header { flex-direction: column; align-items: flex-start !important; padding: 24px 20px !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .domain-row { flex-direction: column; align-items: flex-start !important; gap: 8px !important; }
          .domain-row > div { width: 100% !important; }
          .domain-row > span { width: auto !important; }
          .history-container { overflow-x: auto; }
          .history-inner { min-width: 700px; padding-bottom: 8px; }
          .modal-padding { padding: 24px !important; }
          .modal-header-row { flex-direction: column; align-items: flex-start !important; gap: 16px !important; }
        }

      `}</style>

      {/* ── STICKY NAV ── */}
      <div style={{ borderBottom: "1px solid rgba(240,244,240,0.05)", background: "rgba(26,29,26,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div className="nav-container" style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: C.rose, fontFamily: "'DM Mono', monospace" }}>BROKENLINK</span>
            <span style={{ color: "rgba(240,244,240,0.10)", fontSize: 18 }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: C.muted }}>✦</span>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: C.secondary }}>AI FIXER</span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4, borderRadius: 12, background: "rgba(240,244,240,0.04)", border: "1px solid rgba(240,244,240,0.07)" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? C.card : "transparent", color: activeTab === t.id ? C.primary : C.muted, border: "none", borderRadius: 9, padding: "5px 16px", fontSize: 12, fontWeight: activeTab === t.id ? 500 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s ease" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button disabled style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(240,244,240,0.04)", border: "1px solid rgba(240,244,240,0.08)", borderRadius: 10, color: C.muted, fontSize: 12, padding: "6px 14px", cursor: "not-allowed", fontFamily: "inherit", opacity: 0.6 }} title="Team access — Pro feature">
              👥 Invite Team
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: `${C.rose}20`, color: C.rose, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>PRO</span>
            </button>
            <Btn variant="rose" small onClick={() => setShowPricing(true)}>Upgrade →</Btn>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content" style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── SCANNER ── */}
        {activeTab === "scanner" && (
          <>
            {/* URL Input */}
            <div style={{ borderRadius: 20, padding: 32, background: C.card, boxShadow: "0 4px 24px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="modal-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <SectionLabel>ENTER WEBSITE URL</SectionLabel>
                <Btn variant="ghost" small icon="⇪" onClick={() => setShowBulk(true)}>Bulk Upload</Btn>
              </div>
              <div className="url-input-group" style={{ display: "flex", gap: 12 }}>
                <input
                  type="text" value={url} placeholder="www.quantumdesigns.io"
                  onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && !scanning && handleScan()}
                  disabled={scanning}
                  aria-label="Website URL"
                  style={{ flex: 1, borderRadius: 12, padding: "12px 16px", fontSize: 13, background: "rgba(240,244,240,0.04)", color: C.primary, border: urlError ? `1.5px solid ${C.rose}` : "1.5px solid rgba(240,244,240,0.08)", fontFamily: "'DM Mono', monospace", transition: "border-color 0.15s" }}
                  onFocus={(e) => { if (!urlError) e.target.style.borderColor = C.rose; }}
                  onBlur={(e) => { if (!urlError) e.target.style.borderColor = "rgba(240,244,240,0.08)"; }}
                />
                <button
                  onClick={handleScan} disabled={scanning} aria-label="Scan Website"
                  style={{ borderRadius: 12, padding: "12px 28px", fontSize: 12, fontWeight: 600, background: scanning ? `${C.rose}66` : C.rose, color: "#1A1D1A", border: "none", cursor: scanning ? "not-allowed" : "pointer", fontFamily: "inherit", minWidth: 155, transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { if (!scanning) e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                  {scanning ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="pulse-dot">●</span>Scanning…</span> : "SCAN WEBSITE"}
                </button>
              </div>
              {urlError && <p style={{ fontSize: 12, color: C.rose, lineHeight: 1.6 }}>⚠ {urlError}</p>}
            </div>

            {/* Crawling */}
            {(scanning || done) && (
              <div className="fade-in" style={{ borderRadius: 20, padding: 32, background: C.card, boxShadow: "0 4px 24px rgba(0,0,0,0.22)" }}>
                <div className="crawl-grid" style={{ display: "grid", gridTemplateColumns: "60% 1fr", gap: 32 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div className="modal-header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <SectionLabel>{done ? "CRAWL COMPLETE" : "CRAWLING WEBSITE…"}</SectionLabel>
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: done ? C.green : C.rose }}>{progress}%</span>
                      </div>
                      <ProgressBar progress={progress} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <SectionLabel>ACTIVITY LOG</SectionLabel>
                      <div ref={logsRef} style={{ borderRadius: 12, padding: 16, overflowY: "auto", maxHeight: 190, background: "rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", gap: 2, scrollBehavior: "smooth" }}>
                        {logs.map((log, i) => {
                          const col = { SUCCESS: C.green, ERROR: C.rose, AI_ANALYSIS: C.blue, WAYBACK: C.muted }[log.type];
                          const sym = { SUCCESS: "✓", ERROR: "✕", AI_ANALYSIS: "◆", WAYBACK: "○" }[log.type];
                          return (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "2px 0" }}>
                              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: col, flexShrink: 0 }}>{sym}</span>
                              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted, lineHeight: 1.7 }}>
                                <span style={{ color: col }}>[{log.type}]</span> {log.path}
                              </span>
                            </div>
                          );
                        })}
                        {logs.length === 0 && <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: C.muted }}>Initializing crawler…</span>}
                      </div>
                    </div>
                  </div>
                  <div className="crawl-stats" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, paddingLeft: 24, borderLeft: "1px solid rgba(240,244,240,0.06)" }}>
                    {[
                      { label: "Scanned", value: done ? "112" : Math.round((progress / 100) * 112), color: C.primary },
                      { label: "Broken",  value: done ? "4"   : Math.round((progress / 100) * 4),   color: C.rose    },
                      { label: "Time",    value: done ? "5.4s" : `${((progress / 100) * 5.4).toFixed(1)}s`, color: C.secondary },
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <SectionLabel>{s.label}</SectionLabel>
                        <span style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", color: s.color, fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {phase === "idle" && (
              <div style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px", background: "rgba(45,49,46,0.4)", border: "1.5px dashed rgba(240,244,240,0.07)" }}>
                <div style={{ fontSize: 52, opacity: 0.2, marginBottom: 18 }}>⛓</div>
                <p style={{ fontSize: 13, color: C.muted, maxWidth: 260, lineHeight: 1.7 }}>Enter a URL above to scan for broken links and receive AI-powered recovery suggestions.</p>
              </div>
            )}

            {/* Results */}
            {showResults && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div className="results-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: C.primary, fontFamily: "'DM Sans', sans-serif" }}>Results</span>
                    <Tag color={C.rose}>4 broken</Tag>
                    {fixAllDone && <Tag color={C.green}>All Fixed ✓</Tag>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Btn variant="ghost" small icon="⬇" onClick={() => setShowPricing(true)}>Export Report</Btn>
                    <Btn variant="ghost" small onClick={handleReset}>↺ New Scan</Btn>
                    <Btn variant="rose" small icon="✦" onClick={() => setFixAllDone(true)} disabled={fixAllDone}>
                      {fixAllDone ? "All Links Fixed!" : "Fix All Links"}
                    </Btn>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {MOCK_RESULTS.map(r => <ResultCard key={r.id} result={r} onPreview={setPreviewResult} />)}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "history"   && <HistoryTab />}
      </div>

      {/* ── MODALS ── */}
      <PricingModal    open={showPricing}     onClose={() => setShowPricing(false)} />
      <BulkModal       open={showBulk}        onClose={() => setShowBulk(false)} />
      <PreviewModal    open={!!previewResult} onClose={() => setPreviewResult(null)} result={previewResult} />
    </div>
  );
}
