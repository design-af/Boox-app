/* Additional hot-spot items. Each SVG carries clickable [data-zone] groups. */
(function(){
function add(div, items){ var d = window.ARE_DATA[div]; if(d) d.exam = (d.exam||[]).concat(items); }

add("pa", [{
t:"pa-03", k:"hot",
q:"Click the location on this site where a building should NOT be placed.",
svg:'<svg viewBox="0 0 540 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Site plan with four candidate building locations: a south slope, a valley bottom, a wetland and a level upper terrace">'
+'<rect x="10" y="10" width="520" height="310" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>'
+'<path d="M 10 70 Q 140 56 270 76 T 530 64" fill="none" stroke="var(--ink)" stroke-width="1.4"/>'
+'<path d="M 10 110 Q 140 96 270 120 T 530 104" fill="none" stroke="var(--ink)" stroke-width="1.4"/>'
+'<path d="M 10 160 Q 140 150 270 184 T 530 154" fill="none" stroke="var(--ink)" stroke-width="1.4"/>'
+'<path d="M 10 230 Q 140 226 270 256 T 530 228" fill="none" stroke="var(--ink)" stroke-width="1.4"/>'
+'<text x="18" y="66" font-size="11" font-family="sans-serif" fill="var(--ink-2)">140</text>'
+'<text x="18" y="156" font-size="11" font-family="sans-serif" fill="var(--ink-2)">120</text>'
+'<text x="18" y="226" font-size="11" font-family="sans-serif" fill="var(--ink-2)">100</text>'
+'<ellipse cx="420" cy="268" rx="78" ry="34" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4"/>'
+'<text x="420" y="308" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink-2)">wetland</text>'
+'<g data-zone="hA"><rect x="52" y="24" width="96" height="40" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="100" y="42" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">A</text>'
+'<text x="100" y="57" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">upper terrace</text></g>'
+'<g data-zone="hB"><rect x="190" y="118" width="96" height="40" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="238" y="136" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">B</text>'
+'<text x="238" y="151" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">south slope</text></g>'
+'<g data-zone="hC"><rect x="190" y="238" width="96" height="40" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="238" y="256" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">C</text>'
+'<text x="238" y="271" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">valley bottom</text></g>'
+'<g data-zone="hD"><rect x="372" y="246" width="96" height="40" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="420" y="264" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">D</text>'
+'<text x="420" y="279" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">in the wetland</text></g>'
+'</svg>',
a:"hD",
why:"All four have drawbacks, but only D is close to prohibited. Disturbing a federally regulated wetland requires a permit with mitigation, monitoring and long delay, and on a site with unconstrained alternatives the cost is never justified. C sits in a frost pocket where cold air pools and drainage collects — poor, but buildable. B is the preferred orientation in the northern hemisphere, and A is level ground."
}]);

add("ppd", [{
t:"ppd-03", k:"hot",
q:"Click the dimension in this accessible toilet room that does not comply.",
svg:'<svg viewBox="0 0 540 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Accessible toilet room elevation with four labelled dimensions to evaluate">'
+'<line x1="30" y1="250" x2="510" y2="250" stroke="var(--ink)" stroke-width="3"/>'
+'<line x1="30" y1="30" x2="30" y2="250" stroke="var(--ink)" stroke-width="3"/>'
+'<rect x="86" y="196" width="46" height="54" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="82" y="178" width="54" height="18" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>'
+'<line x1="40" y1="160" x2="160" y2="160" stroke="var(--ink)" stroke-width="4"/>'
+'<rect x="330" y="150" width="120" height="12" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="336" y="162" width="108" height="44" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4"/>'
+'<g data-zone="pA"><rect x="36" y="262" width="118" height="30" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="95" y="282" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink)">A · centreline 17″</text></g>'
+'<g data-zone="pB"><rect x="170" y="140" width="128" height="30" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="234" y="160" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink)">B · grab bar 35″</text></g>'
+'<g data-zone="pC"><rect x="330" y="104" width="128" height="30" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="394" y="124" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink)">C · lav rim 36″</text></g>'
+'<g data-zone="pD"><rect x="330" y="216" width="128" height="30" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="394" y="236" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink)">D · knee 27″</text></g>'
+'</svg>',
a:"pC",
why:"An accessible lavatory rim or counter surface may be no more than 34 inches above the floor; 36 inches is the standard non-accessible counter height and fails. The water closet centreline at 17 inches sits inside the 16–18 inch range, the grab bar at 35 inches is inside 33–36, and 27 inches of knee clearance is exactly the minimum."
}]);

add("pdd", [{
t:"pdd-02", k:"hot",
q:"Click the layer of this cavity wall where the air barrier should be located.",
svg:'<svg viewBox="0 0 540 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cavity wall plan section with four candidate layers for the air barrier">'
+'<text x="30" y="26" font-size="13" font-family="sans-serif" fill="var(--ink-2)">exterior</text>'
+'<text x="440" y="26" font-size="13" font-family="sans-serif" fill="var(--ink-2)">interior</text>'
+'<rect x="40" y="40" width="54" height="150" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="94" y="40" width="46" height="150" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 4"/>'
+'<rect x="140" y="40" width="30" height="150" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="170" y="40" width="24" height="150" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="194" y="40" width="150" height="150" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>'
+'<rect x="194" y="40" width="12" height="150" fill="var(--ink)"/>'
+'<rect x="332" y="40" width="12" height="150" fill="var(--ink)"/>'
+'<rect x="344" y="40" width="26" height="150" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>'
+'<g data-zone="wA"><rect x="30" y="200" width="76" height="56" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="68" y="222" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">A</text>'
+'<text x="68" y="240" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">brick face</text></g>'
+'<g data-zone="wB"><rect x="112" y="200" width="76" height="56" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="150" y="222" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">B</text>'
+'<text x="150" y="240" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">cavity</text></g>'
+'<g data-zone="wC"><rect x="194" y="200" width="104" height="56" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="246" y="222" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">C</text>'
+'<text x="246" y="240" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">outboard of sheathing</text></g>'
+'<g data-zone="wD"><rect x="320" y="200" width="104" height="56" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
+'<text x="372" y="222" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">D</text>'
+'<text x="372" y="240" text-anchor="middle" font-size="11" font-family="sans-serif" fill="var(--ink)">interior gypsum face</text></g>'
+'<text x="270" y="286" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink-2)">brick · cavity · sheathing · studs with batt · gypsum</text>'
+'</svg>',
a:"wC",
why:"The air barrier belongs on the exterior face of the sheathing, where it is continuous, supported against wind pressure in both directions, and can be lapped into the flashing and the window perimeter seals. The brick face is a drainage surface with hundreds of joints, the cavity is an air space rather than a plane, and an interior-face barrier is punctured by every outlet box and partition intersection."
}]);
})();
