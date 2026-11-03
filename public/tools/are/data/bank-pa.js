window.ARE_DATA.pa.exam = [

{ t:"pa-01", q:"A programmer interviews department heads who each request 20% more area than their current space. The total exceeds the budget by 45%. What step does this belong to?",
  c:["Establish goals","Collect and analyse facts","Determine needs","State the problem"],
  a:2, why:"Reconciling what is wanted against what can be afforded is the determine-needs step. Collecting facts gathered the requests; determining needs is where they are tested against the budget and the real requirement is separated from the aspiration." },

{ t:"pa-01", q:"Which programming output tells a designer that the pharmacy must be adjacent to the nurse station but must not be adjacent to the public lobby?",
  c:["The space data sheet","The adjacency matrix","The stacking diagram","The gross area projection"],
  a:1, why:"An adjacency matrix scores required closeness between every pair of spaces, including negative relationships — undesirable adjacencies such as a secure pharmacy beside a public lobby. Space data sheets describe one space; stacking assigns departments to floors." },

{ t:"pa-01", q:"A client says the new building should 'feel welcoming and support collaboration'. In programming terms, what is this?",
  c:["A fact","A goal","A need","A space requirement"],
  a:1, why:"Goals are qualitative statements of what the client wants to achieve. They are not measurable in themselves, which is why the process moves from goals to facts to concepts to needs before stating the problem the design must solve." },

{ t:"pa-01", q:"Which data-gathering method is most likely to reveal that a department's stated need for storage is actually a filing practice that could be eliminated?",
  c:["A questionnaire","Direct observation of how the space is used","A review of the existing floor plan","Benchmarking against comparable facilities"],
  a:1, why:"People describe what they believe they need in terms of the current arrangement. Observation shows what actually happens — including that the stored material is never retrieved — which is how a programmer distinguishes a requirement from a habit." },

{ t:"pa-01", q:"A program includes a 20-year growth projection. Under Peña's framework, which consideration does this address, and why does it matter?",
  c:["Function — it describes activities","Form — it describes the site","Economy — it describes the budget","Time — it addresses past, present and future"],
  a:3, why:"Time covers past, present and future, including growth and phasing. It matters because a building sized only for the organisation as it is today will be wrong within a few years, and expansion capacity is far cheaper to design in than to add later." },

{ t:"pa-02", q:"A program totals 44,000 net assignable square feet for a hospital department. Using a 55% efficiency, what gross area results?",
  c:["24,200 gsf","80,000 gsf","66,000 gsf","79,200 gsf"],
  a:1, why:"Gross = net ÷ efficiency = 44,000 ÷ 0.55 = 80,000 gsf. Hospitals sit at the low end of the efficiency range because of extensive separated circulation and very large mechanical and support areas. Multiplying instead of dividing gives 24,200, which is smaller than the net — impossible." },

{ t:"pa-02", q:"Two office schemes serve the same 24,000 net square feet. Scheme A is 28,800 gsf and scheme B is 32,000 gsf. What is the difference in efficiency?",
  c:["Both are 83% efficient","A is 83%, B is 75%","A is 75%, B is 83%","Efficiency cannot be compared without the floor count"],
  a:1, why:"24,000 ÷ 28,800 = 83.3%; 24,000 ÷ 32,000 = 75%. Scheme B needs 3,200 more gross square feet to deliver the same usable program, and must build, condition, clean and maintain all of it for the life of the building." },

{ t:"pa-02", q:"A developer leases 15,000 rentable square feet with a 12% load factor. The tenant complains the space measures less than 15,000. What should the architect explain?",
  c:["The measurement is in error and should be remeasured","Rentable area includes a share of building common areas; usable area is approximately 13,393 sf","Load factor applies only to multi-tenant floors","The lease should be renegotiated"],
  a:1, why:"Rentable = usable × (1 + load factor), so usable = 15,000 ÷ 1.12 ≈ 13,393 sf. The difference is the tenant's proportionate share of lobbies, corridors and shared facilities, which is standard under BOMA and should be explained before the lease is signed, not after." },

{ t:"pa-02", q:"A 60,000 gsf school is proposed at a construction cost of $385 per square foot, with soft costs at 28% of construction. What is the total project cost?",
  c:["$23,100,000", "$29,568,000", "$16,632,000", "$32,088,000"],
  a:1, why:"Construction = 60,000 × 385 = $23,100,000. Soft costs = 23,100,000 × 0.28 = $6,468,000. Total = $29,568,000. Note that the cost rate applies to gross area, since corridors, mechanical rooms and structure all have to be built." },

{ t:"pa-02", q:"Which building type would you expect to have the HIGHEST efficiency ratio?",
  c:["Research laboratory","Distribution warehouse","Art museum","Teaching hospital"],
  a:1, why:"A warehouse is nearly all assignable floor with minimal circulation and little mechanical distribution, reaching 85–95%. Laboratories, museums and hospitals all carry heavy service, circulation and support areas, which drives their efficiency down toward 50–65%." },

{ t:"pa-03", q:"A site slopes 18 feet over a 120-foot run. What is the slope, and is an accessible route possible along that line without ramping?",
  c:["15% — yes, within the 5% maximum","15% — no, it exceeds 5% and would require ramps or a longer switchback route","1.5% — yes","6.7% — no, ramps are required"],
  a:1, why:"18 ÷ 120 = 0.15, or 15%. An accessible route may not exceed 5% running slope without becoming a ramp, and a ramp may not exceed 8.33%. At 15%, the route must either switchback to lengthen the run or be built as a series of ramps with landings." },

{ t:"pa-03", q:"A soils report shows bedrock at 4 feet below grade across most of the site, but 32 feet below grade at one corner where the building is proposed. What is the concern?",
  c:["The bedrock will require blasting","Differential settlement if part of the building bears on rock and part on the deeper soil","The water table will be too high","Frost depth will vary across the site"],
  a:1, why:"Mixed bearing conditions settle unequally, racking the structure and cracking finishes. The remedies are to carry the whole building to competent strata with piers or piles, to shift the footprint onto uniform conditions, or to separate the portions with a movement joint." },

{ t:"pa-03", q:"Contour lines on a survey are spaced very closely in one area and widely in another. What does this show?",
  c:["Closely spaced contours indicate flat ground","Closely spaced contours indicate steep ground","Spacing indicates soil type","Spacing indicates drainage direction only"],
  a:1, why:"Contours join points of equal elevation at a fixed vertical interval, so the closer they are in plan, the less horizontal distance covers that vertical change — which is steep ground. Wide spacing means the same elevation change spreads over a long distance." },

{ t:"pa-03", q:"A development will increase impervious area on a site from 15% to 62%. The municipality caps post-development peak runoff at the pre-development rate. What is required?",
  c:["A larger connection to the municipal storm sewer","Detention or infiltration capacity sized to hold back the increase","A floodplain development permit","A larger sanitary sewer connection"],
  a:1, why:"The ordinance limits the rate leaving the site, so the additional runoff from new paving and roof must be detained and released slowly, or infiltrated through swales, rain gardens and permeable paving. A larger pipe discharges faster, which is the opposite of the requirement." },

{ t:"pa-03", q:"A portion of a site lies within the regulatory floodway. What development is generally permitted there?",
  c:["Buildings elevated above the base flood elevation","Essentially none — the floodway must remain clear to carry flood flows","Buildings with floodproofed ground floors","Parking structures only"],
  a:1, why:"The floodway is the channel and adjacent land that must stay unobstructed to convey the flood. Development there is generally prohibited outright. Elevation and floodproofing are the remedies in the wider floodplain fringe, not in the floodway itself." },

{ t:"pa-03", q:"A percolation test returns a very slow rate on a rural site with no public sewer. What is the consequence?",
  c:["The site cannot support a building of any kind","A conventional septic leach field may be unworkable or must be much larger, constraining the buildable area","Groundwater will be contaminated","Foundations must be deepened"],
  a:1, why:"Percolation rate governs how much area a leach field needs to absorb effluent. Slow percolation means a far larger field, an engineered alternative system, or no on-site disposal at all — any of which constrains where and how large the building can be." },

{ t:"pa-04", q:"A 50,000 sf lot is zoned FAR 1.2 with a maximum lot coverage of 35% and a 3-storey height limit. What is the largest permitted building?",
  c:["60,000 sf, limited by FAR","52,500 sf, limited by lot coverage over 3 storeys","17,500 sf, limited by coverage","150,000 sf, limited by height"],
  a:1, why:"FAR permits 50,000 × 1.2 = 60,000 sf. Coverage permits a 17,500 sf footprint, which over 3 storeys gives 52,500 sf. The smaller result governs, so lot coverage binds at 52,500 sf — the reverse of the usual case, which is why both must be calculated." },

{ t:"pa-04", q:"A 6-acre parcel is zoned at 8 dwelling units per acre. How many units are permitted?",
  c:["48 units","8 units","6 units","261,360 units"],
  a:0, why:"6 acres × 8 units per acre = 48 units. Density is an aggregate control over the parcel, not a requirement that each unit occupy a particular lot size. Remember 1 acre = 43,560 square feet when a question mixes density with area." },

{ t:"pa-04", q:"A restaurant is proposed in a district where restaurants are listed as a conditional use. What does the owner need?",
  c:["A use variance, requiring proof of hardship","A conditional use permit, granted on compliance with stated criteria","A rezoning of the parcel","Nothing — conditional uses are permitted by right"],
  a:1, why:"A conditional use is one the ordinance already contemplates in that district, subject to review against stated criteria and conditions. It is a far lower bar than a use variance, which asks permission for something the ordinance does not allow at all and requires hardship." },

{ t:"pa-04", q:"A corner lot is subject to front setbacks on two street frontages. What is the effect?",
  c:["The owner may choose which frontage is the front","The buildable area is reduced on both street sides, since both are treated as front yards","Only the narrower frontage requires a front setback","Corner lots are exempt from front setbacks"],
  a:1, why:"Most ordinances treat both street-facing sides of a corner lot as front yards, applying the larger front setback to each. The buildable envelope shrinks accordingly, which is why corner lots often yield less building than their area suggests." },

{ t:"pa-04", q:"A neighbourhood association enforces a covenant limiting building height to two storeys. The zoning ordinance permits four. What governs?",
  c:["The zoning ordinance, as public law supersedes private agreements","Both — the covenant is privately enforceable and effectively limits the project to two storeys","The covenant lapses when zoning is amended","The building official decides"],
  a:1, why:"CC&Rs operate independently of zoning and may be stricter. Complying with the ordinance does not excuse breaching a recorded private covenant, which the benefited parties can enforce in court. The practical limit is the stricter of the two." },

{ t:"pa-04", q:"A comprehensive plan designates a corridor for higher-density mixed use, but the zoning map has not been amended. A developer proposes a project consistent with the plan. What is needed?",
  c:["Nothing — the comprehensive plan is binding","A rezoning or map amendment, with plan consistency as supporting argument","A dimensional variance","A conditional use permit"],
  a:1, why:"The comprehensive plan is policy that guides; the zoning ordinance is the enforceable regulation. Consistency with the plan is often required for a rezoning and is a strong argument for one, but it does not by itself authorise what the map prohibits." },

{ t:"pa-05", q:"A 24,000 sf retail floor is proposed. What is its occupant load?",
  c:["160","400","240","1,600"],
  a:1, why:"Mercantile uses 60 square feet gross per occupant: 24,000 ÷ 60 = 400. Because the factor is gross, it applies to the whole floor including back-of-house, circulation and restrooms, with no deduction." },

{ t:"pa-05", q:"A 7,500 sf net assembly space is laid out with chairs only, in rows. What is the occupant load?",
  c:["500","1,071","1,500","125"],
  a:1, why:"Concentrated assembly with chairs only and no tables uses 7 square feet net per occupant: 7,500 ÷ 7 ≈ 1,071. Unconcentrated assembly with tables and chairs would use 15 net, giving 500 — the distractor." },

{ t:"pa-05", q:"A building contains a 9,000 sf office and a 1,000 sf accessory storage room on the same storey. How should the storage be classified?",
  c:["As a separate S occupancy requiring a fire barrier","As an accessory occupancy following the main Business occupancy, since it is 10% or less of the storey","As a non-separated mixed occupancy applying the most restrictive requirements","As a high-hazard occupancy"],
  a:1, why:"An accessory occupancy occupies no more than 10% of the storey and follows the main occupancy's requirements without separate treatment. At exactly 10% of a 10,000 sf storey, the storage qualifies, which avoids both the barriers of separated mixed occupancy and the penalties of non-separated." },

{ t:"pa-05", q:"A proposed building exceeds the tabular allowable height by one storey. Which measure most directly resolves it?",
  c:["Adding a fire wall","Providing automatic sprinklers throughout, which commonly permits one additional storey and 20 feet","Increasing the frontage","Reducing the occupant load"],
  a:1, why:"Sprinklers throughout commonly add one storey and 20 feet to the allowable height, as well as increasing allowable area. A fire wall divides a building in plan and does not address height, and frontage increases apply to area rather than height." },

{ t:"pa-05", q:"An outpatient clinic performs procedures from which patients recover fully and leave unassisted. How is it classified?",
  c:["Group I-2, Institutional","Group B, Business","Group A-3, Assembly","Group R-4, Residential"],
  a:1, why:"Outpatient care where occupants can evacuate unassisted is Business. The classification shifts to Institutional only where care is inpatient, or where treatment renders occupants incapable of self-preservation — general anaesthesia being the standard example." },

{ t:"pa-05", q:"A storey contains 6,000 sf of Group A-2 restaurant and 14,000 sf of Group B office, separated by fire barriers. Which approach is being used?",
  c:["Accessory occupancy","Non-separated mixed occupancy","Separated mixed occupancy","Single occupancy classification"],
  a:2, why:"Fire barriers between occupancies indicate the separated approach, under which each occupancy is judged against its own allowable area and the sum of actual-to-allowable ratios must not exceed 1.0. Non-separated omits the barriers and applies the strictest requirements throughout." },

{ t:"pa-06", q:"At 45° N latitude, what is the approximate solar altitude at noon on the summer solstice?",
  c:["45°","68.5°","21.5°","90°"],
  a:1, why:"Equinox noon altitude is 90 − 45 = 45°. The summer solstice adds 23.5°: 45 + 23.5 = 68.5°. The winter solstice subtracts it, giving 21.5° — which explains why south-facing overhangs work so well at this latitude." },

{ t:"pa-06", q:"On which date does the sun rise due east and set due west at every location on earth?",
  c:["The summer solstice","The winter solstice","The equinoxes","It varies by latitude on all dates"],
  a:2, why:"At the equinoxes the sun's declination is zero, so it rises due east and sets due west everywhere, with day and night equal. At the solstices it rises and sets well north or south of those points, by an amount that increases with latitude." },

{ t:"pa-06", q:"A site in a hot–arid climate has a 35°F daily temperature swing. Which strategy exploits this?",
  c:["Lightweight construction with high insulation and no mass","Heavy thermal mass with night ventilation to discharge stored heat","Continuous mechanical dehumidification","An elongated plan one room deep"],
  a:1, why:"Thermal mass absorbs heat during the hot day and releases it at night, flattening the interior swing — but only where nights are cool enough to discharge it. A 35°F swing provides exactly that. In a humid climate with warm nights the same mass becomes a liability." },

{ t:"pa-06", q:"A building's north face in the northern hemisphere receives which kind of daylight?",
  c:["Direct sun for most of the day, with high heat gain","Consistent diffuse light with minimal direct sun and low heat gain","No daylight at all","Direct low-angle sun in the afternoon"],
  a:1, why:"North glazing receives predominantly diffuse sky light with little direct sun, giving even illumination and low solar gain — which is why studios, galleries and drafting rooms have traditionally faced north. It does receive some early morning and late evening sun in summer." },

{ t:"pa-06", q:"A site records 1,200 heating degree days and 3,400 cooling degree days. What does this indicate about design priorities?",
  c:["Minimising envelope heat loss and capturing winter solar gain","Shading, reducing solar gain, and moving air","Balanced strategies for both seasons","Insufficient information to determine"],
  a:1, why:"Cooling degree days far exceeding heating degree days describes a cooling-dominated climate. The priorities become shading of all exposures, low solar heat gain glazing, light-coloured surfaces, and ventilation — not the compactness and solar capture that suit heating climates." },

{ t:"pa-06", q:"A proposed building will cast afternoon shadows across a neighbouring property's solar array. What should the architect do?",
  c:["Nothing — there is no right to sunlight","Check whether the jurisdiction protects solar access and prepare shadow studies","Relocate the neighbour's array","Reduce the building height by one storey"],
  a:1, why:"Some jurisdictions protect solar access by ordinance, and many require shadow studies for taller buildings in dense contexts. Establishing what applies, and documenting the impact, is the responsible first step — the answer may be that nothing is required, but that must be verified rather than assumed." },

{ t:"pa-07", q:"A 10-foot wide drainage easement crosses the centre of the only level area of a site. What is the effect on the program?",
  c:["None, since easements permit surface construction","The buildable area is reduced, and relocating the drainage or shifting the footprint must be costed early","The easement may be built over with a permit","The easement applies only below grade"],
  a:1, why:"An easement grants another party the right to use that land and runs with it, so building over it is not permitted. The realistic options — shifting the footprint or paying to relocate the drainage — both carry cost and schedule consequences that belong in programming." },

{ t:"pa-07", q:"A 320-space parking lot is proposed. How many accessible spaces are required?",
  c:["7","8","6","9"],
  a:1, why:"The ADA Standards require 8 accessible spaces for a total between 301 and 400. Seven covers 201 to 300. One in every six accessible spaces must be van accessible, so 8 accessible spaces requires 2 van accessible." },

{ t:"pa-07", q:"The street main serving a site delivers inadequate flow for the required sprinkler system. What is the programming consequence?",
  c:["The building must be reduced in size","A fire pump and possibly a storage tank are required, consuming floor area and budget","Sprinklers may be omitted","The water utility must upgrade the main at no cost"],
  a:1, why:"Inadequate flow is solved with a fire pump and often a stored water supply, both of which take programmed space, structural support and significant budget. Identifying it through a flow test during site analysis is what prevents it appearing as a surprise in design development." },

{ t:"pa-07", q:"A fire apparatus access road is proposed at 18 feet wide. What is the likely issue?",
  c:["It exceeds the maximum permitted width","It is below the typical 20-foot minimum clear width required for fire apparatus access","It requires a 5% maximum slope","Fire access roads must be 30 feet wide"],
  a:1, why:"Fire apparatus access roads generally require a minimum 20-foot unobstructed width, with 13 feet 6 inches of vertical clearance, adequate weight capacity and usable turning radii. These are code requirements that constrain the site plan from the beginning." },

{ t:"pa-07", q:"A site is adjacent to a rail line carrying freight at night. Which response best addresses it?",
  c:["Specify higher STC glazing on all facades equally","Organise the plan so service and circulation buffer the rail side, with quiet occupied spaces away from it","Increase the setback by 10 feet","Add absorptive finishes inside the occupied rooms"],
  a:1, why:"Solving the problem with the plan arrangement is cheaper and more effective than solving it with assemblies on every exposure. Once the plan buffers the noise source, glazing and wall specification handle what remains on that one side. Absorptive finishes affect reverberation, not transmission." },

{ t:"pa-08", q:"A 1920s warehouse is proposed for conversion to apartments. Which assessment question is most likely to be favourable?",
  c:["Structural capacity, since warehouse live loads typically exceed residential","Envelope condition","Hazardous materials","Current code compliance"],
  a:0, why:"Warehouses are designed for heavy storage loads — often 125 psf or more — while residential requires about 40 psf. That is one of the few conversions where the existing structure has surplus capacity. Envelope, hazardous materials and code compliance usually all require substantial work." },

{ t:"pa-08", q:"An office building produces $2,100,000 of net operating income. Comparable properties trade at a 6% capitalisation rate. What is its approximate value?",
  c:["$12,600,000","$35,000,000","$126,000","$31,500,000"],
  a:1, why:"Value = NOI ÷ cap rate = 2,100,000 ÷ 0.06 = $35,000,000. The relationship explains why a modest permanent increase in net income, or a reduction in operating cost, has a large effect on a property's value." },

{ t:"pa-08", q:"Which Secretary of the Interior's treatment permits alteration to accommodate a new use while retaining significant features?",
  c:["Preservation","Rehabilitation","Restoration","Reconstruction"],
  a:1, why:"Rehabilitation makes a compatible use possible through repair and alteration while preserving the features that convey significance. It is the treatment nearly all adaptive reuse employs, and its standards require new work to be differentiated from the old yet compatible in scale, massing and materials." },

{ t:"pa-08", q:"A private owner wishes to demolish a building listed on the National Register, using private funds, in a city with no local historic district ordinance. What applies?",
  c:["Demolition is prohibited by the National Register listing","Listing alone does not prevent demolition by a private owner using private funds","A certificate of appropriateness is required","Federal approval is required"],
  a:1, why:"The National Register governs federal undertakings and establishes eligibility for tax credits. It does not restrict what a private owner does with private money. Local historic district ordinances are the mechanism that actually limits private demolition and alteration." },

{ t:"pa-08", q:"An energy retrofit costs $520,000 and saves $65,000 annually. What is the simple payback period?",
  c:["6 years","8 years","12.5 years","4 years"],
  a:1, why:"520,000 ÷ 65,000 = 8 years. Simple payback is easy to communicate but ignores everything beyond break-even — continuing savings, maintenance, replacement and the time value of money — which is what life-cycle cost analysis captures." },

{ t:"pa-08", q:"Altering the main dining room of a restaurant triggers an obligation to provide an accessible path of travel. What limits that obligation?",
  c:["It applies only to new construction","A disproportionality limit, commonly 20% of the cost of the alteration","It applies only if the building is over 3,000 sf","It is limited to the altered room itself"],
  a:1, why:"Where a primary function area is altered, an accessible path of travel to it — including the restrooms, telephones and drinking fountains serving it — must be provided, except where the cost is disproportionate, commonly set at 20% of the alteration cost." }

];
