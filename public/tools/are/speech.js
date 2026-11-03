/* ARE Prep Tools — audio narration.
   1. speak(text): turns study text into words a TTS engine reads correctly
      ("B101" → "bee one oh one", "±10–15%" → "plus or minus ten to fifteen percent").
   2. chapterItems / cardItems: build the queue the narrator plays.
   3. ARE_NARRATOR: one interface over the native Android service (keeps playing with the
      screen off) or the browser's speechSynthesis (desktop testing).
   The content files are never changed; everything here is derived from them. */
(function(){
"use strict";

/* ---------- numbers ---------- */
var ONES = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve",
  "thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
var TENS = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
var SCALES = [[1e12,"trillion"],[1e9,"billion"],[1e6,"million"],[1e3,"thousand"]];

function under1000(n){
  var out = [];
  if(n >= 100){ out.push(ONES[Math.floor(n/100)] + " hundred"); n = n % 100; }
  if(n >= 20){ out.push(TENS[Math.floor(n/10)] + (n % 10 ? "-" + ONES[n % 10] : "")); }
  else if(n > 0 || !out.length) out.push(ONES[n]);
  return out.join(" ");
}
function intWords(n){
  n = Math.floor(Math.abs(n));
  if(n < 1000) return under1000(n);
  var out = [];
  for(var i=0;i<SCALES.length;i++){
    var s = SCALES[i][0];
    if(n >= s){ out.push(intWords(Math.floor(n/s)) + " " + SCALES[i][1]); n = n % s; }
  }
  if(n) out.push(under1000(n));
  return out.join(" ");
}
function digitWords(str, oh){
  return String(str).split("").map(function(d){ return d === "0" && oh ? "oh" : ONES[+d]; }).join(" ");
}
/* "4,987,500" "62.5" "8.1.3" ".5" → words */
function numWords(str){
  str = String(str).replace(/,/g, "");
  var parts = str.split(".");
  var head = parts[0] === "" ? "zero" : intWords(parseInt(parts[0], 10));
  for(var i=1;i<parts.length;i++){
    if(parts[i] === "") continue;
    // more than one dot is a clause number ("8.1.3"): read each part as a number
    head += " point " + (parts.length > 2 ? intWords(parseInt(parts[i], 10)) : digitWords(parts[i]));
  }
  return head;
}
function yearWords(y){
  var a = Math.floor(y/100), b = y % 100;
  if(b === 0) return y % 1000 === 0 ? intWords(y) : intWords(a) + " hundred";
  if(a === 20 && b < 10) return intWords(y);
  return intWords(a) + " " + (b < 10 ? "oh " + ONES[b] : intWords(b));
}
var ORD = { one:"first", two:"second", three:"third", five:"fifth", eight:"eighth", nine:"ninth", twelve:"twelfth" };
function ordWords(n){
  var w = intWords(n), m = w.match(/([a-z]+)$/), last = m[1];
  var o = ORD[last] || (/y$/.test(last) ? last.replace(/y$/, "ieth") : last + "th");
  return w.slice(0, w.length - last.length) + o;
}
var DEN = { 2:["half","halves"], 3:["third","thirds"], 4:["quarter","quarters"], 8:["eighth","eighths"], 16:["sixteenth","sixteenths"], 32:["thirty-second","thirty-seconds"] };
function fracWords(n, d){
  n = +n; d = +d;
  if(DEN[d] && n < d) return (n === 1 ? (d === 2 ? "a" : "one") : intWords(n)) + " " + DEN[d][n === 1 ? 0 : 1];
  return intWords(n) + " over " + intWords(d);
}
var UFRAC = { "½":[1,2], "¼":[1,4], "¾":[3,4], "⅓":[1,3], "⅔":[2,3], "⅛":[1,8], "⅜":[3,8], "⅝":[5,8], "⅞":[7,8] };

/* ---------- letters ---------- */
var LETTER = { A:"ay", B:"bee", C:"see", D:"dee", E:"ee", F:"ef", G:"gee", H:"aitch", I:"eye", J:"jay", K:"kay",
  L:"el", M:"em", N:"en", O:"oh", P:"pee", Q:"cue", R:"ar", S:"ess", T:"tee", U:"you", V:"vee", W:"double you",
  X:"ex", Y:"why", Z:"zee" };
function spell(s){ return s.toUpperCase().split("").map(function(c){ return LETTER[c] || c; }).join(" "); }
function spellPlural(s){ var w = spell(s); return w + (/(ess|ex|aitch)$/.test(w) ? "es" : "s"); }
var ROMAN = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10 };

/* ---------- vocabulary ---------- */
// Expanded in full: units and the terms an examiner would say out loud.
var EXPAND = {
  psf:"pounds per square foot", psi:"pounds per square inch", plf:"pounds per linear foot", pcf:"pounds per cubic foot",
  gsf:"gross square feet", GSF:"gross square feet", nsf:"net square feet", NASF:"net assignable square feet",
  rsf:"rentable square feet", usf:"usable square feet", sf:"square feet", SF:"square feet",
  cfm:"cubic feet per minute", fpm:"feet per minute", mph:"miles per hour", gpm:"gallons per minute", dB:"decibels",
  Btu:"bee tee you", kW:"kilowatts", kWh:"kilowatt hours", ksi:"kips per square inch", ft:"feet", lb:"pounds", lbs:"pounds",
  STC:"sound transmission class", IIC:"impact insulation class", NRC:"noise reduction coefficient",
  AHJ:"authority having jurisdiction", GMP:"guaranteed maximum price", SHGC:"solar heat gain coefficient",
  VT:"visible transmittance", HVAC:"aitch vack", MEP:"em ee pee",
  vs:"versus", approx:"approximately"
};
// Said as a word, not spelled.
var WORD = { LEED:"leed", WELL:"well", NCARB:"en carb", ASHRAE:"ash ray", BOMA:"bow ma", FEMA:"fee ma",
  NAAB:"nab", PERT:"pert", ANSI:"an see", CAD:"cad", BIM:"bim", NFPA:"en ef pee ay", OSHA:"oh sha",
  // Capitals used for emphasis in the text
  NOT:"not", WILL:"will", AND:"and", OR:"or", LONGEST:"longest", HIGH:"high", DOES:"does", ACT:"act",
  ALL:"all", NO:"no", ONLY:"only", NEVER:"never", MUST:"must", BEFORE:"before", AFTER:"after" };
var UNIT_AFTER_NUMBER = "psf|psi|plf|pcf|gsf|nsf|rsf|usf|sf|SF|cfm|fpm|mph|gpm|dB|Btu|kWh|kW|ksi|ft|lbs|lb|hrs|hr|min|mins|sec|yd|mm|cm|kips|kip";
var UNIT_SPOKEN = { hr:"hour", hrs:"hours", min:"minutes", mins:"minutes", sec:"seconds", yd:"yards", mm:"millimetres",
  cm:"centimetres", kip:"kip", kips:"kips" };
var SUB = { "ₜ":"t","ₒ":"o","ₐ":"a","ₗ":"l","ₑ":"e","ₓ":"x","ₙ":"n","ᵢ":"i","₁":"1","₂":"2","₃":"3","₀":"0" };

/* ---------- the rules, in order ---------- */
var RULES = [];
function rule(re, to){ RULES.push([re, to]); }
var N = "\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)*|\\d+(?:\\.\\d+)*";   // a number as written
var FR = "[½¼¾⅓⅔⅛⅜⅝⅞]";

// markup and odd characters
rule(/\*\*([^*]+)\*\*/g, "$1");
rule(/\*([^*]+)\*/g, "$1");
rule(/[*_#`]/g, "");
rule(/([ₜₒₐₗₑₓₙᵢ₀-₃]+)/g, function(m){ var s = m.split("").map(function(c){ return SUB[c]; }).join(""); return " " + (s === "total" ? "total" : s); });
rule(/[“”]/g, '"'); rule(/[‘’]/g, "'");
rule(/…/g, ", ");
rule(/\s*—\s*/g, ", ");
rule(/\s*→\s*/g, " to ");
rule(/([A-Za-z])\s*[–-]\s*(?=[A-Za-z])/g, function(m, l){ return m.indexOf("–") >= 0 ? l + " " : m; });
rule(/\s+\/\s+/g, " over ");
rule(/([a-z])\/(?=\d)/g, "$1 over ");
rule(/\bR-(?=[a-z])/g, "R ");
rule(/\bvoice\/alarm\b/g, "voice alarm");
rule(/\bgo\/no-go\b/gi, "go or no go");
rule(/\band\/or\b/g, "and or");
rule(/\b([A-Za-z]{2,})\/([A-Za-z]{2,})\b/g, "$1 or $2");
rule(/\be\.g\.,?/gi, "for example,"); rule(/\bi\.e\.,?/gi, "that is,"); rule(/\betc\./gi, "and so on");
rule(/\bNo\.\s*(\d)/g, "number $1");
rule(/\bNo\.(?=\s|$)/g, "No,");
rule(/\bapprox\.?(?=\s)/gi, "approximately");
rule(/\bvs\.?(?=\s)/g, "versus");

// clause references: §2.2, §§ 4.1–4.3
rule(/§§\s*/g, "sections ");
rule(/§\s*/g, "section ");

// fractions
rule(new RegExp("(\\d+)(" + FR + ")", "g"), function(m, a, f){ return intWords(+a) + " and " + fracWords(UFRAC[f][0], UFRAC[f][1]); });
rule(new RegExp(FR, "g"), function(f){ return fracWords(UFRAC[f][0], UFRAC[f][1]); });
rule(/\b(\d+)-(\d+)\/(\d+)(?=\D|$)/g, function(m, a, n, d){ return intWords(+a) + " and " + fracWords(n, d); });
rule(/\b(\d+)\/(\d+)(?![\d\/])/g, function(m, n, d){
  if(DEN[+d] && +n < +d) return fracWords(n, d);
  return numWords(n) + " over " + numWords(d);
});
rule(/\b(\d+)\/([A-Za-z])/g, function(m, n, x){ return intWords(+n) + " over " + x; });

// feet and inches: 1'-0"  3/4"  16–18″
rule(/(\d+)['′]\s*-\s*0["″]/g, function(m, f){ return f + (f === "1" ? " foot" : " feet"); });
rule(/(\d+)['′]\s*-\s*(\d+)["″]/g, function(m, f, i){ return f + (f === "1" ? " foot " : " feet ") + i + (i === "1" ? " inch" : " inches"); });
rule(/(\d+|half|quarter|quarters|eighth|eighths|sixteenths?)\s?["″](?=[\s,.;:)\-]|$)/g, function(m, v){
  if(/^\D/.test(v)) return v.replace(/^quarters$/, "quarter") + " inch";
  return v + (v === "1" ? " inch" : " inches"); });
rule(/(\d+)\s?['′](?=[\s,.;:)\-]|$)/g, function(m, v){ return v + (v === "1" ? " foot" : " feet"); });

// ratios: slopes "in", scales and other ratios "to"
rule(/\b(\d+):(\d+)\b/g, function(m, a, b){
  var slope = b === "12" || (a === "1" && +b <= 50);
  return intWords(+a) + (slope ? " in " : " to ") + intWords(+b);
});

// money
rule(new RegExp("\\$(" + N + ")(\\s*(?:million|billion|thousand|[kKMB])\\b)?", "g"), function(m, n, sc){
  var s = (sc || "").trim(); s = { k:" thousand", K:" thousand", M:" million", B:" billion" }[s] || (s ? " " + s : "");
  return numWords(n) + s + " dollars";
});

// plus-or-minus, ranges, percent, degrees
rule(/±\s*/g, "plus or minus ");
rule(/(\d)\s*[–-]\s*(?=\d)/g, "$1 to ");          // 10–15, 16-18 (digit to digit only)
rule(/(\d)\s?[–-](?=(?:plus or minus )?\d)/g, "$1 to ");
rule(/\s*%/g, " percent");
rule(/\s?°\s?F\b/g, " degrees Fahrenheit");
rule(/\s?°\s?C\b/g, " degrees Celsius");
rule(/\s?°\s?N\b/g, " degrees north"); rule(/\s?°\s?S\b/g, " degrees south");
rule(/\s?°/g, " degrees");
rule(/\b(\d+)\s?[NS]\s+latitude\b/g, function(m, n){ return n + " degrees " + (/N/.test(m) ? "north" : "south") + " latitude"; });

// arithmetic
rule(/\s*÷\s*/g, " divided by ");
rule(/\s*×\s*/g, " times ");
rule(/(\d)\s?x\s?(\d)/g, "$1 by $2");
rule(/\s*−\s*/g, " minus ");
rule(/(\d)\s+-\s+(?=\d)/g, "$1 minus ");
rule(/\s+-\s+/g, ", ");
rule(/\s+\+\s+/g, " plus ");
rule(/\s+=\s+/g, " equals ");
rule(/\s*≈\s*/g, " is about ");
rule(/\s*≤\s*/g, " at most "); rule(/\s*≥\s*/g, " at least ");
rule(/\s*<\s*(?=\d)/g, " less than "); rule(/\s*>\s*(?=\d)/g, " more than ");
rule(/\bCC&Rs\b/g, "see see and ars"); rule(/\bCC&R\b/g, "see see and ar"); rule(/\bO&M\b/g, "oh and em");
rule(/\bP&L\b/g, "pee and el");
rule(/&/g, " and ");

// construction types and occupancy groups
rule(/\bType\s+(IV|V|I{1,3})-(HT|[A-C])\b/g, function(m, r, l){ return "type " + intWords(ROMAN[r]) + " " + (l === "HT" ? "heavy timber" : spell(l)); });
rule(/\b(Types?|Phase|Title|Class|Tier|Level|Category|Part|Chapter|Volume)\s+(IV|V?I{0,3}|IX|X)\b(?=[^-]|$)/g, function(m, w, r){
  return ROMAN[r] ? w.toLowerCase() + " " + intWords(ROMAN[r]) : m; });
rule(/\b(II|III|IV|VI|VII|VIII|IX)\b/g, function(r){ return intWords(ROMAN[r]); });
rule(/\b(Groups?|[Oo]ccupanc(?:y|ies))\s+([A-Z])(?:-(\d))?\b/g, function(m, w, l, d){ return w + " " + spell(l) + (d ? " " + intWords(+d) : ""); });
rule(/\b([A-HJ-Z]|I)-(\d)\b(?![\d.])/g, function(m, l, d){ return spell(l) + " " + intWords(+d); });   // R-2, I-2, S-1
rule(/\b([B-HJ-Z]|A(?=,))\b(?=,| (?:and|or) [A-Z]\b| occupanc)/g, function(l){ return spell(l); });
// R-values: R-13, R-0.45, R-19.9
rule(new RegExp("\\bR-(" + N + ")", "g"), function(m, n){ return "ar " + numWords(n); });
rule(/\bU-(?=value|factor)/g, "you ");

// document and sheet codes: B101, A201, G704, A-301, E84, A36
rule(/\b([A-Z])-?(\d{3,4})(\.\d+)?\b/g, function(m, l, d, x){ return spell(l) + " " + digitWords(d, true) + (x ? " point " + digitWords(x.slice(1)) : ""); });
rule(/\b([A-Z])(\d{1,2})\b/g, function(m, l, d){ return spell(l) + " " + intWords(+d); });

// units after numbers, then on their own
rule(new RegExp("(" + N + "|half|quarter|quarters|thirds?|eighths?)(-|\\s)?(" + UNIT_AFTER_NUMBER + ")\\b", "g"), function(m, n, sep, u){
  var word = UNIT_SPOKEN[u] || EXPAND[u];
  if(u === "hr") word = (/\D/.test(n.replace(/,/g, "")) && !/\./.test(n)) || +n <= 1 ? "hour" : "hours";
  if(u === "ft" && n === "1") word = "foot";
  if(u === "lb" && n === "1") word = "pound";
  return n + " " + word;
});
rule(/\b(psf|psi|plf|pcf|gsf|GSF|nsf|NASF|rsf|usf|sf|SF|cfm|fpm|gpm|STC|IIC|NRC|AHJ|GMP|SHGC|VT|HVAC|MEP)(s?)\b/g, function(m, u, s){
  return EXPAND[u] + (s && !/s$/.test(EXPAND[u]) ? "s" : ""); });

// hyphenated number adjectives: 2-hour, 36-inch
rule(/(\d|half|quarter)-(?=[a-z])/g, "$1 ");

// ordinals, years, other numbers
rule(/\b(\d+)(st|nd|rd|th)\b/g, function(m, n){ return ordWords(+n); });
rule(/\b(1\d{3}|20\d\d)(s?)\b(?![,.]\d)/g, function(m, y, s){ var w = yearWords(+y); return s ? w.replace(/y$/, "ie") + "s" : w; });
rule(new RegExp("(^|[^\\w.])(" + N + "|\\.\\d+)(?![\\w])", "g"), function(m, pre, n){
  return pre + numWords(n.replace(/\.$/, "")) + (/\.$/.test(n) ? "." : ""); });
rule(/(\d+)/g, function(m, n){ return " " + numWords(n) + " "; });

// abbreviations and capitals
rule(/\b([A-Z][A-Za-z]*[A-Z])\b/g, function(w){
  if(WORD[w]) return WORD[w];
  if(EXPAND[w]) return EXPAND[w];
  var m = w.match(/^([A-Z]{2,})s$/); if(m) return WORD[m[1]] ? WORD[m[1]] + "s" : spellPlural(m[1]);
  if(/^[A-Z]+$/.test(w)) return spell(w);
  return w;
});
rule(/\b([A-Z]{2,})s\b/g, function(m, w){ return spellPlural(w); });

// tidy
rule(/\s+([,.;:!?])/g, "$1");
rule(/,\s*,/g, ",");
rule(/\(\s*/g, "("); rule(/\s*\)/g, ")");
rule(/\s{2,}/g, " ");

function speak(text){
  var s = " " + String(text == null ? "" : text) + " ";
  for(var i=0;i<RULES.length;i++) s = s.replace(RULES[i][0], RULES[i][1]);
  return s.trim();
}

/* ---------- what gets read ---------- */
var MAX = 3500;   // under Android's TextToSpeech input limit
function push(list, text, pause, g, role, label){
  var t = speak(text);
  if(!t) return;
  while(t.length > MAX){
    var cut = t.lastIndexOf(". ", MAX); if(cut < 200) cut = t.lastIndexOf(" ", MAX);
    list.push({ text:t.slice(0, cut + 1), pause:150, g:g, role:role, label:label });
    t = t.slice(cut + 1).trim();
  }
  list.push({ text:t, pause:pause, g:g, role:role, label:label });
}
function chapterItems(topic){
  var out = [], blocks = topic.read || [];
  blocks.forEach(function(b, g){
    var label = "Page " + (g+1) + " of " + blocks.length;
    if(g === 0) push(out, topic.title + ".", 900, g, "title", label);
    if(b.h && !(g === 0 && b.h.trim().toLowerCase() === String(topic.title).trim().toLowerCase())) push(out, b.h + ".", 650, g, "h", label);
    (b.p||[]).forEach(function(x){ push(out, x, 450, g, "p", label); });
    (b.ul||[]).forEach(function(x){ push(out, x, 350, g, "li", label); });
    (b.ol||[]).forEach(function(x, k){ push(out, intWords(k+1) + ". " + x, 350, g, "li", label); });
    if(b.table) push(out, "There is a table here. It is on screen.", 450, g, "table", label);
    (b.p2||[]).forEach(function(x){ push(out, x, 450, g, "p", label); });
    if(b.note) push(out, (b.noteTitle || "Exam tip") + ". " + b.note, 450, g, "note", label);
    if(out.length) out[out.length-1].pause = g === blocks.length - 1 ? 0 : 1100;
  });
  return out;
}
/* cards: [{q,a}]; gap = think time in ms */
function cardItems(cards, gap){
  var out = [];
  cards.forEach(function(c, g){
    var label = "Card " + (g+1) + " of " + cards.length;
    push(out, c.q, gap, g, "q", label);
    push(out, c.a, g === cards.length - 1 ? 0 : 1800, g, "a", label);
  });
  return out;
}

/* ---------- playback engines ---------- */
var listeners = [];
function emit(ev){ listeners.forEach(function(f){ try{ f(ev); }catch(e){} }); }

var Cap = window.Capacitor;
var hasNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform() && Cap.nativePromise
  && (Cap.PluginHeaders || []).some(function(h){ return h.name === "Narrator"; }));

var native = {
  kind:"native",
  play:function(o){ return Cap.nativePromise("Narrator", "speak", o); },
  pause:function(){ return Cap.nativePromise("Narrator", "pause", {}); },
  resume:function(){ return Cap.nativePromise("Narrator", "resume", {}); },
  stop:function(){ return Cap.nativePromise("Narrator", "stop", {}); },
  seek:function(i){ return Cap.nativePromise("Narrator", "seek", { index:i }); },
  setRate:function(r){ return Cap.nativePromise("Narrator", "setRate", { rate:r }); },
  state:function(){ return Cap.nativePromise("Narrator", "getState", {}); },
  check:function(){ return Cap.nativePromise("Narrator", "check", {}); }
};
if(hasNative){
  try{ Cap.addListener("Narrator", "progress", function(d){ if(d) emit(d); }); }catch(e){ hasNative = false; }
}

/* Browser fallback: same events, driven from JS. Stops when the page sleeps. */
var web = (function(){
  var ss = window.speechSynthesis, S = { state:"stopped", index:0, session:"", count:0, rate:1 }, items = [], gen = 0, timer = null;
  function snap(){ return { state:S.state, index:S.index, session:S.session, count:items.length, rate:S.rate }; }
  function playFrom(i){
    gen++; var my = gen; clearTimeout(timer); ss.cancel();
    if(i >= items.length){ S.state = "done"; emit(snap()); return; }
    S.index = i; S.state = "playing"; emit(snap());
    var u = new SpeechSynthesisUtterance(items[i].text); u.rate = S.rate; u.lang = "en-US";
    u.onend = function(){ if(my !== gen) return; timer = setTimeout(function(){ if(my === gen) playFrom(i + 1); }, items[i].pause || 0); };
    u.onerror = u.onend;
    ss.speak(u);
  }
  return {
    kind:"web",
    play:function(o){ items = o.items; S.session = o.session; S.rate = o.rate || 1; playFrom(o.start || 0); return Promise.resolve(snap()); },
    pause:function(){ gen++; clearTimeout(timer); ss.cancel(); if(S.state === "playing"){ S.state = "paused"; emit(snap()); } return Promise.resolve(snap()); },
    resume:function(){ if(S.state === "paused") playFrom(S.index); return Promise.resolve(snap()); },
    stop:function(){ gen++; clearTimeout(timer); ss.cancel(); S.state = "stopped"; emit(snap()); return Promise.resolve(snap()); },
    seek:function(i){ i = Math.max(0, Math.min(items.length - 1, i)); if(S.state === "playing") playFrom(i); else { S.index = i; emit(snap()); } return Promise.resolve(snap()); },
    setRate:function(r){ S.rate = r; if(S.state === "playing") playFrom(S.index); return Promise.resolve(snap()); },
    state:function(){ return Promise.resolve(snap()); },
    check:function(){ return Promise.resolve({ ok:true }); }
  };
})();

var engine = hasNative ? native : (window.speechSynthesis && window.SpeechSynthesisUtterance ? web : null);

window.ARE_SPEECH = { speak:speak, chapterItems:chapterItems, cardItems:cardItems, numWords:numWords, rules:RULES.length };
window.ARE_NARRATOR = {
  engine: engine ? engine.kind : "none",
  available: !!engine,
  on: function(f){ listeners.push(f); },
  play: function(o){ return engine.play(o); },
  pause: function(){ return engine.pause(); },
  resume: function(){ return engine.resume(); },
  stop: function(){ return engine.stop(); },
  seek: function(i){ return engine.seek(i); },
  setRate: function(r){ return engine.setRate(r); },
  state: function(){ return engine ? engine.state() : Promise.resolve({ state:"stopped" }); },
  check: function(){ return engine ? engine.check() : Promise.resolve({ ok:false, reason:"none" }); }
};
})();
