/* Case studies. Each division gets one, with resource documents you must
   cross-reference to answer. Item kinds: mc (default), multi, num, hot, place. */

window.ARE_DATA.pcm.cases = [{
id: "pcm-cs1", title: "Brightwater Clinic — taking the commission", mins: 30,
scenario: "Your 22-person firm has been invited to propose on a 28,000 gsf outpatient clinic for Brightwater Health, a private operator you have not worked for. The principal has asked you to review the firm's position, prepare the fee, and flag the contract issues before the proposal goes out. The resource documents are the firm's year-end financials, the client's draft terms, and the proposed scope.",
docs: [
  { id:"d1", title:"Firm financial summary, year ended 31 December",
    blocks:[
      { table:{ head:["Line", "Amount"], rows:[
        ["Total revenue","$5,400,000"],
        ["Consultant fees paid","$1,100,000"],
        ["Reimbursable expenses","$300,000"],
        ["Direct labor","$1,330,000"],
        ["Indirect labor","$770,000"],
        ["Total indirect expenses","$2,128,000"],
        ["Current assets","$1,480,000"],
        ["Current liabilities","$1,060,000"],
        ["Pre-tax profit","$420,000"]
      ]}},
      { p:["Professional liability: $2,000,000 per claim / $2,000,000 aggregate, defence costs inside the limit, $50,000 deductible. Policy renews 1 March."] }
    ]},
  { id:"d2", title:"Brightwater draft terms — extracts",
    blocks:[
      { h:"Clause 4.2 — Standard of performance",
        p:["“The Architect shall perform its services in accordance with the highest standards of the architectural profession and shall deliver documents free from errors and omissions.”"] },
      { h:"Clause 7.1 — Indemnity",
        p:["“The Architect shall indemnify, defend and hold harmless the Owner from and against any and all claims arising out of or in connection with the Project, regardless of the cause thereof.”"] },
      { h:"Clause 9.4 — Consultants",
        p:["“The Owner shall engage the geotechnical engineer and the surveyor directly. All other consultants shall be engaged by the Architect.”"] },
      { h:"Clause 12.1 — Compensation",
        p:["“Compensation shall be a stipulated sum of $1,120,000 for Basic Services covering all five phases.”"] }
    ]},
  { id:"d3", title:"Scope notes from the first meeting",
    blocks:[
      { ul:[
        "Program is described by the client as “about 90% settled”; the imaging suite layout is still under discussion with a vendor who has not been selected.",
        "Client wants the project bid in nine months and occupied 14 months after that.",
        "Client has asked whether the firm can also prepare a feasibility study for a second clinic on an adjacent parcel, using the same documents.",
        "Procedures will include sedation but not general anaesthesia; patients recover and leave the same day.",
        "Client's facilities director will be the single point of contact, with approvals above $25,000 requiring board sign-off at monthly meetings."
      ]}
    ]}
],
questions: [
  { t:"pcm-02", k:"num", q:"Using the financial summary, calculate the firm's net multiplier. Enter the result to two decimal places.",
    a:3.0, tol:0.02,
    why:"Net operating revenue = 5,400,000 − 1,100,000 − 300,000 = $4,000,000. Net multiplier = NOR ÷ direct labor = 4,000,000 ÷ 1,330,000 = 3.01. Using total revenue instead of NOR would give 4.06 and overstate the firm's health considerably." },

  { t:"pcm-02", k:"num", q:"Calculate the firm's break-even rate from the financial summary. Enter the result to two decimal places.",
    a:2.6, tol:0.03,
    why:"Overhead rate = total indirect expenses ÷ direct labor = 2,128,000 ÷ 1,330,000 = 1.60. Break-even rate = overhead rate + 1.0 = 2.60. The firm's net multiplier of 3.01 sits comfortably above it, which is where the pre-tax profit comes from." },

  { t:"pcm-03", k:"multi", q:"Which clauses in the Brightwater draft terms should the architect refuse or renegotiate before signing? Select all that apply.",
    c:["Clause 4.2 — standard of performance","Clause 7.1 — indemnity","Clause 9.4 — consultants","Clause 12.1 — compensation"],
    a:[0,1],
    why:"Clause 4.2 raises the duty above the standard of care to a warranty of perfection, which professional liability insurance does not cover. Clause 7.1 is broad-form indemnity reaching losses the architect did not cause, generally uninsurable and void by statute in many states. Clause 9.4 is favourable — owner-engaged geotechnical and survey shift that risk away from the architect. Clause 12.1 is a commercial question, not a liability defect." },

  { t:"pcm-05", q:"Given the scope notes, what is the principal objection to the stipulated sum in Clause 12.1?",
    c:["The amount is below the firm's break-even rate","The program is not settled, so a fixed fee against an undefined scope puts all overrun risk on the architect","Stipulated sums are prohibited for healthcare projects","The fee should be a percentage of construction cost"],
    a:1, why:"A stipulated sum fixes the fee against an assumed scope. With the imaging suite undetermined and the vendor unselected, the hours are genuinely unknown, and every hour beyond the assumption comes out of profit. An hourly fee with an upset limit, revisited once the vendor is chosen, fits an unsettled program far better." },

  { t:"pcm-05", k:"num", q:"If the firm accepts the $1,120,000 stipulated sum and the conventional AIA phase allocation applies, how much fee remains to be earned after design development is approved? Enter the amount in dollars, without a comma or dollar sign.",
    a:728000, tol:0.01,
    why:"Schematic design is 15% and design development 20%, so 35% is earned and 65% remains — construction documents 40%, bidding 5%, construction administration 20%. 1,120,000 × 0.65 = $728,000." },

  { t:"pcm-06", q:"The client asks whether the clinic documents can be reused for the second clinic on the adjacent parcel. Under an unmodified B101, what is the position?",
    c:["The owner may reuse them, having paid for them","The owner's licence covers only this project; reuse requires the architect's agreement and additional compensation","The documents become the owner's property at final payment","Reuse is permitted if the architect's seal is removed"],
    a:1, why:"Article 7 keeps ownership and copyright with the architect and grants the owner a non-exclusive licence limited to constructing, using and maintaining that project. A second building on another parcel falls outside it, and is a separate negotiation — and a commercial opportunity worth raising rather than a problem." },

  { t:"pcm-05", q:"Based on the scope notes, how should the clinic be classified under the building code, and why does it matter to the fee?",
    c:["Group I-2, because medical procedures are performed","Group B, because patients recover and leave unassisted — less restrictive than Group I and less costly to document","Group A-3, because of the waiting areas","Group M, because of the retail pharmacy"],
    a:1, why:"Outpatient care where occupants can evacuate unassisted is Business. Sedation short of general anaesthesia generally keeps it there. Had the client specified general anaesthesia, the classification would shift to Group I with substantially stricter egress, separation and construction type requirements — and a materially larger documentation effort." },

  { t:"pcm-08", q:"The facilities director can approve only up to $25,000, with anything larger waiting for a monthly board meeting. What should the project manager do about this?",
    c:["Keep every change under $25,000","Build the board's meeting cycle into the project schedule with dated decision deadlines","Ask the client to replace the facilities director","Proceed on the director's informal approval and seek ratification later"],
    a:1, why:"The owner's governance is a fact of the project. Mapping the approval cycle into the schedule converts an invisible delay risk into a managed one and documents who held up what if a schedule claim later arises. B101 requires the owner to render decisions promptly, and this is how you hold them to it." }
]
}];

