/* Case studies for PPD, PDD and CE, including graphic resources and hot-spot items. */

window.ARE_DATA.ppd.cases = [{
id: "ppd-cs1", title: "Kestrel Hall — egress and code review", mins: 40,
scenario: "Kestrel Hall is a proposed two-storey community building. The architect has issued a schematic plan of the upper floor for code review. Using the plan, the code data and the occupancy schedule, assess compliance and advise on the changes needed before design development.",
docs: [
  { id:"d1", title:"Upper floor plan — schematic",
    blocks:[
      { svg:'<svg viewBox="0 0 660 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Schematic upper floor plan showing two exit stairs, a corridor and four rooms">'
        +'<rect x="30" y="30" width="600" height="340" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>'
        +'<rect x="30" y="180" width="600" height="56" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="330" y="214" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">CORRIDOR  —  6′-0″ clear</text>'
        +'<rect x="30" y="30" width="250" height="150" fill="none" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="155" y="100" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">ASSEMBLY HALL</text>'
        +'<text x="155" y="122" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">3,150 sf net, tables and chairs</text>'
        +'<rect x="280" y="30" width="180" height="150" fill="none" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="370" y="100" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">OFFICES</text>'
        +'<text x="370" y="122" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">2,700 gsf</text>'
        +'<rect x="460" y="30" width="170" height="150" fill="none" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="545" y="100" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">CLASSROOMS</text>'
        +'<text x="545" y="122" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">1,600 sf net</text>'
        +'<rect x="30" y="236" width="330" height="134" fill="none" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="195" y="300" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">STORAGE &amp; MECHANICAL</text>'
        +'<text x="195" y="322" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">2,400 gsf</text>'
        +'<rect x="30" y="30" width="56" height="56" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2.5"/>'
        +'<text x="58" y="64" text-anchor="middle" font-size="16" font-family="sans-serif" font-weight="bold" fill="var(--ink)">S1</text>'
        +'<rect x="104" y="30" width="56" height="56" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2.5"/>'
        +'<text x="132" y="64" text-anchor="middle" font-size="16" font-family="sans-serif" font-weight="bold" fill="var(--ink)">S2</text>'
        +'<rect x="360" y="236" width="270" height="134" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="7 5"/>'
        +'<text x="495" y="295" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">DEAD-END CORRIDOR</text>'
        +'<text x="495" y="317" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">42′-0″ beyond last exit access</text>'
        +'<line x1="30" y1="395" x2="630" y2="395" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<text x="330" y="412" text-anchor="middle" font-size="13" font-family="sans-serif" fill="var(--ink-2)">overall 200′-0″</text>'
        +'</svg>',
        caption:"Upper floor, schematic. Both exit stairs S1 and S2 are grouped at the north-west corner." }
    ]},
  { id:"d2", title:"Code data",
    blocks:[
      { table:{ head:["Item","Value"], rows:[
        ["Occupancy groups","A-2 (assembly hall), B (offices), E (classrooms), S-1 (storage)"],
        ["Construction type","Type II-B"],
        ["Sprinklers","NOT provided in the current scheme"],
        ["Upper floor overall dimensions","200 ft × 110 ft"],
        ["Corridor clear width as drawn","6 ft 0 in"],
        ["Dead-end corridor as drawn","42 ft"],
        ["Assembly hall furnishings","Tables and chairs — unconcentrated"]
      ]}},
      { note:"Occupant load factors in force: assembly unconcentrated 15 net; business 150 gross; educational classroom 20 net; storage 300 gross.", noteTitle:"Factors" }
    ]},
  { id:"d3", title:"Egress requirements in force",
    blocks:[
      { table:{ head:["Requirement","Unsprinklered","Sprinklered"], rows:[
        ["Travel distance, Group A and E","200 ft","250 ft"],
        ["Travel distance, Group B","200 ft","300 ft"],
        ["Dead-end corridor","20 ft","50 ft (B, F, M, R-2, S)"],
        ["Exit separation","1/2 diagonal","1/3 diagonal"],
        ["Egress width — stairs","0.3 in/occupant","0.3 in/occupant (0.2 with voice/alarm)"],
        ["Egress width — level components","0.2 in/occupant","0.2 in/occupant (0.15 with voice/alarm)"]
      ]}}
    ]}
],
questions: [
  { t:"ppd-01", k:"num", q:"Calculate the occupant load of the assembly hall. Enter the number of occupants, rounded up.",
    a:210, tol:0.01,
    why:"Assembly with tables and chairs is unconcentrated, at 15 square feet net per occupant: 3,150 ÷ 15 = 210 occupants. Had it been chairs only, the concentrated factor of 7 net would give 450 — which would change the exit count, the egress width and the panic hardware requirement." },

  { t:"ppd-01", k:"num", q:"Calculate the total occupant load of the upper floor using all four spaces. Enter the number of occupants.",
    a:326, tol:0.01,
    why:"Assembly 3,150 ÷ 15 = 210. Offices 2,700 ÷ 150 = 18. Classrooms 1,600 ÷ 20 = 80. Storage 2,400 ÷ 300 = 8. Total = 326 occupants. Note that business and storage use gross factors while assembly and educational classroom use net — mixing them up is the commonest error in this calculation." },

  { t:"ppd-01", q:"How many exits does the upper floor require?",
    c:["One","Two","Three","Four"],
    a:1, why:"Two exits serve occupant loads from 1 to 500, three serve 501 to 1,000, and four are required above 1,000. At 326 occupants, two exits are required — and two are drawn. The problem is not how many there are but where they are." },

  { t:"ppd-01", k:"hot", q:"Click the element of the plan that creates the most serious egress violation.",
    svg:'<svg viewBox="0 0 660 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Floor plan with four clickable zones">'
      +'<rect x="30" y="30" width="600" height="340" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/>'
      +'<rect x="30" y="180" width="600" height="56" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.5"/>'
      +'<text x="330" y="214" text-anchor="middle" font-size="15" font-family="sans-serif" fill="var(--ink)">CORRIDOR 6′-0″</text>'
      +'<g data-zone="zA" style="cursor:pointer">'
      +'<rect x="34" y="34" width="130" height="60" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
      +'<text x="99" y="60" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="var(--ink)">A</text>'
      +'<text x="99" y="80" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">S1 + S2 together</text></g>'
      +'<g data-zone="zB" style="cursor:pointer">'
      +'<rect x="280" y="34" width="170" height="60" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
      +'<text x="365" y="60" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="var(--ink)">B</text>'
      +'<text x="365" y="80" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">Office block</text></g>'
      +'<g data-zone="zC" style="cursor:pointer">'
      +'<rect x="360" y="250" width="260" height="60" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
      +'<text x="490" y="276" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="var(--ink)">C</text>'
      +'<text x="490" y="296" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">42′ dead-end corridor</text></g>'
      +'<g data-zone="zD" style="cursor:pointer">'
      +'<rect x="34" y="250" width="260" height="60" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5" stroke-dasharray="6 4"/>'
      +'<text x="164" y="276" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="var(--ink)">D</text>'
      +'<text x="164" y="296" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">Storage &amp; mechanical</text></g>'
      +'</svg>',
    a:"zA",
    why:"Both stairs sit together at the north-west corner. The floor is 200 ft by 110 ft, giving a diagonal of √(200²+110²) ≈ 228 ft. Unsprinklered, the exits must be separated by at least half that — 114 ft. Grouped in one corner they are perhaps 20 ft apart, so a single fire can block both. The 42 ft dead end also fails the 20 ft unsprinklered limit, but a dead end traps a few people while co-located exits compromise the entire floor." },

  { t:"ppd-01", k:"num", q:"Calculate the minimum exit separation required for this unsprinklered floor, in feet. Round to the nearest foot.",
    a:114, tol:0.02,
    why:"The diagonal of the 200 ft by 110 ft floor is √(40,000 + 12,100) = √52,100 ≈ 228 ft. Unsprinklered, exits must be at least one half the diagonal apart: 228 ÷ 2 = 114 ft. Sprinklering would reduce the requirement to one third, or 76 ft — still far more than the current arrangement provides." },

  { t:"ppd-01", k:"num", q:"What minimum total stair width does the floor's occupant load require? Enter the answer in inches.",
    a:97.8, tol:0.02,
    why:"Stairways use 0.3 inches per occupant: 326 × 0.3 = 97.8 inches total across both stairs, or about 49 inches each. That exceeds the 44-inch minimum, so the calculated width governs here rather than the minimum." },

  { t:"ppd-01", q:"The 42 ft dead-end corridor is drawn in an unsprinklered building. What applies?",
    c:["It complies — the limit is 50 ft","It violates the 20 ft unsprinklered dead-end limit","Dead-end corridors are prohibited in Group A","It complies if the corridor is 6 ft wide"],
    a:1, why:"The general dead-end limit is 20 ft. The 50 ft allowance applies only to sprinklered Group B, F, M, R-2 and S occupancies. This building is unsprinklered and contains A and E occupancies, so 42 ft fails by a wide margin." },

  { t:"ppd-01", k:"multi", q:"Which changes are required to bring the scheme into compliance? Select all that apply.",
    c:["Relocate one stair to the opposite end of the floor","Provide an automatic sprinkler system throughout","Shorten or eliminate the 42 ft dead end","Widen the corridor to 8 ft","Reclassify the assembly hall as Group B"],
    a:[0,2],
    why:"Both violations need a physical fix. Relocating a stair cures the separation failure. Shortening the dead end cures the other. Sprinklering is a useful option but cures neither on its own: it cuts the separation requirement to one third of the diagonal, about 76 ft, which stairs roughly 20 ft apart still fail, and the 50 ft dead-end allowance applies only to sprinklered B, F, M, R-2 and S, not to a floor with A and E occupancies. A 6 ft corridor already exceeds the minimum and the calculated width, and reclassifying a genuine assembly use is not available as a remedy." },

  { t:"ppd-02", q:"The design team proposes sprinklering the building. Beyond egress, what is the most significant additional benefit?",
    c:["Reduced corridor width requirements","Increased allowable area and height, and reduced fire-resistance requirements in many cases","Elimination of the need for exit signage","Reduced occupant load calculations"],
    a:1, why:"Sprinklers commonly double allowable area for multi-storey buildings and triple it for single-storey, add a storey and 20 ft of height, and reduce ratings in many conditions — on top of the egress relaxations. It is the single most powerful lever in the code, which is why it is so often the answer." }
]
}];

