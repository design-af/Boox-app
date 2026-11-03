window.ARE_DATA.pjm.exam = [

{ t:"pjm-01", q:"A project architect leaves the firm midway through construction documents. What is the project manager's most important immediate concern?",
  c:["Reassigning her billable hours to maintain utilization","Transferring the technical knowledge and open decisions she held, before they are lost","Notifying the owner of the staff change","Revising the fee to reflect a different staffing mix"],
  a:1, why:"The undocumented knowledge — open code questions, agreed details, pending consultant coordination, decisions made in meetings — is what disappears with a departure. Capturing it before the last day is what prevents the replacement rediscovering it expensively. The other three matter but none is urgent in the same way." },

{ t:"pjm-01", q:"Under A201, which party is responsible for the acts and omissions of a subcontractor?",
  c:["The owner, who benefits from the work","The architect, who approved the subcontractor","The contractor","The subcontractor alone, directly to the owner"],
  a:2, why:"A201 makes the contractor responsible for the acts and omissions of its subcontractors and anyone for whose acts they are liable. The owner has no contract with the subcontractor, and the architect's ability to object to a proposed subcontractor does not create responsibility for its work." },

{ t:"pjm-01", q:"A construction manager as adviser is engaged on a project. Who holds the contracts with the trade contractors?",
  c:["The construction manager","The owner","The architect","The general contractor"],
  a:1, why:"A CM as adviser advises the owner and carries no construction risk, so the owner contracts directly with the trade contractors. Under CM at risk the CM becomes the contractor and holds those contracts — which is the distinction the question tests." },

{ t:"pjm-01", q:"An owner's representative lacks authority to approve anything above $10,000 and decisions routinely wait three weeks for a board meeting. What should the project manager do?",
  c:["Proceed on the representative's informal direction and seek ratification later","Map the owner's decision process into the project schedule and set decision deadlines against it","Escalate every decision directly to the board","Reduce the scope so no decision exceeds $10,000"],
  a:1, why:"The owner's internal governance is a fact of the project, not a problem to be argued away. Building the board's meeting cycle into the schedule, with dated decision deadlines, converts an invisible delay risk into a managed one — and documents who held up what when a schedule claim arises." },

{ t:"pjm-01", q:"Which communication is consistent with A201 during construction?",
  c:["The owner instructing a subcontractor directly on a finish selection","The architect directing the contractor's crew sizes","The contractor submitting an RFI to the architect","The architect issuing instructions to a subcontractor"],
  a:2, why:"An RFI from contractor to architect is the normal channel. The owner communicates with the contractor through the architect, the architect communicates with subcontractors through the contractor, and crew sizes are means and methods the architect must not direct." },

{ t:"pjm-02", q:"An activity has a total float of 5 days and a free float of 0 days. What does this mean?",
  c:["The activity is on the critical path","The activity can slip 5 days without delaying the project, but any slip delays its immediate successor","The activity has no flexibility at all","The calculation contains an error"],
  a:1, why:"Free float is slip available without delaying the next activity; total float is slip without delaying the project. Zero free float with five days of total float means the activity shares float with its successors — it can move, but every day it moves pushes the next activity, which then consumes the shared float." },

{ t:"pjm-02", q:"A network has activities A (6 days) then B (4 days) on one path, and C (3 days) then D (9 days) on another, both paths running from start to finish. What is C's total float?",
  c:["0 days","1 day","3 days","12 days"],
  a:0, why:"Path A–B is 10 days; path C–D is 12 days. The critical path is C–D at 12 days, so C and D have zero float. A and B share 2 days of float. The trap is assuming the first-listed path is critical." },

{ t:"pjm-02", q:"A contractor submits a schedule showing nearly every activity on the critical path. What should the project manager suspect?",
  c:["An exceptionally efficient plan","A schedule built to maximise delay claims, since almost any disruption then appears to delay the project","That the project duration is too long","That float has been correctly allocated"],
  a:1, why:"When everything is critical, every hiccup becomes a project delay on paper. Schedules are sometimes built this way deliberately. A realistic network has multiple paths with varying float, and the project manager should question a near-universal zero-float schedule before accepting it as the baseline." },

{ t:"pjm-02", q:"Which schedule compression method carries the greatest risk of rework?",
  c:["Crashing with overtime","Crashing with a second shift","Fast-tracking","Adding a third crew to a critical activity"],
  a:2, why:"Fast-tracking overlaps activities planned in sequence, so construction commits before the design that governs it is finished. Later decisions can conflict with work already in place, forcing demolition. Crashing in any form shortens durations without changing the logical order, so it adds cost rather than rework risk." },

{ t:"pjm-02", q:"A milestone chart is presented to an owner's board. What is its principal limitation?",
  c:["It cannot show dates","It shows key dates but not the activities, durations or dependencies behind them","It cannot be updated","It requires CPM software to produce"],
  a:1, why:"A milestone chart communicates target dates cleanly, which is why boards like it, but it conceals the logic that produces them. It cannot show what is driving a date or what has float, so it is a reporting device rather than a planning one." },

{ t:"pjm-03", q:"Under an A102 agreement, the contractor spends its entire contingency by 60% completion. What is the position?",
  c:["The owner must increase the GMP","The contingency sits inside the GMP, so further overruns come out of the contractor's fee or profit","The architect must issue a change order","The owner's contingency is automatically drawn down"],
  a:1, why:"A contractor's contingency inside a GMP is part of the cost of the work the contractor guaranteed. Exhausting it early does not entitle the contractor to more money; costs above the GMP are the contractor's to absorb. The owner's contingency is a separate fund for owner-initiated changes." },

{ t:"pjm-03", q:"A bid bond is written at 10% of a $4,000,000 bid. The low bidder refuses to sign the contract and the next bid is $4,350,000. What does the owner recover?",
  c:["$400,000, the full bond amount","$350,000, the difference against the next bidder, up to the bond amount","$4,000,000","Nothing, since the contract was never executed"],
  a:1, why:"A bid bond indemnifies the owner for the additional cost of going to the next bidder, up to the bond's penal sum. The damage here is $350,000, which is less than the $400,000 bond, so the owner recovers the actual difference rather than the full face amount." },

{ t:"pjm-03", q:"Rock excavation is expected but its quantity cannot be determined before bidding. How should it be handled?",
  c:["As an allowance","As a unit price per cubic yard","As a deduct alternate","As part of the contractor's contingency"],
  a:1, why:"A unit price covers work of known character and uncertain quantity, with the quantity measured as the work proceeds. An allowance covers known quantity with unknown selection, and contingency covers unknown scope. Rock is the textbook unit-price item." },

{ t:"pjm-03", q:"Retainage of 10% has been withheld through construction. At substantial completion, what typically happens?",
  c:["All retainage is released immediately","Retainage is commonly reduced, with an amount retained against the value of the remaining punch list items","Retainage increases to secure the punch list","Retainage is paid directly to subcontractors"],
  a:1, why:"Substantial completion means the owner can occupy, so holding a full 10% against a short list of minor items is disproportionate. The usual practice reduces the retainage to an amount reasonably related to the outstanding work, with the balance released on final completion." },

{ t:"pjm-03", q:"Which document is incorporated by reference into both the owner–contractor agreement and the owner–architect agreement?",
  c:["G702","C401","A201","B102"],
  a:2, why:"A201, the General Conditions, is incorporated into A101 and referenced by B101, which is how it can define the architect's construction-phase authority even though the architect is not a party to the construction contract." },

{ t:"pjm-03", q:"An owner wants the lowest possible price on a fully designed warehouse with no need for builder input during design. Which agreement and delivery method fit?",
  c:["A102 with CM at risk","A101 with design-bid-build","A103 with cost plus and no GMP","Integrated project delivery"],
  a:1, why:"A fully designed, straightforward building with no need for preconstruction input is precisely what competitive design-bid-build and a stipulated sum under A101 are for. The other methods add preconstruction collaboration the owner does not need and will pay for." },

{ t:"pjm-04", q:"A contractor submits 40 RFIs in two weeks, 30 of them about the curtain wall. What should the project manager conclude?",
  c:["The contractor is unqualified","That portion of the document set is probably under-developed or uncoordinated and needs review","The RFI process is being abused for delay","The architect should stop responding"],
  a:1, why:"A concentration of RFIs in one system is a document quality signal. Treating it as contractor behaviour misses the cause and guarantees it continues. Reviewing that part of the set, and issuing a clarifying package rather than 30 individual answers, is the efficient response." },

{ t:"pjm-04", q:"An architect answers an RFI in a way that adds a material to the scope. What should have happened?",
  c:["Nothing — RFI responses may clarify scope","The response should have been routed through the change process, since adding scope is a change, not an interpretation","The contractor should have issued a change order","The owner should have answered the RFI"],
  a:1, why:"An interpretation explains what the documents already require and costs nothing. Adding to the documents changes the contract and must go through a proposal request and change order, or a construction change directive. Answering a scope question as if it were a clarification gives away the owner's money and creates liability." },

{ t:"pjm-04", q:"Which action is appropriate on a submittal that arrives without the contractor's review stamp?",
  c:["Review it to avoid delaying the schedule","Return it unreviewed, since contractor review is a contractual precondition","Review it and note the omission","Forward it to the consultant for review"],
  a:1, why:"A201 requires the contractor to review, approve and stamp submittals and, by submitting, to represent that materials, dimensions and field conditions have been verified. Reviewing an unstamped submittal lets the contractor skip its obligation and shifts the first substantive check onto the architect." },

{ t:"pjm-04", q:"Meeting minutes record that the owner asked for an upgraded door hardware set. No other document follows. The contractor installs it and invoices $18,000. What is the architect's position?",
  c:["Certify the amount, since the minutes record the owner's request","The minutes do not modify the contract; a change order or directive was required, and the claim is disputed","Issue an ASI retroactively covering the change","Deduct the amount from retainage"],
  a:1, why:"Minutes record what was said; only a modification changes the contract sum. Without a change order signed by owner, architect and contractor, or a construction change directive, there is no authorised change — which is why direction captured only in minutes reliably becomes a disputed invoice." },

{ t:"pjm-04", q:"An architect wants to clarify the finish on an exposed steel column with no effect on cost or schedule. Which instrument applies?",
  c:["G701 change order","G709 proposal request","G710 architect's supplemental instructions","G714 construction change directive"],
  a:2, why:"An ASI covers minor changes consistent with the intent of the documents that involve no adjustment to the contract sum or time, and the architect issues it alone. The other three all exist to handle cost or time, which this clarification does not involve." },

{ t:"pjm-04", q:"A contractor proposes a product substitution after award. What governs the process?",
  c:["A201 Article 7","Division 01 of the specifications","The instructions to bidders","The owner's purchasing policy"],
  a:1, why:"Substitution procedures — what must be submitted, by when, and how it is evaluated — are administrative requirements applying across all technical sections, which places them in Division 01. The instructions to bidders govern only the bidding period and cease to apply at award." },

{ t:"pjm-05", q:"An owner approves schematic design, then during design development requests a different structural system for appearance reasons, requiring rework of completed consultant coordination. How should this be treated?",
  c:["As a basic service, since design development includes system selection","As an additional service, with written notice before the rework begins","As a reimbursable expense","As a quality control failure"],
  a:1, why:"The owner approved a baseline at the end of schematic design. Changing a fundamental system after that approval triggers additional services under B101 §4.2. The entitlement depends on giving written notice before performing the work, not on invoicing afterwards." },

{ t:"pjm-05", q:"Which estimating method is appropriate when only the building type, approximate size and quality level are known?",
  c:["Quantity survey at unit prices","Assemblies estimate by system","Cost per square foot or per functional unit","Detailed trade-by-trade bid analysis"],
  a:2, why:"With no design yet, cost per square foot or per functional unit — per bed, per key, per student — is the only method the information supports, at roughly ±15–20%. The more detailed methods need geometry and system selections that do not yet exist, and would produce false precision." },

{ t:"pjm-05", q:"A value engineering exercise proposes eliminating the vestibule at the main entrance, saving $40,000. What must the architect evaluate before advising the owner?",
  c:["Only the capital saving","Energy performance, comfort at the entrance, code compliance for the required air barrier approach, and operating cost over time","Whether the contractor supports the change","Whether the change affects the architect's fee"],
  a:1, why:"A vestibule reduces infiltration at a frequently opened door, and removing it has measurable consequences for heating load, entrance comfort and sometimes energy code compliance. The architect's obligation is to identify and document those consequences so the owner's decision is informed." },

{ t:"pjm-05", q:"A decision log shows the owner approved the mechanical system on 14 March. In September the owner disputes it. What is the log's value?",
  c:["It proves the system is the best available","It records what was decided, by whom and when, establishing the baseline from which later changes are measured","It transfers liability to the owner","It replaces the need for phase sign-offs"],
  a:1, why:"A decision log does not prove a decision was correct; it proves a decision was made, by whom and when. That is what distinguishes a change requiring additional services from a correction of the architect's own work, and it is why the log and the phase sign-off work together." },

{ t:"pjm-05", q:"A project's total budget is $30,000,000. Soft costs are 22% and the owner holds a 5% contingency on the construction cost. Approximately what construction cost can be supported?",
  c:["$23,400,000","$22,285,000","$30,000,000","$21,000,000"],
  a:1, why:"Soft costs take 22%, leaving $23,400,000. That remainder must cover both the construction cost and a 5% contingency on it: 23,400,000 ÷ 1.05 ≈ $22,285,000 of construction cost, with about $1,114,000 of contingency. Taking 5% off the $23,400,000 instead is the common error." },

{ t:"pjm-06", q:"Which review would most likely catch a duct running through a structural transfer beam?",
  c:["Independent technical review","Cross-discipline coordination review or model clash detection","Code review","Specification backcheck"],
  a:1, why:"A conflict between two disciplines' work is found by overlaying them or by running clash detection on a federated model. An independent technical review looks for omissions and constructability problems within the architectural set, and code review and specification backchecks address different questions entirely." },

{ t:"pjm-06", q:"A specification requires a product the drawings never show, and the drawings show a product the specification never mentions. Which statement is correct?",
  c:["The specification always governs over the drawings","The documents are complementary; this is an unresolved conflict that should have been corrected before issue","The contractor may choose either","The larger-scale document governs"],
  a:1, why:"A201 makes the documents complementary, with what is required by one binding as if required by all. There is no general rule that specifications override drawings. A direct contradiction is a defect to be corrected in review, not a question for a precedence clause to settle afterwards." },

{ t:"pjm-06", q:"At which phase should occupancy classification and construction type be settled?",
  c:["Schematic design","Design development","Construction documents","Permit review"],
  a:0, why:"Occupancy classification and construction type determine allowable area and height, required ratings and egress requirements — all of which shape the building's size and form. Settling them at schematic design is what prevents discovering at construction documents that the building is too large for its type." },

{ t:"pjm-06", q:"A firm schedules code review as a single task performed by the project architect who prepared the drawings. What is the weakness?",
  c:["Code review must be performed by the building official","The author cannot readily see their own assumptions; review by someone else is substantially more effective","Code review belongs in the specifications","Code review should occur only at permit submission"],
  a:1, why:"Someone who made the code interpretations reads the drawings as they intended them rather than as they are. A reviewer who did not prepare the work tests the assumptions rather than confirming them, which is the same reason independent technical review exists." },

{ t:"pjm-06", q:"A dimension string on a plan totals 2 inches less than the overall dimension on the same line. How should this be handled?",
  c:["The contractor should distribute the discrepancy","It is a document defect to be corrected before issue","The overall dimension governs by default","The contractor should scale the drawing to resolve it"],
  a:1, why:"A string that does not sum to its overall is an internal inconsistency — exactly what quality control exists to find. There is no precedence rule that resolves it, and leaving it in the set produces either an RFI or construction laid out two inches wrong." },

{ t:"pjm-07", q:"A contractor's steel delivery is six weeks late because its fabricator failed. The steel is on the critical path. What is the contractor entitled to?",
  c:["A time extension and compensation","A time extension only","Nothing — this is a non-excusable delay","Compensation only"],
  a:2, why:"The fabricator is the contractor's supplier, so its failure is within the contractor's sphere of responsibility. The delay is non-excusable: no additional time and no additional money, and liquidated damages continue to run if the completion date is missed." },

{ t:"pjm-07", q:"Which statement about mediation under A201 is correct?",
  c:["The mediator issues a binding decision","It is non-binding and is a condition precedent to binding dispute resolution","It replaces the initial decision by the IDM","It is optional and may be waived unilaterally"],
  a:1, why:"A mediator facilitates settlement and cannot impose an outcome, so mediation is non-binding. A201 and B101 both make attempting it a condition precedent to arbitration or litigation, and it follows rather than replaces the Initial Decision Maker's decision." },

{ t:"pjm-07", q:"A contract contains liquidated damages but no provision for early completion bonus. The contractor finishes three weeks early. What is owed?",
  c:["A bonus proportional to the liquidated damages rate","Nothing additional — the contract provides no early completion payment","The retainage must be released three weeks early","The contract sum increases by the general conditions saved"],
  a:1, why:"Liquidated damages compensate the owner for late completion; they do not create a symmetrical entitlement for finishing early. A bonus exists only if the contract says so, which is why bonus provisions are negotiated expressly — and pairing one with liquidated damages strengthens the argument that the damages are compensatory." },

{ t:"pjm-07", q:"A claim is submitted 45 days after the contractor first recognised the condition giving rise to it. What is the problem?",
  c:["Claims must be submitted within 7 days","The 21-day notice period under A201 has passed, which may bar the claim","Claims must be submitted before the work begins","Claims may only be submitted at final payment"],
  a:1, why:"A201 requires written notice within 21 days after the event or after the claimant first recognises the condition, whichever is later. Late notice deprives the other party of the chance to investigate and mitigate, and is a standard ground for rejecting an otherwise valid claim." },

{ t:"pjm-07", q:"Under A201, what must the parties do while a claim is pending?",
  c:["Suspend the affected work until the claim is decided","The contractor proceeds diligently and the owner continues making payments","Both parties stop performance pending mediation","The architect suspends certification of all payments"],
  a:1, why:"A201 requires performance and payment to continue while a claim is pending, unless the contract has been terminated. The provision exists so that disputes cannot be used as leverage to halt a project, which would harm the owner far more than the disputed amount." },

{ t:"pjm-08", q:"Who determines the date of substantial completion?",
  c:["The contractor, by notifying the owner","The architect, after inspection","The building official, by issuing the certificate of occupancy","The owner, by taking occupancy"],
  a:1, why:"The contractor prepares the punch list and requests inspection; the architect inspects and determines whether the work is substantially complete, then issues G704 establishing the date. The certificate of occupancy is a separate legal permission issued by the building official." },

{ t:"pjm-08", q:"At substantial completion, which insurance change occurs?",
  c:["The contractor's general liability is cancelled","Builder's risk gives way to the owner's property insurance","The architect's professional liability converts to occurrence form","The payment bond is released"],
  a:1, why:"Builder's risk covers the work during construction. At substantial completion the owner occupies and assumes risk of loss, so the owner's property insurance takes over — which is why G704 records responsibility for insurance explicitly and why the handover date matters." },

{ t:"pjm-08", q:"A contractor asks the architect to prepare the punch list to save time. What should the architect consider?",
  c:["It is efficient and should be done","Preparing the list is the contractor's contractual obligation, and taking it on assumes responsibility that belongs elsewhere","The owner must approve the architect doing so","It is permitted only after substantial completion"],
  a:1, why:"A201 makes preparing the list of items to be completed or corrected the contractor's obligation. The architect inspects and may add items. Drafting the contractor's list is outside the architect's scope and quietly shifts responsibility for its completeness onto the architect." },

{ t:"pjm-08", q:"Which document must the contractor provide before final payment where a performance bond was furnished?",
  c:["A new certificate of occupancy","Consent of surety to final payment","A revised schedule of values","An updated construction schedule"],
  a:1, why:"Final payment without the surety's written consent can discharge the surety's obligations under the bond, leaving the owner unprotected at the moment the last leverage disappears. A201 lists consent of surety among the required submissions." },

{ t:"pjm-08", q:"An eleven-month walkthrough is proposed. Under B101, how is this service classified?",
  c:["A basic service within construction administration","An additional service","A reimbursable expense","A warranty obligation of the architect"],
  a:1, why:"B101 lists review of the facility during the one-year correction period among the services available beyond basic services. It is valuable — it finds defects while the contractor is still obliged to correct them — but it is compensated separately and must be authorised." },

{ t:"pjm-08", q:"What does the contractor's affidavit before final payment address?",
  c:["That the work complies with the contract documents","That payrolls, material bills and other indebtedness connected with the work have been paid or satisfied","That the one-year correction period has begun","That the record documents are complete"],
  a:1, why:"The affidavit addresses the money chain, not the quality of the work. Its purpose is to protect the owner from unpaid subcontractors and suppliers liening the property after the owner has paid the contractor in full, which is why lien waivers accompany it." }

];
