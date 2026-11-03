window.ARE_DATA.ppd.exam = [

{ t:"ppd-01", q:"A sprinklered Group B floor measures 240 ft by 100 ft. What is the minimum separation between two required exits?",
  c:["130 ft","87 ft","260 ft","120 ft"],
  a:1, why:"The diagonal is √(240² + 100²) = √(57,600 + 10,000) = √67,600 = 260 ft. Sprinklered, exits must be at least one third of the diagonal apart: 260 ÷ 3 ≈ 87 ft. Unsprinklered would require one half, or 130 ft." },

{ t:"ppd-01", q:"A space has an occupant load of 620. How many exits are required?",
  c:["2","3","4","5"],
  a:1, why:"Two exits serve 1 to 500 occupants, three serve 501 to 1,000, and four are required above 1,000. At 620 occupants, three exits are required." },

{ t:"ppd-01", q:"A corridor in a sprinklered Group M building has a 44-foot dead end. Does it comply?",
  c:["No — the limit is 20 feet in all occupancies","Yes — sprinklered B, F, M, R-2 and S occupancies are permitted 50 feet","No — dead ends are prohibited in mercantile occupancies","Yes — dead-end limits apply only to Group A"],
  a:1, why:"The general dead-end corridor limit is 20 feet, increased to 50 feet in sprinklered Group B, F, M, R-2 and S occupancies. A 44-foot dead end in a sprinklered mercantile building is within that allowance." },

{ t:"ppd-01", q:"An exit stairway serves a 7-storey building. What fire-resistance rating does its enclosure require?",
  c:["1 hour","2 hours","3 hours","No rating if the building is sprinklered"],
  a:1, why:"Exit enclosures require 1-hour construction where they connect fewer than four storeys and 2-hour construction at four storeys or more. Sprinklering reduces many requirements but does not eliminate the exit enclosure rating." },

{ t:"ppd-01", q:"Where is exit access travel distance measured to?",
  c:["The exterior door at grade","The public way","The entrance to the exit, such as the stair enclosure door","The bottom of the exit stair"],
  a:2, why:"Travel distance runs from the most remote occupied point to the entrance to an exit. Once inside the exit — an enclosed stair, an exit passageway, an exterior door — the occupant is in a protected path and the measurement stops." },

{ t:"ppd-01", q:"A door serves a space with an occupant load of 62 in a Group A occupancy. Which two requirements apply?",
  c:["It may swing either direction, and no panic hardware is required","It must swing in the direction of egress, and panic hardware is required","It must swing in the direction of egress, but panic hardware is not required","Neither requirement applies below 100 occupants"],
  a:1, why:"A door serving 50 or more occupants must swing in the direction of egress travel, and assembly and educational occupancies with an occupant load of 50 or more require panic hardware. At 62 occupants in Group A, both apply." },

{ t:"ppd-01", q:"A stair flight has risers measuring 6½\", 6¾\", 7\" and 6⅝\". Does the flight comply?",
  c:["Yes — all risers are within the 4\" to 7\" range","No — the variation between largest and smallest exceeds ⅜\"","Yes — variation is unrestricted within a flight","No — the minimum riser is 5\""],
  a:1, why:"All four risers fall within the 4\" to 7\" range, but the largest is 7\" and the smallest 6½\", a variation of ½\". That exceeds the ⅜\" limit between the largest and smallest riser in a flight. Uneven risers cause falls, which is why the tolerance is tight." },

{ t:"ppd-01", q:"A guard protects a drop of 36 inches. What is the minimum height and the opening limitation?",
  c:["36\" high; 6\" sphere","42\" high; 4\" sphere","34\" high; 4\" sphere","42\" high; no opening limit"],
  a:1, why:"Guards are required where the drop exceeds 30 inches and must be at least 42 inches high, with openings that will not permit passage of a 4-inch sphere. The 34-to-38-inch dimension is handrail height, which is a different element." },

{ t:"ppd-01", q:"An unsprinklered Group A assembly space has a travel distance of 230 feet. What applies?",
  c:["It complies — the limit is 250 feet","It exceeds the 200-foot unsprinklered limit for Group A","It complies — assembly occupancies have no travel distance limit","It exceeds the 150-foot limit for Group A"],
  a:1, why:"Groups A, E, M, R and I-1 are limited to 200 feet of travel distance unsprinklered, rising to 250 feet when sprinklered. At 230 feet the design either needs sprinklers or a revised plan shortening the path." },

{ t:"ppd-02", q:"A 2-hour fire barrier separates a parking garage from a residential occupancy. What door rating is required in it?",
  c:["2 hours","1½ hours","1 hour","45 minutes"],
  a:1, why:"Opening protectives are rated below the wall they occupy. A 2-hour fire barrier takes a 1½-hour door. A 1-hour corridor fire partition takes a 20-minute door, and a 1-hour exit enclosure or shaft takes a 1-hour door." },

{ t:"ppd-02", q:"Which assembly must be structurally independent so that collapse on one side does not bring it down?",
  c:["Fire barrier","Fire partition","Fire wall","Smoke barrier"],
  a:2, why:"A fire wall runs from foundation to or through the roof and is designed with sufficient structural stability to remain standing if construction on either side collapses. That independence is what allows it to create separate buildings for code purposes." },

{ t:"ppd-02", q:"A building is proposed with zero setback from the side property line. What is the consequence for that exterior wall?",
  c:["A higher required rating and no unprotected openings permitted","A lower rating, since no exposure exists","Only a sprinkler requirement","No consequence if the neighbour consents in writing"],
  a:0, why:"Fire separation distance is measured to the property line, because the neighbouring parcel may be redeveloped at any time. At zero separation the required rating is highest and unprotected openings are prohibited — producing the blank party wall characteristic of dense urban construction." },

{ t:"ppd-02", q:"What is the defining height threshold for a high-rise building?",
  c:["An occupied floor more than 55 feet above fire department vehicle access","An occupied floor more than 75 feet above the lowest level of fire department vehicle access","Any building over 6 storeys","Any building over 100 feet tall"],
  a:1, why:"The threshold is an occupied floor more than 75 feet above the lowest level of fire department vehicle access — roughly the reach of ground-based firefighting. Crossing it triggers sprinklers, standpipes, a fire command centre, emergency power, smokeproof enclosures and fire service elevator operation." },

{ t:"ppd-02", q:"Which protection method preserves the visible profile of an exposed structural steel column?",
  c:["Sprayed fire-resistive material","Concrete encasement","Intumescent coating","Gypsum board enclosure"],
  a:2, why:"Intumescent coating is a thin film that swells into an insulating char when heated, so the steel member's shape remains visible. SFRM is rough and unsightly; encasement and gypsum enclosure both conceal the member entirely." },

{ t:"ppd-02", q:"A duct penetrates a smoke barrier in a Group I-2 hospital. What is required?",
  c:["A fire damper only","A smoke damper, or a combination fire/smoke damper where both conditions apply","No damper, since smoke barriers are not rated","An access panel only"],
  a:1, why:"Fire dampers protect penetrations of fire-rated assemblies; smoke dampers protect penetrations of smoke barriers. Where an assembly is both, a combination fire/smoke damper is used. All require accessible service openings so they can be inspected and reset." },

{ t:"ppd-02", q:"How much does a sprinkler system throughout typically increase allowable area for a multi-storey building?",
  c:["It does not affect allowable area","It commonly doubles it","It commonly triples it","It increases it by 20%"],
  a:1, why:"Sprinklers commonly double the allowable area for multi-storey buildings and triple it for single-storey buildings, plus adding one storey and 20 feet of height. It is the single most powerful adjustment in the allowable-area calculation." },

{ t:"ppd-02", q:"A corridor wall is constructed as a 1-hour fire partition. How far must it extend?",
  c:["To the underside of the suspended ceiling only","To the underside of the floor or roof deck above, or to a fire-resistance-rated ceiling membrane","Through the roof","To the top of the parapet"],
  a:1, why:"A fire partition extends to the underside of the floor or roof deck above, or terminates at a rated ceiling membrane that is part of the assembly. That is less continuity than a fire barrier, which must always reach the deck." },

{ t:"ppd-02", q:"Which standard covers sprinkler systems in residential buildings up to four storeys?",
  c:["NFPA 13","NFPA 13R","NFPA 13D","NFPA 72"],
  a:1, why:"NFPA 13R covers residential occupancies up to four storeys, 13D covers one- and two-family dwellings, and 13 is the general standard for all other occupancies. NFPA 72 is the fire alarm code." },

{ t:"ppd-03", q:"An accessible route narrows to 32 inches to pass a structural column. What is the limitation?",
  c:["This is not permitted — 36 inches is required throughout","It is permitted for a maximum length of 24 inches","It is permitted for a maximum length of 48 inches","It is permitted only at doorways"],
  a:1, why:"An accessible route requires 36 inches of clear width, but may narrow to 32 inches for a maximum length of 24 inches — enough to pass an isolated obstruction such as a column. Longer constrictions must maintain the full 36 inches." },

{ t:"ppd-03", q:"A ramp rises 36 inches in a single run at 1:12. What is required?",
  c:["A 36-foot run with no intermediate landing","A 36-foot run with an intermediate landing, since the maximum rise per run is 30 inches","A 30-foot run with handrails","A 43-foot run at 1:14"],
  a:1, why:"At 1:12, 36 inches of rise needs 36 feet of run, but the maximum rise permitted in a single run is 30 inches. The ramp must therefore be broken with a level landing at least 60 inches long, with handrails on both sides throughout." },

{ t:"ppd-03", q:"What is the maximum height of an accessible lavatory rim or counter surface?",
  c:["29 inches","34 inches","36 inches","32 inches"],
  a:1, why:"The rim or counter surface may be no more than 34 inches above the floor, with knee clearance 27 inches high at the front edge, 30 inches wide and 11 to 25 inches deep. The 29-inch figure is sometimes confused with the knee clearance dimension." },

{ t:"ppd-03", q:"A side grab bar at a water closet must be what minimum length, starting where?",
  c:["36 inches, starting at the rear wall","42 inches, starting no more than 12 inches from the rear wall","48 inches, centred on the fixture","36 inches, starting 18 inches from the rear wall"],
  a:1, why:"The side grab bar must be at least 42 inches long and begin no more than 12 inches from the rear wall, so it is positioned where a transfer actually occurs. The rear grab bar must be at least 36 inches long. Both are mounted 33 to 36 inches above the floor." },

{ t:"ppd-03", q:"A door has a closer and a latch, approached head-on from the push side. What maneuvering clearance is required beyond the latch?",
  c:["None","12 inches","18 inches","24 inches"],
  a:1, why:"Front approach on the push side requires 12 inches beyond the latch side where the door has both a closer and a latch. The pull side front approach is more demanding, requiring 18 inches beyond the latch and 60 inches of depth." },

{ t:"ppd-03", q:"Which hardware complies with the ADA Standards?",
  c:["A round doorknob","A thumb-turn deadbolt","A lever handle","A key-operated knob"],
  a:2, why:"Hardware must be operable with one hand and without tight grasping, pinching or twisting of the wrist. Lever handles, push plates and U-pulls comply; knobs and thumb-turns require grasping and twisting and do not." },

{ t:"ppd-03", q:"A 4-storey building is fully sprinklered and has accessible upper floors. Are areas of refuge required at the stairs?",
  c:["Yes, in all multi-storey buildings","Generally no, because the building is sprinklered throughout","Yes, unless an elevator is provided","Only on floors above the third"],
  a:1, why:"Areas of refuge are required where accessible floors are served by stairs in buildings that are not sprinklered throughout. Sprinklering generally removes the requirement, which is one more reason sprinklers are usually the cheaper route to compliance." },

{ t:"ppd-03", q:"A fire extinguisher cabinet projects 5 inches from a corridor wall, with its bottom edge 30 inches above the floor. What is the issue?",
  c:["It is mounted too high for reach range","It protrudes more than 4 inches within the 27-to-80-inch cane detection zone","Fire extinguishers may not be located in corridors","The cabinet must be 36 inches above the floor"],
  a:1, why:"Objects may project no more than 4 inches into a circulation path between 27 and 80 inches above the floor, because a cane passes beneath that band and a person does not clear it overhead. Recessing the cabinet is the standard resolution." },

{ t:"ppd-03", q:"Which standard does the IBC reference for technical accessibility requirements?",
  c:["The 2010 ADA Standards","ICC A117.1","ASHRAE 55","NFPA 101"],
  a:1, why:"The IBC adopts ICC A117.1 as its technical accessibility standard, and that is what a plan reviewer applies. The 2010 ADA Standards are the design requirements of a civil rights law enforced through complaint and litigation. The two are harmonised but not identical." },

{ t:"ppd-04", q:"A 48-foot clear span is required with the shallowest possible floor depth. Which system is most suitable?",
  c:["Concrete flat plate","Post-tensioned concrete","Wood I-joists","Concrete one-way slab on beams"],
  a:1, why:"Post-tensioned concrete spans 25 to 45 feet at roughly span/40 depth and can be pushed further, giving the thinnest floor sandwich at long span. Flat plate tops out near 30 feet, wood I-joists near 40, and a one-way slab on beams adds the beam depth below." },

{ t:"ppd-04", q:"Which lateral system leaves the structural bay completely clear of diagonal obstruction?",
  c:["Braced frame","Moment frame","Shear wall","Diaphragm"],
  a:1, why:"A moment frame resists lateral load through rigid beam-to-column connections, leaving the bay open for glazing or circulation. Braced frames place diagonals in the bay and shear walls fill it entirely. A diaphragm is the horizontal element, not a vertical system." },

{ t:"ppd-04", q:"A building has a stiff core at one end and open framing at the other. What seismic irregularity does this create?",
  c:["Soft storey","Torsional irregularity, as the centre of rigidity is offset from the centre of mass","Re-entrant corner","Diaphragm discontinuity"],
  a:1, why:"When the centre of rigidity does not coincide with the centre of mass, lateral load induces twisting about the stiff element. The far end of the building then displaces much more than the core, concentrating demand on elements never designed for it." },

{ t:"ppd-04", q:"What is the approximate depth rule of thumb for an open-web steel joist?",
  c:["Span/10","Span/20","Span/30","Span/40"],
  a:1, why:"Open-web steel joists run approximately span/20 in depth, as do steel beams at span/20 to span/24 and glulam at span/20. Steel trusses are deeper at span/10 to span/15, and post-tensioned concrete much shallower at span/40." },

{ t:"ppd-04", q:"A heavy structure must be founded where competent soil lies 40 feet below grade under soft clay. Which foundation type fits?",
  c:["Spread footings","A mat foundation","End-bearing piles or drilled piers to the competent stratum","Strip footings"],
  a:2, why:"Spread and strip footings require adequate bearing near the surface. A mat spreads load but still bears on the soft clay. Piles or drilled piers carry the load through the weak material to competent strata at depth, which is what the condition requires." },

{ t:"ppd-04", q:"Why is a column at a property line often supported on a combined footing?",
  c:["To reduce the amount of concrete","Because the footing cannot extend past the property line and so cannot be centred under the column","To resist uplift","To accommodate a higher water table"],
  a:1, why:"An isolated footing must be centred under its column to avoid eccentric loading. At a property line the footing cannot project beyond the boundary, so it is combined with the next interior column's footing, which balances the eccentricity." },

{ t:"ppd-04", q:"Which material offers inherent fire resistance without applied protection?",
  c:["Structural steel","Cast-in-place concrete","Light-gauge steel framing","Light wood framing"],
  a:1, why:"Concrete resists fire through its own mass and low conductivity, with reinforcement protected by cover. Steel loses roughly half its strength near 1,100°F and requires applied protection in nearly all rated construction. Light wood framing relies on gypsum membranes." },

{ t:"ppd-04", q:"What distinguishes a diaphragm from the vertical lateral-resisting elements?",
  c:["It resists gravity load only","It is the horizontal plane that collects lateral load and delivers it to the vertical elements","It is required only in seismic zones","It replaces the need for shear walls"],
  a:1, why:"The floor or roof acts as a horizontal structural element, gathering lateral force across the plan and transferring it to the braced frames, moment frames or shear walls. Every lateral system needs one, and a discontinuous diaphragm is itself a recognised irregularity." },

{ t:"ppd-04", q:"A retaining wall shows outward rotation after a wet spring. What should be examined first?",
  c:["The concrete compressive strength","Whether drainage behind the wall is functioning","The reinforcement cover","The wall's surface finish"],
  a:1, why:"Saturated backfill imposes hydrostatic pressure far beyond the lateral earth pressure most walls are designed for. Blocked weeps, an omitted drainage layer or a failed drain line are the usual causes, and water should always be the first line of inquiry." },

{ t:"ppd-05", q:"Why do tall buildings with many small zones favour water-based distribution over all-air systems?",
  c:["Water systems are less expensive to install","Air carries far less heat per unit volume, so all-air systems require very large ducts and shafts","Water systems require no ventilation","Air systems cannot provide heating"],
  a:1, why:"Moving a given quantity of energy as air requires far greater volume than moving it as water, which translates directly into duct size and shaft area. In a tall building with hundreds of zones, the shaft space an all-air system would consume is prohibitive." },

{ t:"ppd-05", q:"On a winter day, a building's interior zone requires cooling while its north perimeter requires heating. What does this indicate?",
  c:["A control malfunction","A normal condition requiring a system capable of simultaneous heating and cooling","Inadequate envelope insulation","An oversized air handler"],
  a:1, why:"Interior zones are driven by people, lighting and equipment and need cooling year round; perimeter zones lose heat through the envelope. This simultaneous demand is normal, and a two-pipe or single-source system cannot satisfy it no matter how it is zoned." },

{ t:"ppd-05", q:"What percentage of gross floor area should typically be allocated to mechanical space in a hospital?",
  c:["1 to 2%","3 to 4%","Toward the upper end of the 3 to 9% range","Less than 1%"],
  a:2, why:"Mechanical space runs roughly 3 to 9% of gross area, with warehouses at the low end and hospitals and laboratories at the high end because of high ventilation rates, dedicated exhaust and extensive redundancy. Programme it early — it never shrinks later." },

{ t:"ppd-05", q:"Which standard governs ventilation rates for acceptable indoor air quality?",
  c:["ASHRAE 90.1","ASHRAE 62.1","ASHRAE 55","NFPA 90A"],
  a:1, why:"ASHRAE 62.1 sets outdoor air rates per person and per unit area by occupancy. 90.1 governs energy performance and 55 governs thermal comfort — three different standards that are routinely confused on the exam." },

{ t:"ppd-05", q:"A large commercial building uses 277/480V three-phase service rather than 120/208V. Why?",
  c:["Higher voltage is safer","Higher voltage delivers the same power at lower current, so conductors are smaller and losses lower","120V equipment is unavailable","Code requires it above three storeys"],
  a:1, why:"Power is voltage times current, so delivering a given load at higher voltage means lower current, smaller conductors and reduced resistive loss. Lighting runs at 277V and large motors at 480V, with step-down transformers producing 120V for receptacles." },

{ t:"ppd-05", q:"Within what time must an emergency power system transfer on loss of normal power?",
  c:["Immediately, with no interruption","Within 10 seconds","Within 60 seconds","Within 5 minutes"],
  a:1, why:"Emergency systems — egress illumination, exit signs, fire alarm, fire pumps — must transfer within 10 seconds. Legally required standby and optional standby systems serve other loads under less demanding transfer requirements." },

{ t:"ppd-05", q:"What slope is typically required for a 4-inch horizontal sanitary drain?",
  c:["1/16 inch per foot","1/8 inch per foot","1/4 inch per foot","1/2 inch per foot"],
  a:1, why:"Pipes larger than 3 inches commonly require 1/8 inch per foot, while pipes up to 3 inches require 1/4 inch per foot. The slope is why a long horizontal run drops substantially and must be accommodated in the available ceiling depth." },

{ t:"ppd-05", q:"Why must every plumbing trap be vented?",
  c:["To allow the fixture to drain faster","To admit air behind draining water so the trap seal is not siphoned out","To reduce noise in the piping","To prevent freezing"],
  a:1, why:"Water draining through a pipe creates negative pressure behind it. Without a vent admitting air, that suction pulls the water out of the trap, breaking the seal and allowing sewer gas into the building. Venting protects the seal, not the flow rate." },

{ t:"ppd-05", q:"Hot water is stored at 140°F with thermostatic mixing valves at fixtures. Why this arrangement?",
  c:["To reduce energy use","To suppress Legionella growth in storage while delivering water at a safe temperature at the tap","To extend the life of the water heater","To meet minimum pressure requirements"],
  a:1, why:"Legionella proliferates in the range below about 120°F, so storage above 140°F suppresses it. That temperature would scald at the fixture, so thermostatic mixing valves reduce the delivery temperature at the point of use — satisfying both requirements." },

{ t:"ppd-06", q:"A wall assembly has layers of R-0.45, R-13, R-0.6, R-5 and R-0.85 including air films. What is its U-factor through the insulated path?",
  c:["0.050","0.062","19.9","0.100"],
  a:0, why:"R-values in series add: 0.45 + 13 + 0.6 + 5 + 0.85 = R-19.9. U = 1 ÷ R = 1 ÷ 19.9 ≈ 0.050. Note this is the value through the cavity only; the path through framing is substantially worse." },

{ t:"ppd-06", q:"Which moisture transport mechanism carries the most water vapor through a typical wall?",
  c:["Vapor diffusion","Air leakage","Capillary action","Radiation"],
  a:1, why:"Air leakage carries one to two orders of magnitude more vapor than diffusion, because it transports bulk air with its entrained moisture rather than relying on slow molecular movement. This is why the air barrier is a higher priority than the vapor retarder." },

{ t:"ppd-06", q:"In a cooling-dominated climate with continuous air conditioning, where is the warm side of the wall in summer?",
  c:["The interior","The exterior","There is no warm side","It alternates hourly"],
  a:1, why:"With the interior conditioned and the exterior hot and humid, vapor drives inward. Placing a Class I vapor barrier on the interior traps that moisture at a cold surface where it condenses and cannot dry — a documented failure mode in humid southern climates." },

{ t:"ppd-06", q:"What is the perm rating range for a Class II vapor retarder?",
  c:["0.1 perm or less","Greater than 0.1 and up to 1.0 perm","Greater than 1.0 and up to 10 perms","Greater than 10 perms"],
  a:1, why:"Class I is 0.1 perm or less (polyethylene, foil) and is a true vapor barrier. Class II is greater than 0.1 up to 1.0 perm, such as kraft facing. Class III is 1.0 to 10 perms, such as latex paint on gypsum. Above 10 perms a material is vapor permeable." },

{ t:"ppd-06", q:"What distinguishes a pressure-equalised rainscreen from a simple drained cavity wall?",
  c:["It has no cavity","Its cavity is compartmented and vented so air pressure equalises across the cladding, preventing wind from driving water inward","It uses sealant at every joint","It eliminates the need for flashing"],
  a:1, why:"Water crosses a cavity when a pressure difference drives it. Compartmenting and venting the cavity so pressure equalises removes that driving force, leaving only gravity and momentum, which the drainage plane handles. It is the most robust wall strategy." },

{ t:"ppd-06", q:"At approximately what slope does roofing change from steep-slope to low-slope?",
  c:["1:12","2:12","6:12","4:12"],
  a:1, why:"The division falls at about 2:12, with some sources citing 3:12. Below it, water does not shed reliably by lapping, so a continuous membrane is required. Above it, lapped materials such as shingles, tile and slate work by gravity." },

{ t:"ppd-06", q:"A vegetated roof is proposed. What structural consideration is most significant?",
  c:["Wind uplift on the plants","The saturated dead load, roughly 20 to 35 psf for an extensive system","Thermal expansion of the membrane","Reduced snow load"],
  a:1, why:"Growing medium saturated by rain is heavy, and an extensive system adds roughly 20 to 35 psf, with intensive systems far more. The structure must be designed for it from the outset, since adding it to a completed design generally means resizing members." },

{ t:"ppd-06", q:"A south-facing window in a cooling-dominated climate should have which glazing properties?",
  c:["Low U-factor and high SHGC","Low U-factor and low SHGC","High U-factor and low SHGC","High VT and high SHGC"],
  a:1, why:"U-factor should be low in every climate. In a cooling-dominated climate solar gain is unwanted year round, so SHGC should be low — the opposite of the heating-climate recommendation for south glazing, where winter solar gain is useful." },

{ t:"ppd-06", q:"On which surface of an insulating glass unit does a low-e coating primarily reject solar heat?",
  c:["Surface 1, the exterior face of the outer pane","Surface 2, the interior face of the outer pane","Surface 3, the exterior face of the inner pane","Surface 4, the interior face of the inner pane"],
  a:1, why:"A coating on surface 2 intercepts solar radiation before it enters the cavity, rejecting heat — suited to cooling climates. A coating on surface 3 reflects interior long-wave radiation back into the room, retaining heat — suited to heating climates." },

{ t:"ppd-07", q:"A client proposes a large photovoltaic array as the first step toward net zero energy. What should the architect advise?",
  c:["Proceed, since generation defines net zero","Reduce loads first through orientation, envelope and daylighting, which makes a far smaller array sufficient","Net zero is unachievable without geothermal","Increase the array size for future growth"],
  a:1, why:"Each unit of demand removed through the envelope costs far less than the generation capacity needed to supply it. Sizing an array to an inefficient building inverts the order of operations — reduce loads, use passive strategies, make systems efficient, then generate — and is the most expensive route to net zero." },

{ t:"ppd-07", q:"A space is 36 feet deep with windows on one side at a 10-foot head height. How much of the depth is usefully daylit?",
  c:["The full 36 feet","Roughly 15 to 20 feet","Roughly 30 feet","Daylight depth depends only on glazing area"],
  a:1, why:"Useful daylight penetrates approximately 1.5 to 2 times the window head height, so a 10-foot head reaches 15 to 20 feet. The remaining depth needs clerestories, light shelves, a changed section or electric light — widening the window does not reach further." },

{ t:"ppd-07", q:"A project earns 72 points under LEED. What level is achieved?",
  c:["Certified","Silver","Gold","Platinum"],
  a:2, why:"Gold spans 60 to 79 points on the 110-point scale. Certified is 40 to 49, Silver 50 to 59, and Platinum begins at 80." },

{ t:"ppd-07", q:"Which LEED requirement must be met for a project to certify at all, earning no points?",
  c:["Enhanced commissioning","Fundamental commissioning","Advanced energy metering","Renewable energy production"],
  a:1, why:"Fundamental commissioning is a prerequisite — mandatory, earning no points. Enhanced commissioning is a credit that earns points. The distinction between prerequisite and credit is regularly tested." },

{ t:"ppd-07", q:"A high-ceilinged atrium is used to drive ventilation. Which strategy is this, and what does it depend on?",
  c:["Cross ventilation, depending on a narrow plan","Stack ventilation, depending on vertical height and a temperature difference","Evaporative cooling, depending on low humidity","Night flush, depending on thermal mass"],
  a:1, why:"Stack ventilation relies on buoyancy: warm air rises and exits high, drawing cooler air in at low openings. The driving force increases with height and with the indoor-outdoor temperature difference, which is why multi-storey atria work and single-storey spaces do not." },

{ t:"ppd-07", q:"What does annual sunlight exposure measure in a daylight analysis?",
  c:["The percentage of floor area meeting a target illuminance","Excessive direct sun reaching the floor, indicating potential glare","The total annual energy from daylight","The daylight factor under an overcast sky"],
  a:1, why:"ASE flags how much floor area receives excessive direct sun for too many hours, which predicts glare and blind-closing. Spatial daylight autonomy measures sufficiency. A scheme scoring high on both is over-glazed and needs shading." },

{ t:"ppd-07", q:"Which climate zone designation indicates a dry climate?",
  c:["A","B","C","D"],
  a:1, why:"Climate zones run 1 (very hot) through 8 (subarctic), with moisture designations A for moist, B for dry and C for marine. Prescriptive envelope requirements are tabulated by zone, so the designation determines required R-values, U-factors and SHGC." },

{ t:"ppd-07", q:"What is embodied carbon, and why is it growing in significance?",
  c:["Carbon emitted during building operation; it is falling","Emissions from making, transporting and installing materials; as operational energy falls it becomes the larger share of lifetime impact","Carbon stored in vegetation on the site","Emissions from occupant transportation"],
  a:1, why:"Embodied carbon is incurred before the building ever operates and cannot be reduced later. As envelopes improve and grids decarbonise, operational emissions fall while embodied emissions remain, making them an increasing proportion of a building's total impact." },

{ t:"ppd-07", q:"A Trombe wall is proposed. What does it require to function?",
  c:["North exposure and high humidity","South exposure, thermal mass, and a means of venting in summer","A mechanical circulation fan in all cases","A cooling-dominated climate"],
  a:1, why:"A Trombe wall is glazing over a massive dark wall: sun heats the mass, which conducts and radiates heat inward on a time lag, delivering warmth in the evening. It needs south exposure for winter sun and summer venting to avoid overheating." },

{ t:"ppd-08", q:"At the end of design development, what accuracy should an assemblies estimate be expected to achieve?",
  c:["±15 to 20%","±10 to 15%","±5 to 10%","±2 to 5%"],
  a:2, why:"Accuracy improves as information does: ±15–20% at pre-design with cost per square foot, ±10–15% at schematic design, ±5–10% with an assemblies estimate at design development, and ±2–5% with a quantity survey at construction documents." },

{ t:"ppd-08", q:"Two schemes enclose identical floor area. Scheme A has 980 linear feet of exterior wall; scheme B has 1,520. Which statement is correct?",
  c:["Cost is identical since area governs","Scheme B costs more to build and to operate, as exterior wall is expensive and drives envelope heat transfer","Scheme B is cheaper due to shorter spans","Perimeter affects operating cost only"],
  a:1, why:"Exterior wall costs substantially more per square foot than floor or roof, and it is also the surface through which heat is lost and gained. A 55% increase in perimeter is a construction premium that recurs annually in energy cost for the life of the building." },

{ t:"ppd-08", q:"What share of construction cost does MEP typically represent in a laboratory?",
  c:["10 to 15%","20 to 25%","40 to 50%","Under 10%"],
  a:2, why:"MEP runs roughly 20% in a warehouse, 25 to 35% in general commercial construction, and 40 to 50% in hospitals and laboratories, where ventilation rates, exhaust systems and redundancy dominate. It is why cost reduction in those building types starts with systems." },

{ t:"ppd-08", q:"How does construction cost scale with structural span?",
  c:["Linearly — doubling the span doubles the cost","Faster than linearly — doubling the span more than doubles the cost","Inversely — longer spans cost less per square foot","Span has no effect on cost"],
  a:1, why:"Doubling the span more than doubles the bending moment, so members get deeper and heavier disproportionately, and the added depth may raise floor-to-floor height as well. Fewer columns and footings offset only part of it, so the premium must be justified by the flexibility gained." },

{ t:"ppd-08", q:"Why is below-grade construction more expensive per square foot than above grade?",
  c:["The finishes are more costly","Excavation, shoring, waterproofing and dewatering, often making it 1.5 to 2 times the above-grade cost","Below-grade space requires more mechanical equipment","Fire ratings are higher below grade"],
  a:1, why:"The structure below grade must resist lateral earth and water pressure and be made watertight, and getting it built requires excavation, temporary support of adjacent ground and often dewatering. Those operations, not the finishes, drive the premium." },

{ t:"ppd-08", q:"Escalation in a construction estimate should be calculated to what point?",
  c:["The date of the estimate","The start of construction","The midpoint of construction","Substantial completion"],
  a:2, why:"Costs are incurred across the whole construction period, so escalating to the midpoint approximates the average. Escalating only to the start understates the figure, and escalating to completion overstates it." },

{ t:"ppd-08", q:"A project estimate exceeds budget by 11% at the end of schematic design. What should happen first?",
  c:["Substitute less expensive finishes","Verify the estimate and check whether program has grown beyond the approved baseline","Reduce the floor-to-floor height","Advise the owner to increase the budget"],
  a:1, why:"Schematic design estimates carry ±10–15% uncertainty, so an 11% variance may not be real. Verifying it and comparing the current program against the signed-off baseline determines whether this is an estimating issue, a scope issue or a design issue — each with a different remedy." },

{ t:"ppd-08", q:"Why does floor-to-floor height drive cost without adding value?",
  c:["It increases the structural span","It increases exterior wall area, vertical distribution length, column sizes and elevator travel, with no additional usable floor area","It reduces the efficiency ratio","It increases the required number of exits"],
  a:1, why:"Every additional foot of floor-to-floor height is paid for in cladding, riser length, column loading and elevator travel, across every floor, while producing no additional leasable or usable area. It is one of the most leveraged dimensions in a building." },

{ t:"ppd-08", q:"A cheap roof with a 15-year life is compared against an expensive one with a 30-year life over a 30-year holding period. Which analysis applies?",
  c:["First cost comparison","Simple payback","Life-cycle cost analysis including replacement and maintenance","Return on investment on the price difference alone"],
  a:2, why:"The cheaper roof requires a full replacement, with its disruption and inflation, inside the period the expensive one covers. Life-cycle cost analysis captures first cost, maintenance, replacement timing and residual value discounted to present value — the only basis on which the two are comparable." }

];
