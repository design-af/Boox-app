/* Cross-division reference and exam-day guidance. Shown as its own section. */

window.ARE_EXTRAS = {
title: "Reference & exam day",
blurb: "The tables that span divisions, the numbers that are faster to memorise than to derive, and what sitting the exam is actually like. Verify anything borderline against the adopted code edition and the current NCARB Guidelines — these are study aids, not the primary source.",

groups: [

{ id:"examday", title:"Exam day", sheets:[
  { title:"How a division runs",
    ul:[
      "**Appointment time** is longer than testing time — it includes check-in, a short tutorial and an optional survey. Arrive early; late arrival can forfeit the appointment and the fee.",
      "**The clock is rolling.** Breaks come out of your testing time unless the division provides a scheduled break. Plan for that: a division is a continuous sitting, not a series of sessions.",
      "**You may move freely** within the exam, flag items and return to them. Use it — answer everything you know first, flag the rest, and come back with whatever time remains.",
      "**Nothing is left blank.** There is no penalty for a wrong answer, so an eliminated-down guess always beats an omission.",
      "**Case studies come with resource documents** you open and navigate in a separate pane. Read the question first, then go to the documents — reading every resource before you know what is asked wastes the time the case study is designed to pressure.",
      "**An on-screen calculator and a reference sheet** of common formulas and conversions are provided. Scratch material is provided by the test centre; you may not bring your own.",
      "**Results** for most divisions arrive as pass/fail, usually within a few days. A failed division carries a waiting period before you may retake it, and a limit on attempts per rolling year."
    ] },
  { title:"Pacing by division",
    note:"Minutes per item, from the published item counts and testing times. Case studies consume disproportionate time, so bank minutes on the standalone items.",
    head:["Division","Items","Time","Minutes per item"],
    rows:[
      ["PcM","65","2 hr 40 min","2.5"],
      ["PjM","75","3 hr 0 min","2.4"],
      ["PA","75","3 hr 0 min","2.4"],
      ["PPD","100","4 hr 5 min","2.5"],
      ["PDD","100","4 hr 5 min","2.5"],
      ["CE","75","3 hr 0 min","2.4"]
    ] },
  { title:"Item formats you will meet",
    head:["Format","What it asks","Strategy"],
    rows:[
      ["Multiple choice","One correct answer of four","Eliminate two, then decide between the remaining pair"],
      ["Check all that apply","Several correct answers; usually no partial credit","Test each option independently as true or false"],
      ["Quantitative fill-in","Calculate and type a number","Check units and whether rounding is specified"],
      ["Hot spot","Click a location on a graphic","Read what is being asked before studying the drawing"],
      ["Drag and place","Position elements into correct locations","Place the ones you are certain of first, then infer the rest"]
    ] },
  { title:"The week before",
    ul:[
      "Work practice exams at full length and full time. A division is as much an endurance test as a knowledge test, and the failure mode is usually the last 20 items.",
      "Review your weakest topics by readiness score, not the ones you enjoy.",
      "Re-read the AIA document summaries. Contract content appears in every division and is the cheapest content to secure.",
      "Stop learning new material 48 hours out. Consolidate what you have.",
      "Confirm the test centre location and what identification is required."
    ] }
]},

{ id:"loads", title:"Loads and structure", sheets:[
  { title:"Typical live loads",
    note:"From the model code's occupancy table. Values are psf and vary by edition — confirm against the adopted code.",
    head:["Occupancy","Live load (psf)"],
    rows:[
      ["Residential, private rooms","40"],
      ["Schools, classrooms","40"],
      ["Parking garage, passenger vehicles","40"],
      ["Office","50"],
      ["Assembly, fixed seats","60"],
      ["Library reading room","60"],
      ["Retail, upper floors","75"],
      ["Corridors above the first floor","80"],
      ["Assembly, movable seats","100"],
      ["Lobbies and first-floor corridors","100"],
      ["Stairs and exit ways","100"],
      ["Retail, ground floor","100"],
      ["Light storage","125"],
      ["Library stack rooms","150"],
      ["Heavy storage","250"],
      ["Ordinary flat roof","20"]
    ] },
  { title:"Material weights",
    head:["Material","Weight"],
    rows:[
      ["Normal-weight concrete","150 pcf"],
      ["Lightweight concrete","110–115 pcf"],
      ["Steel","490 pcf"],
      ["Softwood lumber","30–40 pcf"],
      ["Brick masonry","120 pcf"],
      ["Water","62.4 pcf · 8.34 lb per gallon"],
      ["Ponded water on a roof","5.2 psf per inch of depth"],
      ["Extensive vegetated roof, saturated","20–35 psf"]
    ] },
  { title:"Span and depth rules",
    head:["System","Span","Depth"],
    rows:[
      ["Wood joist","10–20 ft","span/20"],
      ["Glulam beam","20–60 ft","span/20"],
      ["Steel beam","20–40 ft","span/20–24"],
      ["Open-web steel joist","20–60 ft (100+ long span)","span/20"],
      ["Steel truss","40–150 ft","span/10–15"],
      ["Concrete one-way slab","10–20 ft","span/24–28"],
      ["Concrete flat plate","15–30 ft","span/30"],
      ["Waffle slab","25–45 ft","span/24"],
      ["Post-tensioned","25–45 ft","span/40"],
      ["Precast double tee","30–70 ft","span/28"],
      ["Space frame","80–200+ ft","span/15–25"]
    ] },
  { title:"Soil bearing, strongest to weakest",
    ul:[
      "Bedrock — highest capacity, shallow footings viable where it is near the surface",
      "Gravel and sandy gravel — drains and compacts well",
      "Sand — good capacity, drains well",
      "Silt — poor drainage, frost susceptible",
      "Clay — low capacity; **expansive clay** heaves when wet and shrinks when dry",
      "Organic soil and peat — never acceptable as bearing stratum",
      "Uncontrolled fill — never acceptable; engineered and compacted fill in lifts may be"
    ] }
]},

{ id:"plumbing", title:"Plumbing and vertical transportation", sheets:[
  { title:"Plumbing fixture counts — structure of the calculation",
    note:"Counts come from the plumbing code table by occupancy and occupant load, with the load normally divided equally between sexes unless the use indicates otherwise. The ratios below are typical; **confirm against the adopted edition**, which revises them.",
    head:["Occupancy","Water closets","Lavatories","Other"],
    rows:[
      ["Business","1 per 25 for the first 50, then 1 per 50","1 per 40 for the first 80, then 1 per 80","1 drinking fountain per 100; 1 service sink"],
      ["Assembly, restaurants","1 per 75","1 per 200","1 drinking fountain per 500; 1 service sink"],
      ["Mercantile","1 per 500","1 per 750","1 drinking fountain per 1,000; 1 service sink"],
      ["Educational","1 per 50","1 per 50","1 drinking fountain per 100; 1 service sink"],
      ["Residential R-2","1 per dwelling unit","1 per dwelling unit","1 kitchen sink and 1 bath or shower per unit"]
    ] },
  { title:"Why fixture counts belong in early planning",
    ul:[
      "Fixture counts set restroom size, restroom size sets core size, and core size affects the efficiency ratio and the floor plate.",
      "Discovering at design development that the core must grow is far more disruptive than calculating it at programming.",
      "Accessible fixtures are counted within the required number, not in addition to it, but the accessible compartment's 60-inch width drives the room's dimensions.",
      "A single-user family or assisted-use toilet room is required in some occupancies and is increasingly required by local amendment — check early."
    ] },
  { title:"Elevator planning rules of thumb",
    head:["Quantity","Rule"],
    rows:[
      ["Office, passenger cars","Roughly 1 car per 45,000–50,000 gsf, or 1 per 300 occupants"],
      ["Residential","Roughly 1 car per 60–90 units"],
      ["Hotel","Roughly 1 car per 75–100 keys, plus service"],
      ["Car speed, low rise (to 6 storeys)","100–200 fpm"],
      ["Car speed, mid rise (7–20 storeys)","200–500 fpm"],
      ["Car speed, high rise","500–1,800 fpm"],
      ["Accessible car, centre-opening door","51″ deep × 68″ wide minimum"],
      ["Accessible car, side-opening door","51″ deep × 80″ wide minimum"],
      ["Call buttons","Centred 42″ above the floor, up button above down"],
      ["Pit and overhead","Depth and clearance set by speed and travel — confirm with the supplier early"]
    ] },
  { title:"Water distribution",
    ul:[
      "Street pressure generally serves to about **40–60 feet** of height; above that, booster pumps are required.",
      "Tall buildings are divided into **pressure zones** so lower floors are not subjected to excessive pressure.",
      "Horizontal sanitary drains slope **1/4 inch per foot** up to 3 inches diameter and **1/8 inch per foot** above that.",
      "Fixtures below the sewer invert need an **ejector pit and pump**.",
      "Every trap requires a **vent** to protect its seal from siphonage."
    ] }
]},

{ id:"acoustics", title:"Acoustics and energy", sheets:[
  { title:"Reverberation time",
    note:"Sabine's formula. RT60 is the time for sound to decay 60 decibels.",
    head:["Quantity","Formula"],
    rows:[
      ["RT60, imperial","0.049 × V ÷ A, where V is room volume in cubic feet and A is total absorption in sabins"],
      ["RT60, metric","0.161 × V ÷ A, with V in cubic metres"],
      ["Absorption of a surface","Area × absorption coefficient (NRC), in sabins"],
      ["Target — speech","0.6–1.0 seconds"],
      ["Target — classroom","0.4–0.6 seconds"],
      ["Target — orchestral music","1.8–2.2 seconds"],
      ["Target — worship, organ","2.5–3.5 seconds"]
    ] },
  { title:"Typical STC values",
    head:["Assembly","STC"],
    rows:[
      ["Single layer gypsum each side, steel studs, no insulation","35–38"],
      ["As above with cavity insulation","39–42"],
      ["Double layer one side, insulation","45–48"],
      ["Double layer both sides, insulation, resilient channel","52–56"],
      ["Staggered stud, double layer, insulation","55–60"],
      ["Double stud, separate plates, insulation","60–65"],
      ["8″ concrete or CMU","50–55"],
      ["Hollow core wood door, no seals","20–25"],
      ["Solid core door with full perimeter seals","30–35"]
    ] },
  { title:"What each rating is for",
    head:["Rating","Measures","Improved by"],
    rows:[
      ["STC","Airborne transmission through an assembly","Mass, decoupling, cavity insulation, sealing"],
      ["IIC","Impact transmission through a floor-ceiling","Resilient underlayment, floating floor, carpet, resilient ceiling"],
      ["NRC","Absorption at a surface, 0 to 1","Soft, porous, fibrous materials — does nothing for transmission"],
      ["NIC","Measured performance between two real rooms","Fixing flanking paths, which laboratory STC never captures"]
    ] },
  { title:"Energy and conversions",
    head:["Quantity","Value"],
    rows:[
      ["1 ton of cooling","12,000 Btu per hour"],
      ["1 kilowatt","3,412 Btu per hour"],
      ["1 horsepower","746 watts"],
      ["U-factor","1 ÷ total R-value"],
      ["Heating / cooling degree days","Departure from a 65°F base, summed over the year"],
      ["Rule of thumb, office cooling","300–400 gsf per ton, varying widely with envelope and loads"],
      ["Daylight penetration","1.5 to 2 × window head height"],
      ["LEED thresholds","Certified 40–49 · Silver 50–59 · Gold 60–79 · Platinum 80+"]
    ] }
]},

{ id:"site", title:"Site and dimensions", sheets:[
  { title:"Parking dimensions",
    note:"Typical values; local ordinances govern and vary.",
    head:["Element","Dimension"],
    rows:[
      ["Standard stall","9 ft × 18 ft"],
      ["Compact stall","8 ft × 16 ft"],
      ["Accessible car stall","8 ft wide, plus a 5 ft access aisle"],
      ["Van accessible stall","11 ft wide plus 5 ft aisle, or 8 ft plus 8 ft aisle"],
      ["Two-way aisle, 90° parking","24 ft"],
      ["One-way aisle, 60° parking","18 ft"],
      ["Area per space including aisles","300–350 sf surface; 325–400 sf structured"],
      ["Accessible stall and aisle slope","2% maximum in all directions"]
    ] },
  { title:"Slope limits",
    head:["Condition","Maximum"],
    rows:[
      ["Accessible route, running","5% (1:20)"],
      ["Accessible route, cross slope","2% (1:48)"],
      ["Ramp","8.33% (1:12), 30″ max rise per run"],
      ["Parking lot","5% max, 1% min for drainage"],
      ["Grass swale","2–10%"],
      ["Planted slope","25% (4:1)"],
      ["Paved drive","10–15%, varying by jurisdiction"],
      ["Slope formula","rise ÷ run · run = rise ÷ slope"]
    ] },
  { title:"Fire department access",
    head:["Requirement","Typical value"],
    rows:[
      ["Distance to all portions of the first-storey exterior wall","150 ft"],
      ["Minimum clear width","20 ft"],
      ["Minimum vertical clearance","13 ft 6 in"],
      ["Dead-end access road","Turnaround required beyond a stated length"],
      ["Surface","Capable of supporting apparatus weight in all weather"]
    ] },
  { title:"Conversions worth memorising",
    head:["From","To"],
    rows:[
      ["1 acre","43,560 square feet"],
      ["1 square foot","144 square inches"],
      ["1 cubic yard","27 cubic feet"],
      ["1 mile","5,280 feet"],
      ["1 psi","144 psf"],
      ["Slope 1:12","8.33%"],
      ["Slope 1:20","5%"],
      ["Slope 1:48","2%"]
    ] }
]},

{ id:"docs", title:"AIA documents at a glance", sheets:[
  { title:"Families",
    head:["Series","Between","Key documents"],
    rows:[
      ["A","Owner and contractor","A101 stipulated sum · A102 GMP · A103 cost plus, no GMP · A133/A134 CM as constructor · A201 General Conditions · A312 bonds"],
      ["B","Owner and architect","B101 standard · B102 scope-less · B103 complex projects · B104 limited scope"],
      ["C","Architect and consultant, and other agreements","C401 architect–consultant · C101 joint venture · C132 CM as adviser"],
      ["D","Miscellaneous","D200 project checklist"],
      ["E","Exhibits","E203 BIM and digital data · E204 sustainable projects"],
      ["G","Contract administration","G701 change order · G702/703 payment application · G704 substantial completion · G709 proposal request · G710 ASI · G714 construction change directive"]
    ] },
  { title:"Time periods that get tested",
    head:["Period","Applies to"],
    rows:[
      ["21 days","Written notice of a claim, from the event or its recognition"],
      ["21 days","Outside limit for notice of a concealed condition — and before conditions are disturbed"],
      ["7 days","Architect's notice before suspending services for non-payment (B101)"],
      ["7 days","Owner's notice before ordering the work stopped for uncorrected work"],
      ["7 days","Notice before termination for cause"],
      ["10 days","Typical deadline for a pre-bid substitution request"],
      ["30 days","Notice required before post-final-payment insurance may lapse"],
      ["1 year","Contractor's correction period from substantial completion"],
      ["11 months","The walkthrough that uses that year — an additional service"],
      ["8–10 years","Typical statute of repose — how long records must be kept"]
    ] },
  { title:"Who does what",
    head:["Task","Party"],
    rows:[
      ["Furnish the program, budget, survey and geotechnical report","Owner"],
      ["Secure and pay for the building permit","Contractor"],
      ["Obtain easements, zoning approvals, certificate of occupancy application","Owner"],
      ["Carry builder's risk property insurance","Owner"],
      ["Carry general liability and workers compensation","Contractor"],
      ["Furnish performance and payment bonds","Contractor"],
      ["Arrange required tests and inspections","Contractor arranges; owner pays"],
      ["Prepare the punch list","Contractor"],
      ["Determine substantial completion","Architect"],
      ["Award the construction contract","Owner"],
      ["Reject non-conforming work","Architect"],
      ["Order the work stopped","Owner"],
      ["Direct means, methods and jobsite safety","Contractor — solely"]
    ] }
]}

]};