window.ARE_DATA.pdd.cases = [{
id: "pdd-cs1", title: "Thorne Building — wall assembly and document review", mins: 35,
scenario: "The Thorne Building is a four-storey office in a cold climate, climate zone 6A. The team has issued a typical wall section, an extract from the project manual and the door schedule for a quality review before construction documents are completed. Identify the defects.",
docs: [
  { id:"d1", title:"Typical exterior wall section",
    blocks:[
      { svg:'<svg viewBox="0 0 520 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wall section showing brick veneer, cavity, sheathing, steel studs and interior finish">'
        +'<rect x="40" y="30" width="46" height="370" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>'
        +'<text x="63" y="420" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">brick</text>'
        +'<rect x="86" y="30" width="30" height="370" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3"/>'
        +'<text x="101" y="420" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">cavity</text>'
        +'<rect x="116" y="30" width="18" height="370" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<rect x="134" y="30" width="26" height="370" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<rect x="160" y="30" width="86" height="370" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>'
        +'<text x="203" y="420" text-anchor="middle" font-size="12" font-family="sans-serif" fill="var(--ink)">stud cavity</text>'
        +'<rect x="246" y="30" width="16" height="370" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="1.5"/>'
        +'<line x1="90" y1="372" x2="112" y2="372" stroke="var(--ink)" stroke-width="3"/>'
        +'<path d="M 86 372 L 134 372 L 134 358" fill="none" stroke="var(--ink)" stroke-width="3"/>'
        +'<circle cx="98" cy="386" r="5" fill="none" stroke="var(--ink)" stroke-width="2"/>'
        +'<text x="300" y="60" font-size="13" font-family="sans-serif" fill="var(--ink)">1. Brick veneer, 3⅝″</text>'
        +'<text x="300" y="86" font-size="13" font-family="sans-serif" fill="var(--ink)">2. Air cavity, 2″ — drained</text>'
        +'<text x="300" y="112" font-size="13" font-family="sans-serif" fill="var(--ink)">3. Fluid-applied air barrier</text>'
        +'<text x="300" y="138" font-size="13" font-family="sans-serif" fill="var(--ink)">4. Exterior sheathing, ⅝″</text>'
        +'<text x="300" y="164" font-size="13" font-family="sans-serif" fill="var(--ink)">5. 6″ steel studs @ 16″ o.c.</text>'
        +'<text x="300" y="190" font-size="13" font-family="sans-serif" fill="var(--ink)">6. R-21 batt in stud cavity</text>'
        +'<text x="300" y="216" font-size="13" font-family="sans-serif" fill="var(--ink)">7. 6 mil polyethylene, interior face</text>'
        +'<text x="300" y="242" font-size="13" font-family="sans-serif" fill="var(--ink)">8. ⅝″ gypsum board, painted</text>'
        +'<text x="300" y="282" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">NO continuous exterior</text>'
        +'<text x="300" y="300" font-size="13" font-family="sans-serif" font-weight="bold" fill="var(--ink)">insulation provided</text>'
        +'<text x="300" y="340" font-size="12" font-family="sans-serif" fill="var(--ink-2)">Base of cavity: through-wall</text>'
        +'<text x="300" y="356" font-size="12" font-family="sans-serif" fill="var(--ink-2)">flashing turned up, weeps</text>'
        +'<text x="300" y="372" font-size="12" font-family="sans-serif" fill="var(--ink-2)">@ 32″ o.c. No end dams shown.</text>'
        +'</svg>',
        caption:"Typical wall section, climate zone 6A. Numbered layers from exterior to interior." }
    ]},
  { id:"d2", title:"Project manual extract — Section 04 20 00 Unit Masonry",
    blocks:[
      { h:"PART 1 — GENERAL",
        ul:["1.3 Submittals: product data for each type of unit and mortar; samples for colour range approval.",
            "1.5 Quality assurance: provide a 4 ft by 4 ft mock-up panel; retain until work is accepted.",
            "1.6 Warranty: 5-year manufacturer warranty on masonry units."] },
      { h:"PART 2 — PRODUCTS",
        ul:["2.1 Mortar: Type M, ASTM C270, for all exterior above-grade veneer.",
            "2.3 Flashing: 0.032 in aluminium through-wall flashing at all cavity bases and heads.",
            "2.4 Masonry units: face brick, ASTM C216, grade SW."] },
      { h:"PART 3 — EXECUTION",
        ul:["3.2 Installation: lay units in running bond, tool joints concave.",
            "3.4 Weeps: open head joints at 32 in on centre at all flashing lines.",
            "3.6 Field quality control: test mortar compressive strength per ASTM C780."] }
    ]},
  { id:"d3", title:"Door schedule — extract",
    blocks:[
      { table:{ head:["Mark","Room","Wall rating","Door rating","Hardware set","Remarks"], rows:[
        ["204A","Corridor to office","1 hr fire partition","20 min","HW-3","—"],
        ["204B","Corridor to stair S2","2 hr fire barrier","45 min","HW-7","Closer, latch"],
        ["204C","Corridor to electrical","1 hr fire partition","20 min","HW-3","—"],
        ["204D","Office to office","Non-rated","—","HW-1","—"],
        ["204E","Corridor to shaft","2 hr fire barrier","1½ hr","HW-7","Closer, latch"]
      ]}}
    ]}
],
questions: [
  { t:"pdd-02", k:"multi", q:"Reviewing the wall section against climate zone 6A practice, which defects are present? Select all that apply.",
    c:["Polyethylene vapor barrier on the interior face","No continuous exterior insulation outboard of the steel studs","Flashing shown without end dams","Weeps at 32 in on centre","Air barrier located outboard of the sheathing"],
    a:[1,2],
    why:"In a cold climate the interior is the warm side in winter, so interior polyethylene is conventional and not a defect there. Weeps at 32 in are within the normal 24 to 33 in range, and an air barrier outboard of the sheathing is good practice. The real defects are the absence of continuous exterior insulation — which lets the steel studs short-circuit the R-21 batt down to an effective value near R-9 — and flashing without end dams, which will discharge collected water into the wall at each termination." },

  { t:"pdd-02", q:"Steel studs at 16 in on centre with R-21 batt and no continuous insulation produce roughly what effective assembly R-value?",
    c:["R-21, as specified","Roughly R-9 to R-11, because steel conducts heat around the insulation","R-26, with the sheathing and finishes added","R-30, once air films are included"],
    a:1, why:"Steel is an excellent conductor, so each stud is a thermal bridge bypassing the cavity insulation. The resulting effective value is often less than half the nominal batt rating. This is exactly why energy codes require continuous insulation outboard of steel framing — it interrupts every bridge at once." },

  { t:"pdd-01", q:"The specification calls for Type M mortar at exterior above-grade veneer. What is the issue?",
    c:["Type M is too weak for exterior use","Type M at 2,500 psi is stronger than needed above grade; Type N is conventional, and mortar stronger than the units drives cracking through the brick","Type M may not be used with face brick","Mortar type is not specified in Part 2"],
    a:1, why:"Type M is intended for below-grade work, foundations and retaining walls. Above grade, Type N at 750 psi is conventional. Mortar should be weaker than the units so that cracking occurs in the joint, where it can be repointed, rather than through the brick, where it cannot be repaired." },

  { t:"pdd-02", q:"Section 2.3 specifies aluminium through-wall flashing. What is wrong?",
    c:["Aluminium is too expensive for flashing","Alkaline mortar attacks aluminium; stainless steel, copper or a compatible membrane should be specified","Flashing belongs in Division 07, not 04","Aluminium cannot be formed into end dams"],
    a:1, why:"Aluminium corrodes in contact with the alkalis in fresh mortar and concrete, which is precisely where through-wall flashing sits. Stainless steel and copper are durable alternatives, as are membrane flashings where compatibility with adjacent sealants and the air barrier is verified." },

  { t:"pdd-03", k:"place", q:"Place each specification item into the SectionFormat part where it belongs.",
    items:["Submittal requirements","Mortar type and ASTM standard","Installation tolerances and joint tooling"],
    targets:["Part 1 — General","Part 2 — Products","Part 3 — Execution"],
    a:[0,1,2],
    why:"Part 1 covers administrative matters specific to the section: summary, references, submittals, quality assurance, delivery and warranty. Part 2 covers what is provided: manufacturers, materials, mixes and fabrication. Part 3 covers how it is installed and verified: examination, preparation, installation, field quality control and protection." },

  { t:"pdd-04", q:"In the door schedule, which mark carries an incorrectly rated opening protective?",
    c:["204A","204B","204C","204E"],
    a:1, why:"Door 204B sits in a 2-hour fire barrier at the stair enclosure but is scheduled as a 45-minute assembly. A 2-hour fire barrier requires a 1½-hour door, as 204E correctly shows. The 20-minute doors at 204A and 204C are correct for 1-hour corridor fire partitions." },

  { t:"pdd-03", k:"multi", q:"Which items belong in the project manual rather than on the drawings? Select all that apply.",
    c:["The mortar type and ASTM standard","The location of each movement joint in the veneer","The required mock-up size and retention","The dimension from the grid to the face of brick","The weep spacing requirement"],
    a:[0,2,4],
    why:"Specifications state quality and performance; drawings show quantity, location and relationship. Mortar type, mock-up requirements and weep spacing are quality and procedural requirements. Where a movement joint occurs and how far the brick face sits from the grid are locational and dimensional, which belong on the drawings." },

  { t:"pdd-03", q:"The specification requires a mock-up retained until the work is accepted. What is its function?",
    c:["To satisfy the special inspection requirement","To establish the standard of appearance and workmanship against which the installed masonry is judged","To test the structural capacity of the veneer ties","To serve as a template for shop drawings"],
    a:1, why:"An approved mock-up fixes the acceptable range for colour, bond, joint width and tooling. Disputes about whether installed work matches it can only be settled while it still exists, which is why specifications require it be retained undisturbed until the corresponding work is accepted." },

  { t:"pdd-02", q:"What should the architect add at the base of the cavity to complete the flashing detail?",
    c:["A second layer of air barrier","End dams at all terminations, with the flashing turned up the backup and lapped over the drainage plane","Additional weeps at 12 in on centre","A sealant bead closing the cavity"],
    a:1, why:"Flashing collects water and must discharge it outward. End dams stop the collected water running off the ends into the wall, and turning the flashing up the backup with the drainage plane lapped over it keeps water on the outside of the membrane. Sealing the cavity closed would trap water and defeat the drainage principle entirely." }
]
}];

