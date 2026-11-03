/* Alternate item formats, appended to each division's exam bank so they appear
   in practice exams, and filterable on their own for format drill. */

(function(){
function add(div, items){
  var d = window.ARE_DATA[div];
  if(!d) return;
  d.exam = (d.exam || []).concat(items);
}

add("pcm", [
{ t:"pcm-02", k:"num", q:"A firm reports total revenue of $3,600,000, consultant fees of $540,000 and reimbursable expenses of $260,000. Direct labor is $940,000. Calculate the net multiplier to two decimal places.",
  a:2.98, tol:0.02,
  why:"Net operating revenue = 3,600,000 − 540,000 − 260,000 = $2,800,000. Net multiplier = 2,800,000 ÷ 940,000 = 2.98. Just below the 3.0 benchmark, and worth comparing against the firm's break-even rate before concluding anything." },

{ t:"pcm-02", k:"num", q:"Total indirect expenses are $1,702,000 and direct labor is $1,100,000. Calculate the overhead rate to two decimal places.",
  a:1.55, tol:0.02,
  why:"Overhead rate = total indirect expenses ÷ direct labor = 1,702,000 ÷ 1,100,000 = 1.55, inside the healthy 1.3 to 1.75 band. Break-even rate would be 2.55, so the firm needs a net multiplier above that to make money." },

{ t:"pcm-05", k:"num", q:"A basic services fee is $840,000. Schematic design and design development are complete. Using the conventional AIA phase allocation, how much fee remains? Enter dollars without a comma or dollar sign.",
  a:546000, tol:0.01,
  why:"SD is 15% and DD is 20%, so 35% is earned and 65% remains: 840,000 × 0.65 = $546,000, covering construction documents (40%), bidding (5%) and construction administration (20%)." },

{ t:"pcm-01", k:"multi", q:"Which business structures provide pass-through taxation? Select all that apply.",
  c:["Sole proprietorship","General partnership","C corporation","Limited liability company","S corporation"],
  a:[0,1,3,4],
  why:"Only the C corporation is taxed twice — once at the corporate level and again on dividends distributed to shareholders. Every other common form passes income through to the owners' personal returns, which is why the C corporation is rare among design firms." },

{ t:"pcm-03", k:"multi", q:"Which contract provisions genuinely reduce an architect's risk rather than relocating it? Select all that apply.",
  c:["A limitation of liability capping exposure at the fee","A mutual waiver of consequential damages","Broad-form indemnification of the owner","A warranty that documents will be error-free","Narrow-form indemnification limited to the architect's own negligence"],
  a:[0,1,4],
  why:"Limitation of liability caps exposure outright. A mutual waiver removes indirect losses for both parties. Narrow-form indemnity confines the promise to what insurance already covers. Broad-form indemnity and a warranty of perfection both add uninsured obligations — they increase risk rather than reduce it." },

{ t:"pcm-06", k:"place", q:"Place each subject into the B101 article where it is found.",
  items:["Standard of care","Copyrights and licenses","Owner's responsibilities","Claims and disputes"],
  targets:["Article 2","Article 5","Article 7","Article 8"],
  a:[0,2,1,3],
  why:"Article 2 covers the Architect's Responsibilities, including §2.2 standard of care and §2.5 insurance. Article 5 is Owner's Responsibilities — program, budget, surveys, geotechnical. Article 7 is Copyrights and Licenses. Article 8 is Claims and Disputes, including mediation as a condition precedent and the waiver of consequential damages." },

{ t:"pcm-07", k:"place", q:"Place each AIA document with the relationship it governs.",
  items:["B101","A201","C401"],
  targets:["Owner and architect","General conditions of the construction contract","Architect and consultant"],
  a:[0,1,2],
  why:"The letter identifies the parties: B series is owner–architect, A series is owner–contractor with A201 as the General Conditions incorporated into both, and C series covers the architect–consultant agreement and other arrangements." },

{ t:"pcm-04", k:"multi", q:"Which statutes apply to an architecture firm with 18 employees? Select all that apply.",
  c:["Fair Labor Standards Act","Title VII of the Civil Rights Act","Age Discrimination in Employment Act","Family and Medical Leave Act","Occupational Safety and Health Act"],
  a:[0,1,4],
  why:"FLSA and OSHA apply to essentially all employers. Title VII applies at 15 or more employees, so an 18-person firm is covered. The ADEA requires 20 and the FMLA requires 50, so neither reaches this firm federally — though state law frequently applies at lower thresholds." }
]);

add("pjm", [
{ t:"pjm-02", k:"num", q:"An activity has an early start of day 34, a duration of 12 days, and a late finish of day 58. Calculate its total float in days.",
  a:12, tol:0.01,
  why:"Early finish = early start + duration = 34 + 12 = 46. Total float = late finish − early finish = 58 − 46 = 12 days. Equivalently, late start is 58 − 12 = 46, and 46 − 34 = 12." },

{ t:"pjm-02", k:"num", q:"Three paths run from start to finish: A–B–C at 9 + 7 + 11 days, D–E at 14 + 12 days, and F–G–H at 8 + 6 + 10 days. What is the project duration in days?",
  a:27, tol:0.01,
  why:"Path A–B–C totals 27 days, D–E totals 26, and F–G–H totals 24. The critical path is the longest, so the project duration is 27 days and A, B and C carry zero float. Paths are never added together." },

{ t:"pjm-03", k:"num", q:"Under an A102 with a $8,600,000 GMP, the final cost of the work plus fee is $8,180,000, with savings shared 60% to the owner and 40% to the contractor. What does the owner pay in total? Enter dollars without a comma or dollar sign.",
  a:8348000, tol:0.005,
  why:"The under-run is 8,600,000 − 8,180,000 = $420,000. The contractor's 40% share is $168,000, which is added to the cost: 8,180,000 + 168,000 = $8,348,000. The GMP is a ceiling, not a target, so the owner never simply pays it." },

{ t:"pjm-07", k:"place", q:"Place each delay with its correct classification.",
  items:["Owner changes the program after approval","Unusually severe weather for the season","Contractor's supplier fails to deliver"],
  targets:["Excusable and compensable","Excusable, non-compensable","Non-excusable"],
  a:[0,1,2],
  why:"Owner-caused delay gives both time and money. Severe weather is nobody's fault, so it gives time but not money. A supplier failure sits within the contractor's sphere of responsibility, so it gives neither and liquidated damages continue to run." },

{ t:"pjm-04", k:"place", q:"Place each situation with the correct change instrument.",
  items:["Owner, architect and contractor agree scope, cost and time","Work must proceed before cost is agreed","A minor clarification with no cost or time effect"],
  targets:["G701 Change Order","G714 Construction Change Directive","G710 Architect's Supplemental Instructions"],
  a:[0,1,2],
  why:"A change order requires all three signatures and records an agreement. A construction change directive needs only owner and architect, which is exactly why it exists — to let work proceed without the contractor's agreement on price. An ASI may carry no cost or time at all." },

{ t:"pjm-06", k:"multi", q:"Which are quality control activities rather than quality assurance? Select all that apply.",
  c:["Redlining a construction document set","Maintaining the office standard detail library","Running clash detection on the federated model","Backchecking that comments were incorporated","Publishing the firm's CAD layering protocol"],
  a:[0,2,3],
  why:"Quality control examines a specific deliverable: redlines, clash reviews and backchecks all test this project's documents. Quality assurance is the preventive system that makes errors less likely across every project — standards, templates, protocols and checklists." },

{ t:"pjm-05", k:"num", q:"A project has a total budget of $18,000,000. Land cost $2,400,000, soft costs are $2,900,000, and FF&E outside the contract is $1,100,000. How much remains for the Cost of the Work? Enter dollars without a comma or dollar sign.",
  a:11600000, tol:0.005,
  why:"18,000,000 − 2,400,000 − 2,900,000 − 1,100,000 = $11,600,000. The Cost of the Work covers only construction of elements the architect designed or specified, including the contractor's overhead, profit and contingency — never land, soft costs or owner-furnished items." },

{ t:"pjm-08", k:"multi", q:"Which events are triggered by substantial completion? Select all that apply.",
  c:["Liquidated damages stop accruing","The one-year correction period begins","Final payment becomes due in full","Builder's risk gives way to the owner's property insurance","The contractor's warranty obligations end"],
  a:[0,1,3],
  why:"Substantial completion stops liquidated damages, starts warranties and the one-year correction period, and shifts risk of loss and insurance to the owner. Final payment follows final completion, not substantial completion, and warranties begin rather than end." }
]);

add("pa", [
{ t:"pa-02", k:"num", q:"A program totals 38,500 net assignable square feet at an expected efficiency of 70%. Calculate the required gross area in square feet.",
  a:55000, tol:0.01,
  why:"Gross = net ÷ efficiency = 38,500 ÷ 0.70 = 55,000 gsf. Gross is always the larger figure, so an answer smaller than the net you started with means the operation was inverted." },

{ t:"pa-04", k:"num", q:"A lot measures 150 ft by 220 ft and is zoned FAR 1.8. What is the maximum permitted floor area in square feet?",
  a:59400, tol:0.01,
  why:"Lot area = 150 × 220 = 33,000 sf. FAR 1.8 × 33,000 = 59,400 sf of gross floor area. FAR controls bulk without dictating form, so that area may be arranged in any configuration the coverage, height and setback controls allow." },

{ t:"pa-05", k:"num", q:"A 16,500 gross square foot business occupancy floor. Calculate the occupant load.",
  a:110, tol:0.01,
  why:"Business occupancy uses 150 square feet gross per occupant: 16,500 ÷ 150 = 110. Because the factor is gross, no deduction is made for corridors, restrooms or service areas." },

{ t:"pa-06", k:"num", q:"At 38° N latitude, calculate the solar altitude at solar noon on the winter solstice. Enter degrees to one decimal place.",
  a:28.5, tol:0.02,
  why:"Equinox noon altitude = 90 − 38 = 52°. The winter solstice is 23.5° lower: 52 − 23.5 = 28.5°. The summer solstice would be 52 + 23.5 = 75.5°, and that 47° swing is what makes a south-facing overhang work." },

{ t:"pa-03", k:"num", q:"A path must drop 7 feet at a maximum running slope of 5%. What horizontal run is required, in feet?",
  a:140, tol:0.01,
  why:"Run = rise ÷ slope = 7 ÷ 0.05 = 140 feet. At 5% the path remains an accessible route needing no handrails or intermediate landings. Treating it as an 8.33% ramp would need only 84 feet but would add handrails and a landing every 30 inches of rise." },

{ t:"pa-01", k:"place", q:"Place each activity in the correct step of the programming process.",
  items:["Recording current staff counts by department","Reconciling requested area against the budget","Writing a concise statement of the essential conditions the design must satisfy"],
  targets:["Collect and analyse facts","Determine needs","State the problem"],
  a:[0,1,2],
  why:"The five steps run: establish goals, collect and analyse facts, uncover and test concepts, determine needs, and state the problem. Determining needs is where wants are reconciled with what the budget supports, and stating the problem is the bridge into design." },

{ t:"pa-04", k:"multi", q:"Which are legitimate routes to approval when a project does not comply with the zoning ordinance? Select all that apply.",
  c:["A dimensional variance on proof of hardship arising from the property","A conditional use permit where the ordinance contemplates the use","A rezoning or map amendment","A planned unit development negotiated with the municipality","A building permit issued over the ordinance"],
  a:[0,1,2,3],
  why:"Variances, conditional use permits, rezonings and PUDs are all legitimate mechanisms with different standards and different difficulty. A building permit confirms code compliance and cannot authorise a zoning violation — the two approvals are separate." },

{ t:"pa-07", k:"multi", q:"Which items are the owner's responsibility to furnish under B101 Article 5? Select all that apply.",
  c:["The program and the budget","A survey describing physical characteristics and legal limits","The geotechnical report","The construction documents","Legal, insurance and accounting services"],
  a:[0,1,2,4],
  why:"Article 5 places the program, budget, survey, geotechnical report, and legal, insurance and accounting services on the owner. The construction documents are the architect's Basic Services under Article 3, which is why errors in an owner-furnished survey are not the architect's responsibility." }
]);

add("ppd", [
{ t:"ppd-01", k:"num", q:"A sprinklered floor measures 160 ft by 120 ft. Calculate the minimum exit separation in feet, to the nearest foot.",
  a:67, tol:0.03,
  why:"Diagonal = √(160² + 120²) = √(25,600 + 14,400) = √40,000 = 200 ft. Sprinklered, exits must be at least one third of the diagonal apart: 200 ÷ 3 ≈ 67 ft. Unsprinklered would require 100 ft." },

{ t:"ppd-01", k:"num", q:"A space has an occupant load of 480. The building has no emergency voice/alarm communication system. Calculate the minimum total egress width required at the doors, in inches.",
  a:96, tol:0.01,
  why:"Doors are level egress components, using the standard 0.2 inches per occupant: 480 × 0.2 = 96 inches. Stairways would use 0.3, giving 144 inches — the usual distractor." },

{ t:"ppd-06", k:"num", q:"A wall assembly has layers of R-0.68, R-15, R-0.62, R-8 and R-0.70 including air films. Calculate the U-factor to three decimal places.",
  a:0.04, tol:0.05,
  why:"R-values in series add: 0.68 + 15 + 0.62 + 8 + 0.70 = R-25.0. U = 1 ÷ 25.0 = 0.040. This is the value through the insulated path only; the path through framing is worse unless the R-8 is continuous exterior insulation, which interrupts the bridges." },

{ t:"ppd-02", k:"place", q:"Place each rated assembly with what it creates or encloses.",
  items:["Fire wall","Fire barrier","Fire partition"],
  targets:["Separate buildings for code purposes","Shafts, exit enclosures and occupancy separations","Corridor and dwelling unit separation"],
  a:[0,1,2],
  why:"A fire wall runs foundation to roof and is structurally independent, creating separate buildings each with its own allowable area. A fire barrier runs floor to deck and encloses shafts, exits and occupancy separations. A fire partition may stop at a rated ceiling membrane and handles corridors and unit separation." },

{ t:"ppd-03", k:"multi", q:"Which dimensions are correct under the ADA Standards? Select all that apply.",
  c:["Clear floor space 30 in by 48 in","Turning circle 60 in diameter","Door clear width 32 in minimum","Water closet centreline 20 in from the side wall","Grab bar height 33 to 36 in"],
  a:[0,1,2,4],
  why:"Clear floor space, turning circle, door clear width and grab bar height are all stated correctly. The water closet centreline must be 16 to 18 inches from the side wall — close enough for a transfer. Twenty inches fails, and the standard allows no tolerance in the wrong direction." },

{ t:"ppd-04", k:"place", q:"Place each structural system with its economical span range.",
  items:["Concrete flat plate","Open-web steel joist","Steel truss"],
  targets:["15 to 30 ft","20 to 60 ft","40 to 150 ft"],
  a:[0,1,2],
  why:"Flat plate gives the thinnest floor but a limited span. Open-web joists cover the common commercial range and let services pass through the depth. Steel trusses reach long spans at roughly span/10 to span/15 depth, which is why they suit assembly and industrial buildings." },

{ t:"ppd-07", k:"multi", q:"Which strategies belong to the load-reduction stage rather than later stages? Select all that apply.",
  c:["Building orientation and massing","Envelope insulation and air tightness","High-efficiency chillers","Daylighting and shading","A rooftop photovoltaic array"],
  a:[0,1,3],
  why:"The order of operations is reduce loads, then passive strategies, then efficient systems, then renewable generation. Orientation, envelope and daylighting all remove demand before any equipment is sized. Efficient chillers serve the remaining load, and photovoltaics come last." },

{ t:"ppd-05", k:"multi", q:"Which systems can satisfy simultaneous heating and cooling demands in different zones? Select all that apply.",
  c:["Four-pipe fan coil system","VRF with heat recovery","Water-source heat pump loop","Single-zone constant volume rooftop unit","Two-pipe fan coil system"],
  a:[0,1,2],
  why:"A four-pipe system carries hot and chilled water simultaneously. VRF with heat recovery moves heat between zones. A water-source heat pump loop does the same through a common loop. A single-zone unit and a two-pipe system can deliver only one condition at a time, however finely they are zoned." }
]);

add("pdd", [
{ t:"pdd-07", k:"num", q:"Direct costs are $4,500,000, general conditions are 11%, and overhead and profit are 13%. Calculate the subtotal in dollars, without a comma or dollar sign.",
  a:5644350, tol:0.005,
  why:"4,500,000 × 1.11 = 4,995,000 after general conditions. 4,995,000 × 1.13 = $5,644,350. The markups compound in sequence rather than being summed into a single percentage, which is where the common error arises." },

{ t:"pdd-02", k:"num", q:"A joint will move ¼ inch in each direction. Using a sealant rated ±25%, what minimum joint width is required, in inches?",
  a:1, tol:0.02,
  why:"A ±25% sealant accommodates 25% of the joint width in each direction. For ¼ inch of movement each way, the joint must be at least 1 inch wide. Sealant depth should then be about half the width, with backer rod setting it and acting as a bond breaker." },

{ t:"pdd-01", k:"place", q:"Place each mortar type with its typical application.",
  items:["Type M","Type N","Type O"],
  targets:["Below grade, foundations, retaining walls","General purpose above grade","Interior non-load-bearing"],
  a:[0,1,2],
  why:"Strength descends M (2,500 psi), S (1,800), N (750), O (350) — every other letter of MaSoNwOrK. Stronger is not better: mortar should be weaker than the units so cracks occur in repointable joints rather than through the brick." },

{ t:"pdd-03", k:"place", q:"Place each specification item in the correct SectionFormat part.",
  items:["Warranty requirements","Manufacturers and materials","Field quality control and testing"],
  targets:["Part 1 — General","Part 2 — Products","Part 3 — Execution"],
  a:[0,1,2],
  why:"Part 1 holds summary, references, submittals, quality assurance, delivery and warranty. Part 2 holds manufacturers, materials, mixes and fabrication. Part 3 holds examination, preparation, installation, field quality control, cleaning and protection." },

{ t:"pdd-05", k:"place", q:"Place each acoustic rating with what it measures.",
  items:["STC","IIC","NRC"],
  targets:["Airborne sound transmission through an assembly","Impact sound through a floor-ceiling assembly","Sound absorption at a surface"],
  a:[0,1,2],
  why:"STC and IIC both measure transmission, of different kinds of energy: airborne and impact. NRC measures absorption, which controls reverberation inside a room and does nothing to stop sound reaching the next room — the most commonly confused pair." },

{ t:"pdd-04", k:"multi", q:"Which information belongs on drawings rather than in the specifications? Select all that apply.",
  c:["The location of a movement joint","The ASTM standard a product must meet","The dimension from grid to face of masonry","The required manufacturer's warranty period","Room numbers and door tags"],
  a:[0,2,4],
  why:"Drawings show quantity, location and relationship; specifications state quality and performance. Joint locations, dimensions and tags are locational. ASTM standards and warranty periods are quality requirements, and putting either on a drawing creates a second source of truth that will diverge at the first revision." },

{ t:"pdd-01", k:"multi", q:"Which materials expand over time and therefore require expansion joints rather than control joints? Select all that apply.",
  c:["Clay brick","Concrete masonry units","Cast-in-place concrete","Fired clay tile"],
  a:[0,3],
  why:"Fired clay products take up moisture after manufacture and grow irreversibly, so they need expansion joints. Concrete and concrete masonry lose moisture and shrink, needing control joints — deliberately weakened planes that make shrinkage cracking occur in a planned line." },

{ t:"pdd-06", k:"multi", q:"Which conditions require a tested firestop system rather than generic sealant? Select all that apply.",
  c:["A steel pipe through a 2-hour shaft wall","A PVC pipe through a 2-hour shaft wall","The head-of-wall joint at a rated partition","A painted gypsum joint in a non-rated partition"],
  a:[0,1,2],
  why:"Every penetration and joint in a rated assembly needs a system tested for that exact condition — penetrant material, opening size, annular space and assembly type. PVC additionally needs an intumescent collar because it melts away. A non-rated partition has no rating to maintain." }
]);

add("ce", [
{ t:"ce-04", k:"num", q:"A payment application shows $8,420,000 completed and stored to date, with 10% retainage and $7,100,000 in previous certificates. Calculate the current payment due in dollars, without a comma or dollar sign.",
  a:478000, tol:0.005,
  why:"Retainage at 10% is $842,000, so earned less retainage is $7,578,000. Deducting previous certificates of $7,100,000 leaves $478,000 due this period." },

{ t:"ce-02", k:"multi", q:"Which actions are within the architect's authority under A201? Select all that apply.",
  c:["Reject work that does not conform to the contract documents","Order the contractor to stop the work","Require additional inspection or testing","Order minor changes with no cost or time effect","Direct the contractor's construction sequence"],
  a:[0,2,3],
  why:"The architect may reject non-conforming work, require testing, and order minor changes involving no adjustment to sum or time. Stopping the work is the owner's right, and directing sequence is means and methods reserved to the contractor — the two authorities architects most often over-claim." },

{ t:"ce-04", k:"multi", q:"Which are express grounds for withholding certification under A201? Select all that apply.",
  c:["Defective work not remedied","Failure to make payments properly to subcontractors","Reasonable evidence the work cannot be completed for the unpaid balance","The architect's disagreement with the contractor's schedule","Persistent failure to carry out the work per the contract documents"],
  a:[0,1,2,4],
  why:"The listed grounds all protect the owner's money: defective work, third-party claims, unpaid subcontractors, insufficient remaining balance, damage to others, anticipated late completion with inadequate balance, and persistent failure to perform. Disagreement about the schedule is not among them." },

{ t:"ce-01", k:"place", q:"Place each document with where it belongs.",
  items:["Instructions to bidders","A201 General Conditions","Approved shop drawings"],
  targets:["Bidding requirements — ceases at award","Contract documents","Not a contract document"],
  a:[0,1,2],
  why:"The bidding requirements govern how bids are prepared and stop applying at award. A201 is a contract document incorporated into the agreement. Shop drawings are expressly not contract documents and never modify the drawings and specifications, however they are stamped." },

{ t:"ce-07", k:"multi", q:"Which must the contractor submit before final payment? Select all that apply.",
  c:["An affidavit that debts connected with the work are paid or satisfied","Consent of surety to final payment","A certificate that required insurance will not lapse without 30 days' notice","Lien releases and waivers or an indemnity bond","The contractor's bid worksheets"],
  a:[0,1,2,3],
  why:"All four are required by A201 where applicable. Consent of surety matters where bonds were furnished, because paying in full without it can discharge the surety. The contractor's internal bid worksheets are never a contract submission." },

{ t:"ce-05", k:"num", q:"A claim must be initiated by written notice within how many days after the event giving rise to it, or after the claimant first recognises the condition?",
  a:21, tol:0.01,
  why:"A201 requires written notice within 21 days of the event or its recognition, whichever is later. The same 21 days is the outside limit for notice of a concealed condition — which must also be given before the conditions are disturbed." },

{ t:"ce-06", k:"place", q:"Place each uncovering situation with who bears the cost.",
  items:["Work covered contrary to the architect's specific request to observe it","No request made, and the uncovered work conforms","No request made, and the uncovered work does not conform"],
  targets:["Contractor, regardless of findings","Owner","Contractor"],
  a:[0,1,2],
  why:"The principle is consistent: the contractor pays when it has done something wrong or defeated the architect's ability to observe, and the owner pays when the contractor has done nothing wrong. Work through any uncovering question by asking those two questions in that order." },

{ t:"ce-03", k:"multi", q:"The architect's submittal review is expressly NOT for which purposes? Select all that apply.",
  c:["Determining accuracy of dimensions and quantities","Reviewing fabrication processes and construction means and methods","Checking conformance with the design concept","Coordinating the work among trades","Approving safety precautions"],
  a:[0,1,3,4],
  why:"A201 states the review is only for the limited purpose of checking for conformance with information given and the design concept expressed in the contract documents. Everything else listed — dimensions, fabrication, trade coordination and safety — remains the contractor's responsibility." }
]);
})();