window.ARE_DATA.pjm.cases = [{
id: "pjm-cs1", title: "Halden Library — month nine", mins: 30,
scenario: "You are the project manager for a $14,200,000 public library, delivered design-bid-build under A101 with A201. Construction is in month nine of an 18-month contract. The owner is pressing on schedule and the contractor has submitted two claims. Review the schedule network, the change log and the payment application, then answer.",
docs: [
  { id:"d1", title:"Schedule network — remaining critical activities",
    blocks:[
      { table:{ head:["Activity","Duration (days)","Predecessor","Early start","Late start"], rows:[
        ["E — Curtain wall fabrication","45","D","120","120"],
        ["F — Curtain wall install","30","E","165","165"],
        ["G — Roof membrane","20","D","120","140"],
        ["H — Interior rough-in","35","G","140","160"],
        ["J — Finishes","40","F, H","195","195"],
        ["K — Commissioning","15","J","235","235"]
      ]}},
      { p:["Contract completion is day 250. The network above begins at day 120."] }
    ]},
  { id:"d2", title:"Change and claim log",
    blocks:[
      { table:{ head:["No.","Description","Status","Days claimed"], rows:[
        ["CO-04","Owner-added donor wall in lobby","Executed change order","6"],
        ["CL-01","Unusually severe ice storm, 9 days lost","Claim submitted day 14 after event","9"],
        ["CL-02","Curtain wall fabricator insolvency, 22 days lost","Claim submitted day 40 after event","22"],
        ["CCD-01","Mechanical room reconfiguration, cost unresolved","Directive issued, work proceeding","0"]
      ]}}
    ]},
  { id:"d3", title:"Application for payment no. 9 — extract",
    blocks:[
      { table:{ head:["Item","Scheduled value","Completed to date","%"], rows:[
        ["Mobilisation","$340,000","$340,000","100"],
        ["Sitework","$1,120,000","$1,120,000","100"],
        ["Structure","$3,400,000","$3,400,000","100"],
        ["Curtain wall","$2,800,000","$560,000","20"],
        ["Roofing","$890,000","$712,000","80"],
        ["Interiors","$3,200,000","$640,000","20"],
        ["MEP","$2,450,000","$980,000","40"]
      ]}},
      { p:["Retainage withheld: 10%. The architect has observed that roofing flashing at four curbs is incomplete and does not conform to the approved details. The value of that work is approximately $85,000."] }
    ]}
],
questions: [
  { t:"pjm-02", k:"num", q:"Using the schedule network, what is the total float of activity G (roof membrane)? Enter the number of days.",
    a:20, tol:0.01,
    why:"Total float = late start − early start = 140 − 120 = 20 days. Activity G can slip 20 days before it would delay the project. Activities E, F, J and K all show late start equal to early start, so they have zero float and form the critical path." },

  { t:"pjm-02", k:"multi", q:"Which activities in the network are on the critical path? Select all that apply.",
    c:["E — Curtain wall fabrication","F — Curtain wall install","G — Roof membrane","H — Interior rough-in","J — Finishes","K — Commissioning"],
    a:[0,1,4,5],
    why:"Critical activities have zero total float, meaning late start equals early start: E (120/120), F (165/165), J (195/195) and K (235/235). G has 20 days of float and H has 20 days, so both can slip without delaying completion — which is why spending money to accelerate roofing would achieve nothing." },

  { t:"pjm-07", q:"CL-01, the ice storm claim, was submitted 14 days after the event. How should it be resolved?",
    c:["Time extension and compensation for extended general conditions","Time extension only — severe weather is excusable but non-compensable","Denied — notice was late","Denied — weather is never excusable"],
    a:1, why:"Notice at day 14 is inside the 21-day requirement, so the claim is properly made. Unusually severe weather is excusable — neither party caused it — so the contractor is relieved of liquidated damages through a time extension, but bears its own extended costs since there is no compensable cause." },

  { t:"pjm-07", q:"CL-02 concerns the curtain wall fabricator's insolvency, claimed 40 days after the event. What is the outcome?",
    c:["Time extension and compensation, since the insolvency was unforeseeable","Time extension only","No relief — the fabricator is the contractor's supplier, making this a non-excusable delay, and notice was also late","Compensation only, with no time extension"],
    a:2, why:"Two independent problems. The fabricator is within the contractor's sphere of responsibility, so its failure is a non-excusable delay — no time and no money, with liquidated damages continuing. Separately, notice at day 40 exceeds the 21-day requirement, which would bar the claim even if the cause had been excusable." },

  { t:"pjm-04", q:"CCD-01 was issued for the mechanical room with cost unresolved and the contractor proceeding. If the parties still cannot agree the price, how is the adjustment determined?",
    c:["The contractor's original quoted lump sum governs","The architect's independent estimate governs","Actual cost plus a reasonable allowance for overhead and profit, as determined by the architect","The matter goes straight to arbitration"],
    a:2, why:"A construction change directive lets the owner and architect order work before the price is agreed. Failing agreement on a method, A201's fallback is the contractor's itemised actual costs — labor with burden, materials, equipment, and attributable insurance, bonds and permits — plus a reasonable allowance for overhead and profit determined by the architect." },

  { t:"pjm-03", k:"num", q:"From Application no. 9, calculate the total completed to date across all line items, in dollars, before retainage. Enter the amount without a comma or dollar sign.",
    a:7752000, tol:0.005,
    why:"340,000 + 1,120,000 + 3,400,000 + 560,000 + 712,000 + 640,000 + 980,000 = $7,752,000. With 10% retainage withheld, $775,200 is held back and $6,976,800 is the gross amount earned less retainage before deducting prior payments." },

  { t:"pjm-03", q:"Given the non-conforming roofing flashing worth about $85,000, what should the architect do with Application no. 9?",
    c:["Withhold the entire application until the flashing is corrected","Certify the application less an amount reasonably necessary to protect the owner, notifying both parties of the reason","Certify in full and note the defect in a field report","Refer the application to the Initial Decision Maker"],
    a:1, why:"Defective work not remedied is an express ground for withholding, but only to the extent reasonably necessary to protect the owner. Withholding the whole application would deny payment for a large amount of conforming work. The architect certifies the balance, states the reason in writing to contractor and owner, and releases the withheld amount when the flashing conforms." },

  { t:"pjm-01", q:"The owner asks the architect to instruct the contractor to work Saturdays to recover schedule. What should the architect do?",
    c:["Issue an ASI directing Saturday work","Decline to direct sequencing or staffing, and instead raise the schedule requirement with the contractor through the proper channel","Issue a construction change directive requiring overtime","Withhold payment until the schedule recovers"],
    a:1, why:"How the contractor staffs and sequences the work is means and methods, reserved to it by A201. Directing weekend work risks assuming responsibility for schedule and safety. The legitimate route is to require a recovery schedule from the contractor and let it decide how to achieve it." }
]
}];