window.ARE_DATA.ce.cases = [{
id: "ce-cs1", title: "Rowan Street Apartments — contract administration", mins: 35,
scenario: "Rowan Street is a 64-unit apartment building, $19,400,000 under A101 with A201, performance and payment bonds furnished. You are administering the contract. The owner is anxious, the contractor is behind, and several matters have landed on your desk this week.",
docs: [
  { id:"d1", title:"Application for payment no. 14 — summary",
    blocks:[
      { table:{ head:["Item","Amount"], rows:[
        ["Original contract sum","$19,400,000"],
        ["Net change by change orders","+$386,000"],
        ["Contract sum to date","$19,786,000"],
        ["Total completed and stored to date","$13,264,000"],
        ["Retainage at 10%","$1,326,400"],
        ["Total earned less retainage","$11,937,600"],
        ["Less previous certificates","$10,980,000"],
        ["Current payment due","$957,600"]
      ]}},
      { p:["Included in “completed and stored” is $420,000 of curtain wall glazing stored at a supplier's warehouse 60 miles away. No bill of sale, insurance certificate or bonding for the stored materials has been provided."] }
    ]},
  { id:"d2", title:"Field and correspondence log, this week",
    blocks:[
      { ul:[
        "Monday: Contractor's superintendent informs you that bathroom exhaust ducts in 11 units were installed with the wrong fire damper type. Contractor proposes to leave them and credit the owner $12,000.",
        "Tuesday: Owner telephones the contractor directly and instructs him to upgrade the lobby flooring. Contractor begins ordering material.",
        "Wednesday: Contractor encounters buried construction debris and petroleum-contaminated soil at the south parking area. Work in that area stops; written notice received the same day.",
        "Thursday: Subcontractor's representative tells you the contractor is 70 days behind on payments to the framing subcontractor.",
        "Friday: Contractor requests a 14-day time extension for a regional labour dispute that halted deliveries, submitted 9 days after the dispute ended."
      ]}
    ]},
  { id:"d3", title:"Relevant A201 provisions — summary",
    blocks:[
      { ul:[
        "§3.7.4 Concealed or unknown conditions — notice promptly, before conditions are disturbed, and no later than 21 days after first observance.",
        "§4.2.4 Communications — owner and contractor communicate through the architect.",
        "§9.5.1 Withholding certification — grounds include defective work not remedied and failure to make payments properly to subcontractors.",
        "§10.3 Hazardous materials — contractor stops work in the affected area and notifies owner and architect in writing.",
        "§12.3 Acceptance of non-conforming work — the owner may accept, with the contract sum reduced appropriately.",
        "§15.1.3 Claims — written notice within 21 days of the event or its recognition."
      ]}
    ]}
],
questions: [
  { t:"ce-04", k:"multi", q:"Which grounds in Application no. 14 justify withholding some certification? Select all that apply.",
    c:["The $420,000 of stored materials lacking title transfer, insurance and bonding","The reported 70-day arrears to the framing subcontractor","The incorrect fire dampers in 11 units","The net change by change orders of $386,000"],
    a:[0,1,2],
    why:"Stored materials may be certified only where the contract permits and the conditions are met — proper storage, insurance and transfer of title, with bonding usual for off-site. Failure to make payments properly to subcontractors is an express §9.5.1 ground. Defective work not remedied covers the dampers. Executed change orders are a legitimate part of the contract sum and are not a ground for withholding." },

  { t:"ce-06", q:"The contractor proposes leaving the wrong fire dampers in place for a $12,000 credit. What should the architect do?",
    c:["Accept the credit and certify the reduced amount","Reject the work; whether to accept non-conforming work is the owner's decision, and the architect must first advise on the code and life-safety consequences","Issue a construction change directive accepting the dampers","Refer the matter to the Initial Decision Maker"],
    a:1, why:"The architect has authority to reject non-conforming work. Accepting it instead, with a reduction in the contract sum, is the owner's decision under §12.3 — but no owner can waive a code requirement. Fire dampers are a life-safety element that the building official will inspect, so the architect must advise that acceptance is not available here and the dampers must be corrected." },

  { t:"ce-02", q:"The owner instructed the contractor directly to upgrade the lobby flooring. What is the architect's first action?",
    c:["Issue a change order for the upgrade","Tell the owner the instruction must be routed through the architect, and have the change priced and authorised properly before material is ordered","Allow the work and resolve the cost at closeout","Withhold the next certificate until the work stops"],
    a:1, why:"§4.2.4 routes owner–contractor communication through the architect so that changes are scoped, priced and authorised before they are performed. Material already being ordered makes this urgent: once it is delivered the owner's negotiating position is gone and the invoice becomes a dispute." },

  { t:"ce-08", q:"The contractor stopped work on encountering contaminated soil and gave written notice the same day. Was this correct?",
    c:["No — the contractor should have continued and claimed afterwards","Yes — §10.3 requires the contractor to stop work in the affected area and notify the owner and architect in writing","No — only the owner may order work stopped","Yes, but notice should have gone to the building official first"],
    a:1, why:"Hazardous materials not created by the contractor and not required by the contract documents are one of the few circumstances where the contractor stops work on its own initiative. The owner then engages a licensed specialist to verify and render the area harmless, with the contract sum and time adjusted." },

  { t:"ce-05", q:"The Friday time extension request concerns a labour dispute, submitted 9 days after the dispute ended. How should it be assessed?",
    c:["Denied — notice was late","Notice is timely, and a regional labour dispute is typically excusable but non-compensable, so a time extension without additional money","Granted with full compensation for extended general conditions","Denied — labour disputes are never excusable"],
    a:1, why:"Nine days is well within the 21-day notice requirement, so the claim is properly made. A regional labour dispute is outside either party's control, which makes it excusable — relieving the contractor of liquidated damages — but non-compensable, so each party bears its own costs." },

  { t:"ce-04", k:"num", q:"If the architect withholds certification for the $420,000 of improperly documented stored materials, what is the revised current payment due? Account for the 10% retainage on the withheld amount. Enter the amount in dollars without a comma or dollar sign.",
    a:579600, tol:0.005,
    why:"Removing $420,000 from completed and stored gives $12,844,000. Retainage at 10% is $1,284,400, so earned less retainage becomes $11,559,600. Deducting previous certificates of $10,980,000 leaves $579,600. The withheld amount nets to $378,000 because the retainage on it was never going to be paid this period either." },

  { t:"ce-04", q:"What is the architect's Certificate for Payment a representation of?",
    c:["That the contractor has paid its subcontractors","That, to the best of the architect's knowledge, the work has progressed to the point indicated and its quality accords with the contract documents","That the architect made exhaustive on-site inspections","That the contractor used prior payments appropriately"],
    a:1, why:"A201 states the representation precisely and then disclaims the rest: it is not a representation that the architect made exhaustive or continuous inspections, reviewed means and methods, reviewed subcontractor requisitions, or ascertained how the contractor used money previously paid." },

  { t:"ce-07", k:"multi", q:"Before final payment on this project, which submissions will A201 require from the contractor? Select all that apply.",
    c:["An affidavit that payrolls and material bills have been paid or satisfied","Consent of surety to final payment","A certificate that required insurance will not lapse without 30 days' notice","Lien releases and waivers, or an indemnity bond","A revised construction schedule"],
    a:[0,1,2,3],
    why:"All four of the first items are required. Consent of surety matters particularly here because bonds were furnished — paying in full without it can discharge the surety under the performance bond. A construction schedule is a working document during construction and is not a closeout submission." },

  { t:"ce-02", q:"The owner asks whether the architect can simply order the contractor to stop work until the damper issue is resolved. What is the correct answer?",
    c:["Yes — the architect may stop work for non-conforming construction","No — only the owner may order the work stopped; the architect may reject the work and recommend that the owner do so","Yes, but only with the building official's concurrence","No — the work may never be stopped once begun"],
    a:1, why:"The architect's authority runs to rejecting non-conforming work, not to stopping the work. Stopping it is the owner's right, exercisable after seven days' written notice where the contractor fails to correct. An architect who stops the work assumes responsibility for the resulting delay." }
]
}];
