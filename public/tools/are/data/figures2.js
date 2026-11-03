/* More chapter diagrams — one for every chapter that had none. Drawn only in --ink and
   --paper with solid strokes, so they read the same in light, dark and e-ink modes.
   Each figure is keyed by topic id; `after` is the read block it follows. */
(function(){
var F = window.ARE_FIGURES, n = 0;
var INK = "var(--ink)", PAPER = "var(--paper)";
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
/* text: s may be an array of lines; o.a anchor, o.fs size, o.b bold, o.fill colour */
function T(x, y, s, o){
  o = o || {};
  var fs = o.fs || 14, lines = [].concat(s), lh = Math.round(fs * 1.25), y0 = y - (lines.length - 1) * lh / 2;
  return '<text x="' + x + '" y="' + y0 + '" text-anchor="' + (o.a || "middle") + '" dominant-baseline="middle" font-family="sans-serif" font-size="' + fs + '"'
    + (o.b ? ' font-weight="700"' : "") + (o.i ? ' font-style="italic"' : "") + ' fill="' + (o.fill || INK) + '">'
    + lines.map(function(l, i){ return '<tspan x="' + x + '" dy="' + (i ? lh : 0) + '">' + esc(l) + "</tspan>"; }).join("") + "</text>";
}
function R(x, y, w, h, o){
  o = o || {};
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (o.r != null ? ' rx="' + o.r + '"' : "")
    + ' fill="' + (o.fill === "ink" ? INK : o.fill === "none" ? "none" : PAPER) + '" stroke="' + INK + '" stroke-width="' + (o.sw == null ? 2 : o.sw) + '"'
    + (o.dash ? ' stroke-dasharray="6 5"' : "") + "/>";
}
/* box with centred label */
function B(x, y, w, h, label, o){
  o = o || {};
  return R(x, y, w, h, o) + T(x + w / 2, y + h / 2, label, { fs:o.fs, b:o.b, fill:o.fill === "ink" ? PAPER : INK });
}
/* line; o.arrow "end"|"both", o.dash, o.sw */
function L(x1, y1, x2, y2, o){
  o = o || {};
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + INK + '" stroke-width="' + (o.sw || 2) + '"'
    + (o.dash ? ' stroke-dasharray="6 5"' : "")
    + (o.arrow ? ' marker-end="url(#ah' + n + ')"' : "") + (o.arrow === "both" ? ' marker-start="url(#ah' + n + ')"' : "") + "/>";
}
function P(d, o){
  o = o || {};
  return '<path d="' + d + '" fill="' + (o.fill === "ink" ? INK : o.fill === "paper" ? PAPER : "none") + '" stroke="' + INK + '" stroke-width="' + (o.sw == null ? 2 : o.sw) + '"'
    + (o.dash ? ' stroke-dasharray="6 5"' : "") + (o.arrow ? ' marker-end="url(#ah' + n + ')"' : "") + ' stroke-linejoin="round"/>';
}
function svg(w, h, aria, body){
  return '<svg viewBox="0 0 ' + w + " " + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(aria) + '">'
    + '<defs><marker id="ah' + n + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
    + '<path d="M0,0L10,5L0,10z" fill="' + INK + '"/></marker></defs>' + body + "</svg>";
}
function add(id, after, caption, aria, w, h, make){
  n++;
  (F[id] = F[id] || []).push({ after:after, caption:caption, svg:svg(w, h, aria, make()) });
}
/* a row of boxes joined by arrows */
function chain(items, y, h, x0, x1, o){
  o = o || {};
  var gap = o.gap || 18, w = (x1 - x0 - gap * (items.length - 1)) / items.length, s = "";
  items.forEach(function(it, i){
    var x = x0 + i * (w + gap);
    s += B(x, y, w, h, it, { fs:o.fs || 12, fill:(o.ink || []).indexOf(i) >= 0 ? "ink" : "paper", b:(o.ink || []).indexOf(i) >= 0 });
    if(i < items.length - 1) s += L(x + w + 2, y + h / 2, x + w + gap - 2, y + h / 2, { arrow:"end" });
  });
  return s;
}

/* ================= PcM ================= */
add("pcm-01", 0, "Place every structure on the two axes the exam uses: who carries the debts, and how the profit is taxed. No structure protects an architect from their own negligence.",
  "Chart placing business structures by owner liability and taxation", 480, 300, function(){
  var s = L(70, 250, 460, 250, { arrow:"end" }) + L(70, 250, 70, 30, { arrow:"end" });
  s += T(265, 278, "Owner liability →  from unlimited to limited", { fs:13 });
  s += '<g transform="translate(26 140) rotate(-90)">' + T(0, 0, "Taxation →  pass-through on top", { fs:13 }) + "</g>";
  s += L(70, 166, 460, 166, { dash:true, sw:1.5 });
  s += T(456, 156, "pass-through ↑", { a:"end", fs:12, i:true }) + T(456, 178, "taxed twice ↓", { a:"end", fs:12, i:true });
  s += B(84, 44, 120, 40, ["Sole", "proprietorship"], { fs:12 });
  s += B(84, 92, 120, 40, ["General", "partnership"], { fs:12 });
  s += T(144, 146, "joint and several", { fs:11, i:true });
  s += B(214, 68, 112, 40, ["Limited", "partnership"], { fs:12 });
  s += B(336, 44, 110, 40, "LLC / PLLC", { fs:12 });
  s += B(336, 92, 110, 40, "S corporation", { fs:12 });
  s += B(336, 196, 110, 40, ["C corporation"], { fs:12, fill:"ink" });
  s += B(214, 196, 112, 40, ["PC", "(by election)"], { fs:12 });
  return s;
});

add("pcm-02", 0, "The worked example as two bars. Strip out consultants and reimbursables to get NOR; NOR divided by direct labor is the net multiplier (3.0), and it must beat break-even (2.5).",
  "Stacked bars showing total revenue reduced to net operating revenue, then split into direct labor, overhead and profit", 480, 250, function(){
  var k = 100, x = 40, s = "";
  s += T(x, 26, "Total revenue  $4.0M", { a:"start", fs:13, b:true });
  s += B(x, 38, 3.0 * k, 44, "Net operating revenue  $3.0M", { fs:12, fill:"ink" });
  s += B(x + 300, 38, 0.7 * k, 44, ["Consultants", "$0.7M"], { fs:11 });
  s += B(x + 370, 38, 0.3 * k, 44, ["Reimb.", "$0.3M"], { fs:10 });
  s += L(x, 92, x, 132, { dash:true, sw:1.5 }) + L(x + 300, 92, x + 300, 132, { dash:true, sw:1.5 });
  s += T(x, 122, "NOR, split by what it pays for", { a:"start", fs:13, b:true });
  s += B(x, 136, 1.0 * k, 44, ["Direct labor", "$1.0M"], { fs:11 });
  s += B(x + 100, 136, 1.5 * k, 44, ["Overhead (indirect)", "$1.5M"], { fs:11 });
  s += B(x + 250, 136, 0.5 * k, 44, ["Profit", "$0.5M"], { fs:11, fill:"ink" });
  s += T(x, 204, "Net multiplier = NOR ÷ direct labor = 3.0", { a:"start", fs:13 });
  s += T(x, 226, "Break-even = overhead rate 1.5 + 1.0 = 2.5", { a:"start", fs:13 });
  return s;
});

add("pcm-03", 1, "Which policy pays? Claims-made: the one in force when the claim is reported. Occurrence: the one in force when the event happened. A tail covers claims reported after the policy ends.",
  "Timeline contrasting claims-made and occurrence insurance", 480, 250, function(){
  var s = "", x0 = 40, w = 62;
  for(var i = 0; i < 6; i++){ s += B(x0 + i * (w + 4), 92, w, 34, "Policy " + (i + 1), { fs:11 }); }
  s += B(x0 + 6 * (w + 4), 92, 50, 34, "Tail", { fs:11, dash:true });
  s += L(x0 - 10, 140, 470, 140, { arrow:"end" }) + T(470, 156, "time", { a:"end", fs:11, i:true });
  s += L(x0 - 6, 82, x0 - 6, 146, { sw:3 }) + T(x0 - 6, 70, "retro date", { fs:11 });
  var ev = x0 + 0 * (w + 4) + w / 2, cl = x0 + 4 * (w + 4) + w / 2;
  s += '<circle cx="' + ev + '" cy="140" r="6" fill="' + INK + '"/>' + T(ev + 4, 172, "Design error made", { fs:12, a:"start" });
  s += '<circle cx="' + cl + '" cy="140" r="6" fill="' + INK + '"/>' + T(cl + 8, 172, "Claim reported", { fs:12, a:"start" });
  s += P("M" + cl + " 196 V128", { arrow:true }) + T(cl, 212, ["Claims-made", "(professional liability)"], { fs:12, b:true });
  s += P("M" + ev + " 40 V88", { arrow:true }) + T(ev + 4, 26, "Occurrence (general liability) pays from here", { fs:12, b:true, a:"start" });
  return s;
});

add("pcm-04", 1, "Licensure is three requirements met in parallel, then granted by a state board. The NCARB Certificate makes reciprocity easier but is not itself a licence.",
  "Diagram of education, experience and examination leading to a state licence and NCARB Certificate", 480, 250, function(){
  var s = "";
  s += B(20, 20, 136, 62, ["Education", "NAAB-accredited", "degree"], { fs:12 });
  s += B(172, 20, 136, 62, ["Experience", "AXP 3,740 hours", "6 areas"], { fs:12 });
  s += B(324, 20, 136, 62, ["Examination", "ARE", "6 divisions"], { fs:12 });
  s += L(88, 82, 210, 120, { arrow:"end" }) + L(240, 82, 240, 120, { arrow:"end" }) + L(392, 82, 270, 120, { arrow:"end" });
  s += B(150, 122, 180, 44, ["Licence", "granted by the state board"], { fs:12, fill:"ink" });
  s += L(240, 166, 240, 192, { arrow:"end" });
  s += B(150, 194, 180, 40, ["NCARB Certificate", "→ reciprocity elsewhere"], { fs:12, dash:true });
  return s;
});

add("pcm-06", 1, "The five phases of basic services, with the share of fee each usually carries. Each design phase ends with the owner's approval, which becomes the baseline for the next.",
  "Timeline of B101 phases with owner approval gates", 480, 190, function(){
  var s = "", ph = [["SD", "15%"], ["DD", "20%"], ["CD", "40%"], ["Bid", "5%"], ["CA", "20%"]], x = 20, scale = 4.4;
  ph.forEach(function(p, i){
    var w = parseInt(p[1], 10) * scale;
    s += B(x, 54, w, 52, [p[0], p[1]], { fs:12, fill:i === 2 ? "ink" : "paper", b:i === 2 });
    if(i < 3){ s += L(x + w, 40, x + w, 120, { sw:3 }) + T(x + w, 134, ["owner", "approves"], { fs:10 }); }
    x += w;
  });
  s += T(20, 28, "Design →", { a:"start", fs:12, b:true }) + T(460, 28, "→ Construction", { a:"end", fs:12, b:true });
  s += T(240, 170, "CA ends, for most purposes, with the final Certificate for Payment", { fs:12, i:true });
  return s;
});

add("pcm-07", 2, "Who holds contracts with whom under four delivery methods. Solid lines are contracts; a dashed line is a working relationship with no contract.",
  "Contract diagrams for design-bid-build, design-build, CM at risk and CM adviser", 480, 300, function(){
  var s = "";
  function mini(x, y, title, parts){
    var r = T(x + 105, y, title, { fs:13, b:true });
    r += B(x + 70, y + 14, 70, 28, "Owner", { fs:11, fill:"ink" });
    parts.forEach(function(p){
      r += B(x + p[0], y + 78, p[2] || 70, 28, p[1], { fs:11, dash:p[3] });
      if(!p[3]) r += L(x + 105, y + 42, x + p[0] + (p[2] || 70) / 2, y + 78);
    });
    return r;
  }
  s += mini(10, 18, "Design-bid-build", [[0, "Architect"], [140, "Contractor"]]);
  s += L(80, 110, 150, 110, { dash:true });
  s += mini(250, 18, "Design-build", [[45, "Design-builder", 120]]);
  s += T(355, 140, "architect works inside or under it", { fs:11, i:true });
  s += mini(10, 160, "CM at risk", [[0, "Architect"], [140, ["CM (builder)", "usually GMP"]]]);
  s += T(115, 288, "CM takes construction risk", { fs:11, i:true });
  s += mini(250, 160, "CM as adviser", [[-10, "Architect", 64], [60, "CM", 50], [118, ["Trade", "contracts"], 92]]);
  s += T(355, 288, "CM advises; owner holds the trades", { fs:11, i:true });
  return s;
});

add("pcm-08", 2, "Read percent complete against percent of fee spent. When spending runs ahead of progress, the project is over budget now — and the gap only widens.",
  "Paired bars comparing percent complete with percent of fee spent for two projects", 480, 230, function(){
  var s = "", x = 150, k = 3;
  function pair(y, name, done, spent, verdict){
    var r = T(x - 10, y + 24, name, { a:"end", fs:12, b:true });
    r += R(x, y, done * k, 20, { fill:"ink" }) + T(x + done * k + 6, y + 10, done + "% complete", { a:"start", fs:12 });
    r += R(x, y + 26, spent * k, 20) + T(x + spent * k + 6, y + 36, spent + "% of fee spent", { a:"start", fs:12 });
    r += T(x, y + 64, verdict, { a:"start", fs:12, i:true });
    return r;
  }
  s += pair(20, "Project A", 60, 45, "Ahead of plan — check the completion estimate is honest");
  s += pair(122, "Project B", 50, 75, "Significant overrun — find the cause before the next phase");
  return s;
});

/* ================= PjM ================= */
add("pjm-01", 0, "Two contracts, three parties. The architect's authority over the contractor comes only from A201, and owner–contractor communication runs through the architect.",
  "Triangle of owner, architect and contractor with the two contracts", 480, 260, function(){
  var s = "";
  s += B(180, 16, 120, 40, "Owner", { fill:"ink", b:true });
  s += B(30, 190, 130, 40, "Architect", { b:true });
  s += B(320, 190, 130, 40, "Contractor", { b:true });
  s += L(200, 56, 110, 190, { sw:3 }) + T(100, 112, ["B101"], { fs:13, b:true });
  s += L(280, 56, 370, 190, { sw:3 }) + T(386, 112, ["A101 + A201"], { fs:13, b:true });
  s += L(160, 210, 320, 210, { dash:true }) + T(240, 194, "no contract", { fs:12, i:true });
  s += T(240, 246, "authority over the contractor comes only from A201", { fs:12 });
  return s;
});

add("pjm-03", 1, "A GMP is a ceiling, not a price. Below it, savings are shared as the agreement states; above it, the contractor absorbs the overrun.",
  "Two columns comparing cost below and above a guaranteed maximum price", 480, 260, function(){
  var s = "", base = 230, gy = 70;
  s += L(30, gy, 460, gy, { dash:true, sw:2.5 }) + T(36, gy - 12, "Guaranteed maximum price", { a:"start", fs:12, b:true });
  s += R(80, 110, 110, base - 110, { fill:"ink" }) + T(135, 170, ["Cost of the", "work + fee"], { fill:PAPER, fs:12 });
  s += R(80, gy, 110, 40, { dash:true }) + T(135, gy + 20, "Savings", { fs:12, b:true });
  s += T(135, 248, "Under: savings shared", { fs:11 });
  s += R(290, 40, 110, base - 40, { fill:"ink" }) + T(345, 160, ["Cost of the", "work + fee"], { fill:PAPER, fs:12 });
  s += R(290, 40, 110, gy - 40) + T(345, 55, "Overrun", { fs:12, b:true });
  s += T(345, 248, "Over: contractor absorbs it", { fs:11 });
  s += L(30, base, 460, base, { sw:1.5 });
  return s;
});

add("pjm-04", 3, "Choosing the change instrument. Price first with a proposal request; agreement on cost and time makes a change order; disagreement with urgency makes a CCD; no cost or time makes an ASI.",
  "Flowchart of proposal request, change order, construction change directive and supplemental instructions", 480, 280, function(){
  var s = "";
  s += B(150, 12, 180, 44, ["Proposal request", "G709 — price it"], { fs:12 });
  s += L(240, 56, 240, 82, { arrow:"end" });
  s += B(150, 84, 180, 44, ["Do owner, architect and", "contractor agree on cost & time?"], { fs:11 });
  s += L(150, 106, 90, 160, { arrow:"end" }) + T(96, 128, "yes", { fs:12, i:true });
  s += L(330, 106, 390, 160, { arrow:"end" }) + T(372, 120, ["no, and the work", "can't wait"], { a:"start", fs:11, i:true });
  s += B(20, 162, 160, 56, ["Change order G701", "owner + architect", "+ contractor sign"], { fs:11, fill:"ink" });
  s += B(300, 162, 160, 56, ["Change directive G714", "owner + architect sign;", "price settled later"], { fs:11 });
  s += B(110, 234, 260, 40, ["Minor, no change to sum or time?", "Supplemental instructions G710 — architect"], { fs:11, dash:true });
  return s;
});

add("pjm-05", 1, "Estimate accuracy tightens as the design develops, so the design contingency should shrink with it.",
  "Funnel of estimate accuracy narrowing from pre-design to construction documents", 480, 230, function(){
  var s = "", rows = [["Pre-design", "cost per sf or per unit", 20, "±15–20%"], ["Schematic", "area and volume, parametric", 15, "±10–15%"], ["Design development", "assemblies / systems", 10, "±5–10%"], ["Construction documents", "quantity survey", 5, "±2–5%"]];
  rows.forEach(function(r, i){
    var y = 18 + i * 52, half = r[2] * 6.5, cx = 320;
    s += T(10, y + 12, r[0], { a:"start", fs:12, b:true }) + T(10, y + 30, r[1], { a:"start", fs:11, i:true });
    s += R(cx - half, y + 6, half * 2, 28, { fill:i === 3 ? "ink" : "paper" }) + T(cx, y + 20, r[3], { fs:12, b:true, fill:i === 3 ? PAPER : INK });
  });
  return s;
});

add("pjm-06", 1, "The review sequence. A review with no backcheck gives no assurance, so the loop closes on it.",
  "Six-step document review sequence ending in a backcheck loop", 480, 200, function(){
  var s = chain(["Self-check", "Discipline check", "Coordination / clash"], 20, 52, 10, 470, { fs:11 });
  s += P("M466 46 C478 46 478 112 466 112", { arrow:true });
  var t = ["Backcheck", "Code review", "Independent review"];
  var w = (460 - 36) / 3;
  t.forEach(function(it, i){ s += B(10 + i * (w + 18), 86, w, 52, it, { fs:11, fill:i === 0 ? "ink" : "paper", b:i === 0 }); });
  s += L(10 + 2 * (w + 18) - 2, 112, 10 + w + 18 + w + 2, 112, { arrow:"end" }) + L(10 + w + 18 - 2, 112, 10 + w + 2, 112, { arrow:"end" });
  s += T(240, 170, "Repeat at each phase deliverable, not just before issue for construction", { fs:12, i:true });
  return s;
});

add("pjm-07", 2, "The dispute ladder under A201. An initial decision and mediation come first; mediation is non-binding and a condition precedent to arbitration or litigation.",
  "Staircase from negotiation through initial decision and mediation to binding arbitration or litigation", 480, 270, function(){
  var s = "", steps = [["Negotiation", "cheapest, informal"], ["Initial decision", "the IDM — architect by default"], ["Mediation", "non-binding · condition precedent"], ["Arbitration or litigation", "binding"]];
  steps.forEach(function(st, i){
    var x = 14 + i * 100, y = 196 - i * 54, w = i === 3 ? 160 : 112;
    s += B(x, y, w, 44, i === 3 ? ["Arbitration", "or litigation"] : st[0], { fs:12, fill:i === 3 ? "ink" : "paper", b:true });
    s += T(x + 16, y + 56, st[1], { a:"start", fs:10, i:true });
  });
  s += L(24, 170, 24, 40, { arrow:"end", sw:1.5 }) + T(34, 34, "cost, time and formality rise", { a:"start", fs:11, i:true });
  return s;
});

add("pjm-08", 0, "What substantial completion starts and stops. The one-year correction period runs from substantial completion, and it is not a limit on the contractor's liability.",
  "Closeout timeline from substantial completion to final payment with the one-year correction period", 480, 240, function(){
  var s = L(20, 110, 465, 110, { arrow:"end", sw:2.5 });
  function mark(x, label, b){ return L(x, 98, x, 122, { sw:3 }) + T(x, 84, label, { fs:12, b:b }); }
  s += mark(60, ["Substantial", "completion (G704)"], true) + mark(220, ["Punch list", "complete"]) + mark(330, ["Final", "payment"], true) + mark(440, "1 year");
  s += P("M60 140 V150 H440 V140") + T(250, 164, "contractor's one-year correction period", { fs:12, b:true });
  s += T(20, 194, "At substantial completion:", { a:"start", fs:12, b:true });
  s += T(20, 214, "LDs stop · warranties start · owner takes utilities, security, insurance", { a:"start", fs:12 });
  s += T(20, 232, "retainage usually reduced · punch-list period starts", { a:"start", fs:12 });
  return s;
});

/* ================= PA ================= */
add("pa-01", 1, "Peña's matrix: the five steps run down the side, the four considerations across the top. Every cell is a question the program has to answer.",
  "Matrix of the five programming steps against function, form, economy and time", 480, 260, function(){
  var s = "", cols = ["Function", "Form", "Economy", "Time"], rows = ["1 Establish goals", "2 Collect facts", "3 Uncover concepts", "4 Determine needs", "5 State the problem"];
  var x0 = 150, cw = 80, y0 = 20, rh = 40;
  cols.forEach(function(c, i){ s += B(x0 + i * cw, y0, cw, 34, c, { fs:12, fill:"ink", b:true }); });
  rows.forEach(function(r, j){
    var y = y0 + 34 + j * rh;
    s += T(x0 - 8, y + rh / 2, r, { a:"end", fs:12, b:j === 4 });
    for(var i = 0; i < 4; i++) s += R(x0 + i * cw, y, cw, rh, { sw:1.5 });
  });
  s += T(x0 + 160, y0 + 34 + 5 * rh + 18, "people · site & quality · budget · past, present, future", { fs:11, i:true });
  return s;
});

add("pa-02", 1, "Gross area is net assignable area plus everything that serves it. Go from net to gross by dividing by efficiency; from gross to net by multiplying.",
  "Nested rectangles of net assignable area inside gross area with the efficiency arrows", 480, 250, function(){
  var s = R(20, 20, 300, 200, { sw:3 }) + T(170, 36, "Gross area — measured to the outside of exterior walls", { fs:11, b:true });
  s += B(40, 52, 120, 70, ["Exam rooms"], { fs:12 }) + B(170, 52, 130, 70, ["Offices"], { fs:12 });
  s += B(40, 132, 80, 70, ["Waiting"], { fs:12 }) + B(130, 132, 60, 70, ["Store"], { fs:11 });
  s += T(250, 150, ["corridors", "stairs, shafts", "walls, toilets"], { fs:11, i:true });
  s += T(400, 64, "Net ÷ efficiency", { fs:13, b:true }) + L(345, 80, 455, 80, { arrow:"end" }) + T(400, 98, "= gross", { fs:12 });
  s += T(400, 150, "Gross × efficiency", { fs:13, b:true }) + L(455, 166, 345, 166, { arrow:"end" }) + T(400, 184, "= net", { fs:12 });
  s += T(170, 240, "28,500 sf net ÷ 0.60 = 47,500 gsf", { fs:13, b:true });
  return s;
});

add("pa-05", 1, "Construction types run from I-A, the most fire-resistant, to V-B, the least. A is protected; B is unprotected.",
  "Ladder of construction types from I-A to V-B with materials", 480, 240, function(){
  var s = "", types = ["I-A", "I-B", "II-A", "II-B", "III-A", "III-B", "IV", "V-A", "V-B"], w = 48;
  types.forEach(function(t, i){ s += B(16 + i * (w + 3), 70, w, 40, t, { fs:13, b:true, fill:i === 0 ? "ink" : "paper" }); });
  s += L(16, 50, 470, 50, { arrow:"end" }) + T(16, 34, "more fire-resistant", { a:"start", fs:12, b:true }) + T(470, 34, "less", { a:"end", fs:12, b:true });
  function brace(x1, x2, label){ return P("M" + x1 + " 120 V130 H" + x2 + " V120") + T((x1 + x2) / 2, 150, label, { fs:11 }); }
  s += brace(16, 16 + 4 * (w + 3) - 3, ["Non-combustible", "steel, concrete, masonry"]);
  s += brace(16 + 4 * (w + 3), 16 + 6 * (w + 3) - 3, ["Non-comb. exterior,", "any interior"]);
  s += brace(16 + 6 * (w + 3), 16 + 7 * (w + 3) - 3, ["Heavy", "timber"]);
  s += brace(16 + 7 * (w + 3), 16 + 9 * (w + 3) - 3, ["Any permitted", "material"]);
  s += T(240, 210, "Occupancy group + construction type → allowable area and height", { fs:12, b:true });
  return s;
});

add("pa-07", 0, "The buildable area is what is left after setbacks and recorded easements come off. The property line sits at the edge of the right-of-way, not at the curb.",
  "Site plan showing right-of-way, property line, setbacks, easements and buildable area", 480, 290, function(){
  var s = "";
  s += R(20, 236, 440, 40, { sw:1.5 }) + T(240, 256, "Street right-of-way — roadway, sidewalk, utilities below", { fs:11 });
  s += L(20, 226, 460, 226, { sw:1.5 }) + T(456, 218, "curb", { a:"end", fs:10, i:true });
  s += R(40, 20, 400, 196, { sw:3 }) + T(240, 12, "Property line", { fs:12, b:true });
  s += R(40, 20, 400, 30, { dash:true, sw:1.5 }) + T(240, 35, "Utility easement — no building", { fs:11, i:true });
  s += R(380, 50, 60, 166, { dash:true, sw:1.5 }) + T(410, 126, ["Access", "easement"], { fs:10, i:true });
  s += R(90, 74, 270, 102, { fill:"ink" }) + T(225, 125, "Buildable area", { fill:PAPER, fs:13, b:true });
  s += L(90, 176, 90, 216, { arrow:"both", sw:1.5 }) + T(96, 196, "front setback", { a:"start", fs:10 });
  s += L(40, 125, 90, 125, { arrow:"both", sw:1.5 }) + T(64, 112, "side", { fs:10 });
  return s;
});

add("pa-08", 1, "The four treatments, from keeping the most existing fabric to building the most new.",
  "Spectrum of preservation, rehabilitation, restoration and reconstruction", 480, 190, function(){
  var s = chain(["Preservation", "Rehabilitation", "Restoration", "Reconstruction"], 60, 50, 10, 470, { fs:12, ink:[1] });
  s += L(14, 34, 466, 34, { arrow:"both", sw:1.5 });
  s += T(14, 20, "keeps the most existing fabric", { a:"start", fs:11, i:true }) + T(466, 20, "most new work", { a:"end", fs:11, i:true });
  var w = (460 - 54) / 4;
  [["repair, don't", "replace"], ["compatible new use;", "keep what's significant"], ["return to one", "chosen period"], ["re-create what", "has vanished"]].forEach(function(t, i){
    s += T(10 + i * (w + 18) + w / 2, 136, t, { fs:11 });
  });
  s += T(240, 176, "Rehabilitation is the treatment behind the 20% federal tax credit", { fs:11, b:true });
  return s;
});

/* ================= PPD ================= */
add("ppd-05", 0, "An all-air VAV system. One central air handler supplies air at a constant temperature; a terminal box in each zone varies the volume to meet that zone's thermostat.",
  "Schematic of an air handler feeding VAV boxes and zones, with return air", 480, 260, function(){
  var s = "";
  s += B(20, 90, 100, 70, ["Air handler", "fans, coils,", "filters"], { fs:11, fill:"ink" });
  s += L(0, 104, 18, 104, { arrow:"end" }) + T(4, 92, "OA", { a:"start", fs:10 });
  s += R(120, 110, 340, 22, { sw:2 }) + T(400, 121, "supply duct", { fs:10, i:true });
  [160, 270, 380].forEach(function(x, i){
    s += L(x + 20, 132, x + 20, 150);
    s += B(x, 150, 40, 26, "VAV", { fs:10, b:true });
    s += L(x + 20, 176, x + 20, 196, { arrow:"end" });
    s += R(x - 30, 198, 100, 50, { sw:1.5 }) + T(x + 20, 223, "Zone " + (i + 1), { fs:11 });
    s += '<circle cx="' + (x + 58) + '" cy="210" r="6" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.5"/>' + T(x + 58, 210, "T", { fs:8, b:true });
  });
  s += P("M440 40 H70 V88", { arrow:true, dash:true }) + T(260, 30, "return air (through the ceiling plenum)", { fs:11, i:true });
  return s;
});

add("ppd-07", 0, "The order of operations. Work from the bottom: every watt not needed costs nothing to supply, so renewables come last.",
  "Pyramid with reduce loads at the base, then passive strategies, efficient systems and renewables at the top", 480, 260, function(){
  var s = "", tiers = [["4  Renewables", "PV, solar thermal, geothermal"], ["3  Efficient systems", "equipment, heat recovery, controls"], ["2  Passive strategies", "daylight, natural ventilation, mass"], ["1  Reduce loads", "orientation, form, envelope, shading"]];
  tiers.forEach(function(t, i){
    var y = 14 + i * 58, half = 95 + i * 48;
    s += P("M" + (240 - half) + " " + (y + 54) + " L" + (240 - half + 30) + " " + y + " H" + (240 + half - 30) + " L" + (240 + half) + " " + (y + 54) + " Z", { fill:i === 3 ? "ink" : "paper" });
    s += T(240, y + 20, t[0], { fs:12, b:true, fill:i === 3 ? PAPER : INK }) + T(240, y + 38, t[1], { fs:10, fill:i === 3 ? PAPER : INK });
  });
  return s;
});

add("ppd-08", 1, "Same 10,000 sf floor, three shapes. Stretching the plan adds exterior wall — one of the biggest cost drivers — without adding a square foot.",
  "Three plans of equal area with their perimeters compared", 480, 240, function(){
  var s = "", k = 0.9;
  s += R(20, 30, 100 * k, 100 * k, { fill:"ink" }) + T(20 + 45, 140, "100 × 100 ft", { fs:11 }) + T(65, 160, "400 ft of wall", { fs:12, b:true });
  s += R(150, 48, 141 * k, 71 * k, { sw:3 }) + T(150 + 63, 140, "141 × 71 ft", { fs:11 }) + T(213, 160, "424 ft  (+6%)", { fs:12, b:true });
  s += R(300, 64, 200 * 0.8, 50 * 0.8, { sw:3 }) + T(380, 140, "200 × 50 ft", { fs:11 }) + T(380, 160, "500 ft  (+25%)", { fs:12, b:true });
  s += T(240, 200, "Perimeter-to-area, floor-to-floor height, span and repetition", { fs:12 });
  s += T(240, 220, "move cost far more than finish choices", { fs:12, b:true });
  return s;
});

/* ================= PDD ================= */
add("pdd-01", 1, "The four joints in section. Concrete and CMU shrink, so they get control joints; clay brick grows, so it gets expansion joints.",
  "Four small sections: control, construction, isolation and expansion joints", 480, 270, function(){
  var s = "";
  function slab(x, y){ return R(x, y, 200, 36, { sw:2 }); }
  s += T(20, 18, "Control joint", { a:"start", fs:13, b:true });
  s += slab(20, 28) + R(116, 28, 8, 12, { fill:"ink", sw:0 }) + P("M120 40 l-3 8 l5 8 l-4 8", { sw:1.5 }) + T(20, 80, "saw cut makes shrinkage crack here", { a:"start", fs:11, i:true });
  s += T(260, 18, "Construction joint", { a:"start", fs:13, b:true });
  s += R(260, 28, 100, 36) + R(360, 28, 100, 36) + L(340, 46, 380, 46, { sw:3 }) + T(260, 80, "where one pour stops; dowelled or keyed", { a:"start", fs:11, i:true });
  s += T(20, 120, "Isolation joint", { a:"start", fs:13, b:true });
  s += R(20, 130, 80, 36) + R(140, 130, 80, 36) + R(104, 128, 32, 64, { fill:"ink" }) + R(100, 130, 4, 36, { sw:1 }) + R(136, 130, 4, 36, { sw:1 });
  s += T(20, 206, "slab kept free of the column with filler", { a:"start", fs:11, i:true });
  s += T(260, 120, "Expansion joint", { a:"start", fs:13, b:true });
  s += R(260, 130, 92, 36) + R(368, 130, 92, 36) + R(352, 136, 16, 30, { sw:1.5 }) + R(352, 130, 16, 6, { fill:"ink", sw:0 });
  s += T(260, 186, "full-depth gap, filler and sealant;", { a:"start", fs:11, i:true }) + T(260, 204, "lets brick and the building move", { a:"start", fs:11, i:true });
  s += T(240, 250, "Shrinks (concrete, CMU) → control  ·  grows (clay brick) → expansion", { fs:12, b:true });
  return s;
});

add("pdd-03", 2, "Every section has the same three parts. Ask where an item lives: what is submitted or warranted, what is supplied, or how it is installed and checked.",
  "SectionFormat three parts with examples, and how a MasterFormat number reads", 480, 270, function(){
  var s = "";
  [["Part 1  General", "submittals · quality assurance · delivery · warranties"], ["Part 2  Products", "manufacturers · materials · mixes · fabrication"], ["Part 3  Execution", "examination · installation · field quality control · cleaning"]].forEach(function(p, i){
    var y = 14 + i * 56;
    s += B(20, y, 150, 46, p[0], { fs:12, b:true, fill:i === 1 ? "ink" : "paper" }) + T(182, y + 23, p[1], { a:"start", fs:11 });
  });
  s += T(20, 200, "Reading a section number:", { a:"start", fs:12, b:true });
  s += B(20, 214, 60, 40, "09", { fs:18, b:true, fill:"ink" }) + B(86, 214, 60, 40, "91", { fs:18, b:true }) + B(152, 214, 60, 40, "23", { fs:18, b:true });
  s += T(226, 222, "Division 09 Finishes → painting", { a:"start", fs:12 }) + T(226, 244, "→ interior painting", { a:"start", fs:12 });
  return s;
});

add("pdd-04", 0, "How a sheet number reads. The letter is the discipline; the first digit is the sheet type; the rest is the sequence.",
  "Anatomy of sheet number A-301 and the ten sheet types", 480, 250, function(){
  var s = "";
  s += B(120, 18, 60, 56, "A", { fs:30, b:true, fill:"ink" }) + T(190, 46, "-", { fs:30, b:true });
  s += B(200, 18, 60, 56, "3", { fs:30, b:true }) + B(266, 18, 90, 56, "01", { fs:30, b:true });
  s += T(150, 94, "discipline", { fs:12, i:true }) + T(230, 94, "sheet type", { fs:12, i:true }) + T(311, 94, "sequence", { fs:12, i:true });
  var types = ["0 General", "1 Plans", "2 Elevations", "3 Sections", "4 Large-scale", "5 Details", "6 Schedules", "7 User", "8 User", "9 3D"];
  types.forEach(function(t, i){
    var col = i % 5, row = Math.floor(i / 5), x = 20 + col * 90, y = 120 + row * 46;
    s += B(x, y, 84, 38, t, { fs:11, fill:i === 3 ? "ink" : "paper", b:i === 3 });
  });
  s += T(240, 230, "So A-301 is an architectural section; A-501 a detail", { fs:12, b:true });
  return s;
});

add("pdd-05", 3, "A partition is only as good as its weakest path. Stopping the wall at the ceiling leaves an open plenum above, and sound flanks straight over it.",
  "Section comparing a partition stopped at the ceiling with flanking sound, and one taken to the deck", 480, 285, function(){
  var s = "";
  function room(x, full){
    var r = R(x, 20, 200, 12, { fill:"ink", sw:0 }) + T(x + 100, 12, "structure above", { fs:10, i:true });
    r += L(x, 92, x + 200, 92, { dash:true, sw:1.5 }) + T(x + 6, 84, "ceiling", { a:"start", fs:10, i:true });
    r += R(x, 220, 200, 10, { fill:"ink", sw:0 });
    r += R(x + 92, full ? 32 : 92, 16, full ? 188 : 128, { fill:"paper", sw:2.5 });
    return r;
  }
  s += room(20, false) + room(260, true);
  s += P("M60 170 C60 60 160 60 160 170", { arrow:true, sw:2.5 }) + T(120, 248, "Stops at ceiling: sound flanks", { fs:12, b:true });
  s += P("M300 170 C300 120 340 120 346 140", { sw:2.5 }) + L(350, 120, 364, 136, { sw:3 }) + L(364, 120, 350, 136, { sw:3 });
  s += T(360, 248, "Full height, sealed: path closed", { fs:12, b:true });
  s += T(240, 276, "the four principles: mass · decoupling · cavity insulation · sealing", { fs:11, i:true });
  return s;
});

add("pdd-06", 0, "Where a rated wall loses its rating: at every joint and penetration. Each one needs its own tested system.",
  "Elevation of a fire-rated wall with head-of-wall joint, firestopped pipe, separated outlet boxes and a fire damper", 480, 280, function(){
  var s = "";
  s += R(20, 16, 440, 14, { fill:"ink", sw:0 }) + T(240, 9, "deck above", { fs:10, i:true });
  s += R(20, 250, 440, 14, { fill:"ink", sw:0 });
  s += R(40, 36, 400, 208, { sw:2.5 });
  s += R(40, 30, 400, 6, { dash:true, sw:1.5 }) + T(240, 50, "1  head-of-wall joint system", { fs:11, b:true });
  s += '<circle cx="110" cy="110" r="16" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2"/><circle cx="110" cy="110" r="24" fill="none" stroke="' + INK + '" stroke-width="2" stroke-dasharray="3 3"/>';
  s += T(110, 150, ["2  pipe through", "tested firestop"], { fs:11 });
  s += R(220, 190, 18, 24, { sw:2 }) + R(300, 190, 18, 24, { sw:1.5, dash:true });
  s += L(238, 226, 300, 226, { arrow:"both", sw:1.5 }) + T(270, 238, "≥ 24 in", { fs:10, b:true });
  s += T(270, 176, "3  boxes on opposite faces, offset", { fs:11 });
  s += R(330, 80, 90, 56, { sw:2 }) + L(330, 80, 420, 136, { sw:1.5 }) + L(420, 80, 330, 136, { sw:1.5 });
  s += T(375, 152, ["4  fire damper", "with access panel"], { fs:11 });
  return s;
});

add("pdd-07", 0, "How a detailed estimate is built up. Direct costs come first; each markup sits on top in order, and escalation runs to the midpoint of construction.",
  "Stacked column of direct costs with general conditions, overhead and profit, contingency, escalation and bonds added on top", 480, 310, function(){
  var s = "", parts = [["Direct costs", "material · labor · equipment", 96, "ink"], ["General conditions", "5–15% — time-based", 36], ["Overhead & profit", "10–20%", 36], ["Contingency", "falls as design firms up", 36], ["Escalation", "to the midpoint of construction", 36], ["Bonds & insurance", "1–2%", 36]];
  var y = 300;
  parts.forEach(function(p){
    y -= p[2] + 2;
    s += R(40, y, 150, p[2], { fill:p[3] === "ink" ? "ink" : "paper" });
    s += T(206, y + p[2] / 2 - (p[2] > 24 ? 8 : 0), p[0], { a:"start", fs:12, b:true });
    if(p[2] > 24) s += T(206, y + p[2] / 2 + 9, p[1], { a:"start", fs:11, i:true });
    else s += T(340, y + p[2] / 2, p[1], { a:"start", fs:11, i:true });
  });
  return s;
});

/* ================= CE ================= */
add("ce-01", 1, "The bidding period. Changes reach bidders only by addendum, and the last addendum goes out early enough for bidders to price it.",
  "Timeline of the bidding period from issue to award", 480, 230, function(){
  var s = L(20, 100, 465, 100, { arrow:"end", sw:2.5 });
  function mark(x, label, below, b){ return L(x, 90, x, 110, { sw:3 }) + T(x, below ? 132 : 70, label, { fs:11, b:b }); }
  s += mark(30, ["Documents", "issued"], false);
  s += mark(110, ["Pre-bid", "meeting"], true);
  s += mark(200, ["Substitution", "deadline", "~10 days before"], false);
  s += mark(290, ["Last", "addendum", "4–7 days before"], true);
  s += mark(370, ["Bid", "opening"], false, true);
  s += mark(450, ["Owner", "awards"], true, true);
  s += T(240, 196, "Low bid = base bid + accepted alternates, in the stated order", { fs:12, b:true });
  s += T(240, 216, "and the bidder must be responsive and responsible", { fs:12 });
  return s;
});

add("ce-02", 1, "Who controls what during construction. Most wrong answers move something across one of these lines.",
  "Three columns of responsibilities for owner, architect and contractor during construction", 480, 270, function(){
  var s = "", cols = [["Owner", ["stops the work", "awards the contract", "accepts non-conforming", "work"]], ["Architect", ["visits at intervals", "interprets documents", "reviews submittals", "certifies payment", "rejects non-conforming", "work · decides claims"]], ["Contractor", ["means and methods", "sequences, procedures", "jobsite safety", "subcontractors", "supervision"]]];
  cols.forEach(function(c, i){
    var x = 14 + i * 156;
    s += B(x, 14, 148, 38, c[0], { fs:14, b:true, fill:i === 1 ? "ink" : "paper" });
    s += R(x, 52, 148, 206, { sw:1.5 });
    c[1].forEach(function(l, j){ s += T(x + 10, 76 + j * 26, l, { a:"start", fs:12 }); });
  });
  return s;
});

add("ce-03", 1, "The submittal loop. The contractor reviews first and flags deviations; the architect checks only for conformance with the design concept.",
  "Flow of a submittal from subcontractor to contractor to architect and consultant and back", 480, 270, function(){
  var s = chain([["Sub or", "fabricator"], ["Contractor", "reviews & stamps"], "Architect"], 20, 54, 10, 470, { fs:11, ink:[2] });
  s += L(390, 74, 390, 104, { arrow:"both" }) + B(330, 106, 120, 40, "Consultant", { fs:12, dash:true });
  s += L(320, 74, 240, 180, { arrow:"end" });
  s += B(40, 180, 400, 74, "", {});
  ["No exceptions taken", "Make corrections noted", "Revise and resubmit", "Rejected"].forEach(function(a, i){
    s += T(60 + (i % 2) * 200, 202 + Math.floor(i / 2) * 30, "□ " + a, { a:"start", fs:12 });
  });
  s += T(150, 106, ["typical turnaround", "10–14 days"], { fs:11, i:true });
  return s;
});

add("ce-04", 3, "Why an owner can pay twice. Unpaid subcontractors have no contract with the owner, so the law gives them a lien on the property instead.",
  "Money chain from owner through contractor to subcontractors, with the lien path and the three protections", 480, 280, function(){
  var s = "";
  s += B(20, 20, 120, 44, "Owner", { b:true, fill:"ink" }) + B(180, 20, 120, 44, "Contractor", { b:true }) + B(340, 20, 120, 44, ["Subs &", "suppliers"], { fs:12, b:true });
  s += L(140, 42, 180, 42, { arrow:"end" }) + L(300, 42, 340, 42, { arrow:"end" });
  s += T(160, 80, "pays", { fs:11, i:true }) + T(320, 80, "pays?", { fs:11, i:true });
  s += B(20, 110, 120, 36, "Property", { fs:12 }) + L(80, 64, 80, 110, { sw:1.5 });
  s += P("M400 64 C400 140 260 150 142 130", { arrow:true, dash:true, sw:2.5 }) + T(300, 156, "mechanic's lien if unpaid", { fs:12, b:true });
  s += T(20, 190, "Protections:", { a:"start", fs:12, b:true });
  s += B(20, 202, 140, 52, ["Lien waivers", "with each payment"], { fs:11 }) + B(170, 202, 140, 52, ["Payment bond", "surety pays the subs"], { fs:11 }) + B(320, 202, 140, 52, ["Joint cheques", "contractor + sub"], { fs:11 });
  return s;
});

add("ce-06", 1, "Who pays to uncover or test. The contractor pays when it did something wrong or blocked observation; the owner pays when the work turns out to conform.",
  "Decision tree for who pays for uncovering and testing work", 480, 300, function(){
  var s = "";
  s += B(120, 10, 240, 46, ["Was it covered against the architect's", "specific request to see it?"], { fs:11 });
  s += L(150, 56, 90, 92, { arrow:"end" }) + T(108, 70, "yes", { fs:12, i:true });
  s += B(10, 94, 150, 50, ["Contractor pays,", "whatever is found"], { fs:12, fill:"ink" });
  s += L(330, 56, 330, 92, { arrow:"end" }) + T(344, 74, "no", { fs:12, i:true });
  s += B(220, 94, 220, 50, ["Architect asks to uncover", "or test it — does it conform?"], { fs:11 });
  s += L(270, 144, 230, 190, { arrow:"end" }) + T(232, 162, "yes", { fs:12, i:true });
  s += L(390, 144, 410, 190, { arrow:"end" }) + T(414, 162, "no", { fs:12, i:true });
  s += B(150, 192, 150, 50, ["Owner pays", "(by change order)"], { fs:12 });
  s += B(320, 192, 150, 50, ["Contractor pays", "to correct and retest"], { fs:12, fill:"ink" });
  s += T(240, 278, "The owner may also accept non-conforming work — at a reduced contract sum", { fs:11, i:true });
  return s;
});

add("ce-07", 2, "What the contractor hands over before the final Certificate for Payment. Accepting final payment then waives the contractor's claims except those already identified in writing.",
  "Checklist of final payment documents leading to the final certificate", 480, 280, function(){
  var s = "", items = ["Affidavit that payrolls and bills are paid", "Insurance certificate — 30 days' notice of cancellation", "Statement that insurance should renew", "Consent of surety, where bonded", "Lien releases or waivers (or a bond)"];
  items.forEach(function(t, i){ s += R(20, 14 + i * 34, 18, 18, { sw:2 }) + T(48, 23 + i * 34, t, { a:"start", fs:12 }); });
  s += L(240, 178, 240, 194, { arrow:"end" });
  s += B(100, 196, 280, 30, "Architect inspects and is satisfied", { fs:12 });
  s += L(240, 226, 240, 242, { arrow:"end" });
  s += B(100, 244, 280, 30, "Final Certificate for Payment", { fs:13, b:true, fill:"ink" });
  return s;
});

add("ce-08", 0, "The preconstruction conference agenda. Settle these before work starts and most later disputes about process never happen.",
  "Hub diagram of preconstruction conference topics", 480, 270, function(){
  var s = B(160, 110, 160, 50, ["Preconstruction", "conference"], { fs:13, b:true, fill:"ink" });
  var spokes = [["Communication", "& authority", 20, 14], ["Procedures", "RFIs, submittals, pay", 180, 8], ["Schedule", "long-lead items", 340, 14], ["Site logistics", "access, hours, safety", 20, 206], ["Permits &", "inspections", 180, 212], ["Quality &", "closeout", 340, 206]];
  spokes.forEach(function(p){
    s += B(p[2], p[3], 120, 48, [p[0], p[1]], { fs:11 });
    s += L(p[2] + 60, p[3] < 100 ? p[3] + 48 : p[3], 240 + (p[2] - 180) / 3, p[3] < 100 ? 110 : 160);
  });
  return s;
});
})();