window.ARE_DATA.pa.cases = [{
id: "pa-cs1", title: "Marrow Street — site and program test fit", mins: 35,
scenario: "A developer controls a corner parcel on Marrow Street and wants to know what can be built. You have the zoning extract, a survey summary and the tenant's program. Establish what the ordinance permits, whether the program fits, and what the site will cost in constraints.",
docs: [
  { id:"d1", title:"Zoning extract — District MU-3",
    blocks:[
      { table:{ head:["Control","Requirement"], rows:[
        ["Permitted uses","Office, retail, multi-family; restaurants by conditional use permit"],
        ["Maximum floor area ratio","2.4"],
        ["Maximum lot coverage","55%"],
        ["Maximum height","6 storeys and 78 feet, whichever is less"],
        ["Front setback","10 ft, both street frontages on a corner lot"],
        ["Side setback (interior)","8 ft"],
        ["Rear setback","15 ft"],
        ["Parking — office","1 space per 350 gsf"],
        ["Height exemptions","Mechanical penthouse and elevator overrun to 14 ft above the height limit, set back 10 ft from any facade"]
      ]}}
    ]},
  { id:"d2", title:"Survey and site summary",
    blocks:[
      { ul:[
        "Parcel dimensions: 180 ft along Marrow Street by 250 ft deep. Corner lot, with Marrow Street and Culvert Lane frontages.",
        "A recorded 12 ft wide utility easement runs the full 250 ft depth, parallel to and 20 ft inside the interior side property line.",
        "Grade falls 11 ft from the Marrow Street frontage to the rear property line.",
        "Seasonal high water table at 9 ft below the Marrow Street grade.",
        "Soils: medium dense sand to 24 ft, bearing capacity adequate for shallow foundations. No expansive clay.",
        "A 36-inch storm main runs beneath Culvert Lane; water main on Marrow Street tested at adequate flow for sprinklers."
      ]}
    ]},
  { id:"d3", title:"Tenant program — net assignable areas",
    blocks:[
      { table:{ head:["Space","Net assignable sf"], rows:[
        ["Open workstations","34,800"],
        ["Private offices and meeting rooms","11,200"],
        ["Reception and lounge","2,400"],
        ["Training room (tables and chairs)","3,000"],
        ["Café and servery","1,800"],
        ["IT and storage","1,600"]
      ]}},
      { p:["Target efficiency for this building type and core arrangement: **80%**. The developer also wants 4,000 gsf of ground-floor retail, which is excluded from the office program above."] }
    ]}
],
questions: [
  { t:"pa-04", k:"num", q:"What is the lot area in square feet?",
    a:45000, tol:0.01,
    why:"180 ft × 250 ft = 45,000 square feet. That is just over an acre, since one acre is 43,560 sf — a conversion worth keeping in mind when a question mixes density in units per acre with areas in square feet." },

  { t:"pa-04", k:"num", q:"What is the maximum floor area the FAR permits, in square feet?",
    a:108000, tol:0.01,
    why:"FAR 2.4 × 45,000 sf lot = 108,000 square feet of gross floor area. FAR controls bulk without dictating form — that 108,000 sf could be six storeys of 18,000 or four storeys of 27,000, subject to the other controls." },

  { t:"pa-04", k:"num", q:"What is the maximum building footprint the lot coverage limit permits, in square feet?",
    a:24750, tol:0.01,
    why:"55% × 45,000 = 24,750 square feet of footprint. Over the 6 storeys the height limit allows, that would yield 148,500 sf — far more than the FAR permits, so FAR is the binding constraint here at 108,000 sf." },

  { t:"pa-04", q:"Which control binds the total floor area on this parcel, and what is the result?",
    c:["Lot coverage, at 24,750 sf","FAR, at 108,000 sf","Height, at 6 storeys","Setbacks, which reduce the buildable area below both"],
    a:1, why:"Calculate each independently and take the smaller. FAR permits 108,000 sf. Coverage permits a 24,750 sf footprint, which over 6 permitted storeys would allow 148,500 sf. FAR is therefore binding. Setbacks reduce the available footprint but do not by themselves cap total floor area." },

  { t:"pa-02", k:"num", q:"The office program totals 54,800 net assignable square feet. At 80% efficiency, what gross area is required? Enter the result in square feet.",
    a:68500, tol:0.01,
    why:"Gross = net ÷ efficiency = 54,800 ÷ 0.80 = 68,500 gsf. Adding the 4,000 gsf of retail gives 72,500 gsf total, comfortably inside the 108,000 sf the FAR permits — so the program fits with substantial room for expansion or additional leasable area." },

  { t:"pa-07", k:"num", q:"How many parking spaces does the ordinance require for the office portion at 68,500 gsf? Round up to the nearest whole space.",
    a:196, tol:0.01,
    why:"68,500 ÷ 350 = 195.7, rounded up to 196 spaces. Parking ratios are applied to gross area, and fractional spaces round up. At roughly 350 sf per space including aisles, 196 spaces needs about 68,600 sf of parking — which on this site means structured or below-grade parking, a significant cost the developer must be told about early." },

  { t:"pa-03", k:"multi", q:"Which site conditions materially constrain where the building can be placed? Select all that apply.",
    c:["The 12 ft utility easement running the full depth","The 11 ft fall from front to rear","The seasonal high water table at 9 ft","The medium dense sand bearing capacity","Two front setbacks on a corner lot"],
    a:[0,2,4],
    why:"The easement cannot be built over and runs the full depth, removing a 12 ft strip from the buildable area. The water table at 9 ft limits below-grade parking without substantial waterproofing and dewatering — critical given the 196 spaces required. Two front setbacks on a corner lot reduce the envelope on both street sides. An 11 ft fall over 250 ft is only 4.4% and is workable, and the sand bearing capacity is described as adequate." },

  { t:"pa-04", q:"The developer wants a restaurant on the ground floor instead of retail. What is required?",
    c:["Nothing — restaurants are permitted by right","A conditional use permit, since the ordinance lists restaurants as a conditional use","A use variance, requiring proof of hardship","A rezoning of the parcel"],
    a:1, why:"The zoning extract lists restaurants as conditional, meaning the ordinance already contemplates them subject to review against stated criteria and conditions. That is a far lower bar than a use variance, which asks for something the ordinance does not allow at all and requires hardship arising from the land." },

  { t:"pa-04", q:"The developer proposes a mechanical penthouse 12 ft tall on the roof of a 78 ft building, set back 12 ft from each facade. Does it comply?",
    c:["No — total height would be 90 ft, exceeding the 78 ft limit","Yes — the exemption permits up to 14 ft above the limit when set back at least 10 ft","No — penthouses are never exempt","Yes, but only if the building is reduced to 5 storeys"],
    a:1, why:"The extract exempts mechanical penthouses and elevator overruns up to 14 ft above the height limit where set back at least 10 ft from any facade. At 12 ft tall and 12 ft back, both conditions are satisfied. Always read the exemption's own conditions rather than assuming either that it applies or that it does not." }
]
}];
