DOE‑Driven Calibration Plan for FDM (OrcaSlicer-First Integration)

This document outlines a detailed plan for implementing a Design-of-Experiments (DOE) driven calibration system in the CalibrationTool (a React + Vite + shadcn/ui application). The focus is an OrcaSlicer-first approach (leveraging OrcaSlicer’s calibration features and 3MF projects) with a structured DOE workflow. The plan emphasizes quantifiable tests and clear scoring so results can be analyzed automatically, and it separates hardware-specific “printer setup” tuning from material-specific “filament profile” tuning.

What’s Covered in this Plan:
	•	A test catalog of calibration models and towers (with defined scoring rubrics for each).
	•	A two-track workflow for calibration: one for Printer Setup (hardware-focused, infrequent) and one for Filament Profile tuning (material-focused, for each filament type).
	•	A semi-automated DOE strategy (Taguchi screening designs and Response Surface optimization) to minimize the number of test prints while gathering rich data.
	•	Use of modifiers and 3MF projects (OrcaSlicer style) to embed parameter changes within single test files when appropriate (e.g. towers with different settings by layer).
	•	An example DOE trial scenario with a sample matrix of settings, demonstrating how to interpret results and refine parameters.
	•	Data and UI integration: how to incorporate the DOE planner into the app’s UI, data models for experiments, and how to present results and recommendations to the user.
	•	Clear delineation of MVP features vs. future enhancements (e.g., basic L9 Taguchi to start, adding L18 and RSM in v2).
	•	An appendix of scoring details for each test (to guide the UI implementation of result input), and a list of reference sources and models.

Single-Parameter vs. Combined Calibration Test Files

Before diving into the DOE-driven workflow, it’s important to understand the two fundamental types of calibration test models we’ll use. Calibration tests generally fall into two categories: single-focus tests (one parameter at a time) and combined multi-feature tests (many aspects in one print). Both have roles in our strategy.

Single-Focus Calibration Tests

Description: Single-focus tests isolate one aspect of printer performance per file (e.g. a temperature tower, a bridging test, or a retraction test). Each file is designed to tweak or evaluate a specific parameter in isolation. For example, one might print a simple overhang staircase to tune cooling, or dual pillars to tune retraction distance, or a series of cubes to tune flow/extrusion multiplier.

Pros:
	•	Isolated Variables for Clarity: Focusing on one parameter at a time makes it easier to pinpoint cause and effect. For instance, a temperature tower with all other settings fixed clearly shows how layer adhesion and surface finish change with temperature without other factors changing ￼. If stringing persists at all temperature levels, you know the issue is likely retraction, not temperature, and you can adjust retraction next instead of wondering if the temperature itself caused it. This clarity helps avoid confusion, especially for users learning how each setting impacts the print.
	•	Precise Tuning: Because each test targets one factor, you can fine-tune that setting without other issues muddying the results. A dedicated retraction test (like two posts to provoke stringing) lets you systematically eliminate stringing by tweaking retraction distance or speed, independent of temperature ￼. Similarly, a stand-alone bridging test (run at a constant, known-good temperature) lets you focus solely on bridge cooling and print speed. Isolating factors means you see the direct outcome of changing that factor.
	•	Optimized Speed: Single-focus models can be made very small and quick to print. By optimizing each test file’s design, it’s feasible to keep each print around 10–20 minutes while still gathering useful data. For example, Teaching Tech’s updated temperature tower STL was specifically redesigned to print faster while still incorporating key features (more overhang variations and a snap-off layer adhesion test pyramid) ￼. In general, each specialized test can be streamlined for speed and material efficiency, so running multiple short tests doesn’t consume too much time or filament.

Cons:
	•	Multiple Prints Required: Calibrating a variety of settings means running many separate prints. This can add up in total time and filament usage. A full calibration might involve one print for temperature, another for retraction, another for bridging, another for flow, etc. If each takes ~15 minutes, the total calibration process could be a couple of hours (though each individual test is short). Users looking for a quick one-and-done calibration might find this approach tedious.
	•	Sequential Dependency: Some settings interact, so you may need to iterate between tests. For example, temperature and retraction are interrelated — a hotter nozzle can increase stringing, so after finding the best temperature you might still need to adjust retraction, and vice-versa. Isolated tests make it straightforward to adjust one parameter at a time, but you might end up doing a second pass to balance them. (This iterative approach is often necessary for fine-tuning, even if combined tests are used, but it’s something to note: single-parameter tuning isn’t always strictly one-and-done if interactions exist.)
	•	Less “Real-World” Context: A single-focus test might not reveal compound issues that occur in more complex prints. You might dial in perfect retraction on a simple two-tower stringing test and perfect bridging on a small span, but then a real-world print (or a combined torture test) could expose interactions — for example, a bit of stringing that only appears during long bridge moves, or slight warping on large flat areas. Thus, after individual calibrations, it’s wise to do an all-encompassing test or a representative model to verify that all the tuned settings work well together under realistic conditions.

Combined Multi-Feature Calibration Tests

Description: Combined tests incorporate multiple calibration features in one print. Many popular community “torture test” models intentionally include a mix of challenges — overhangs, bridges, stringing pillars, dimensional test cubes, fine detail towers, etc. — all in a single object. For example, some temperature tower models have small stringing pillars and a bridge or overhang section built into each temperature level. Likewise, comprehensive “all-in-one” test files (often found on Thingiverse/Printables) include overhang ramps, bridging gaps, vertical pillars, holes and pegs for tolerance testing, and more in one print.

(Imagine an “All In One” calibration model that combines many features: overhang ramps at various angles, bridge spans of different lengths, upright posts to reveal stringing, nested parts or gap gauges for dimensional accuracy, etc. Such combined test files save time by evaluating multiple aspects of printer performance in one go.)

Pros:
	•	Time & Filament Efficient: The biggest advantage is efficiency. A combined test lets you check several parameters with one print instead of five. For example, one well-designed model can simultaneously assess bridging, overhangs, stringing, dimensional accuracy, and surface finish ￼. This conserves filament and reduces total print time compared to running each of those tests separately. It’s one setup and one print job, and you return to a trove of information covering multiple facets of print quality.
	•	Holistic Diagnosis: Multi-feature prints provide a broad overview of the printer’s performance. They’re great for quick diagnostics. For instance, after assembling or modifying a printer, you can run a single torture test model to see if anything obvious is off (stringing, warping, ringing/ghosting, poor overhangs, etc.). It’s ideal for new setups and periodic quality checks, where you want to ensure everything is dialed in within acceptable ranges ￼. If the combined test reveals a specific weakness (say, ugly bridges or ringing), you can then zero in on that with a targeted calibration test. In other words, combined tests are excellent for identifying what needs tuning.
	•	Interplay of Settings: Combined tests can highlight how one setting impacts different aspects of a print. A prime example is a temperature tower that includes bridging and stringing elements in each section. As the nozzle temperature changes per segment, you can observe multiple outcomes at once: stringing between posts, sagging of the bridge, surface gloss or matte finish, and layer adhesion strength, all as a function of temperature ￼ ￼. This provides insight into interactions: e.g. at higher temps, bridges might sag more and stringing increases, whereas at lower temps stringing improves but layer bonding weakens. Such information helps you find an optimal compromise or reveals the need to adjust another setting (like fan speed or retraction) in conjunction with temperature. In the context of DOE, a single combined test piece can yield multiple response metrics at once, which is very efficient for analyzing factor effects across different print qualities.

Cons:
	•	Results Harder to Interpret: Because multiple factors and features are involved in one print, multiple failure modes might show up together. It can be tricky to disentangle the root cause of an issue seen in a combined test. For example, if an all-in-one test print shows stringing on the bridging section, is the culprit nozzle temperature, insufficient retraction, slow cooling, or something else? You get a snapshot of overall performance, but not the clear isolation to immediately know which setting to tweak. In practice, users often still resort to focused tests after a combined print flags a problem. One community member summed it up well: use a temperature tower to find the right temp for strong layer adhesion, then use a separate retraction test to fix stringing — trying to fix stringing solely via a temp tower is inefficient. In short, a combo test can tell you that something’s wrong, but a specific test is usually needed to pinpoint what to adjust to fix it.
	•	Potential for Confounding Interactions: In a combined test where multiple parameters might be varying simultaneously (or one parameter affects multiple features), you can get confounded outcomes. In the temperature tower with bridging example, if retraction wasn’t calibrated first, you might see heavy stringing at every temperature level, potentially obscuring which temperature is best (because stringing is muddying the results at all levels). Or you might choose a cooler temperature because the bridges looked best there, but that cooler temp could be suboptimal for layer adhesion in general. When multiple effects overlap, it may be necessary to prioritize which issue to address first and then re-test. This is why calibration often becomes iterative: run a combined test, identify the worst artifact, then run a focused test to solve that issue, then maybe re-run the combined test to see the overall improvement.
	•	Longer Single Prints: While you save total time, a fully loaded calibration model can be somewhat large or tall, meaning the single print itself may take longer than any individual focused test. If the combined test is poorly optimized or tries to cover too much, it could push beyond a user’s patience. (That said, many popular all-in-one test models are still reasonably compact and print in under an hour.) One strategy is to include combined tests that target related groups of issues rather than absolutely everything at once – for example, a small model that tests various overhangs and bridges together (cooling-related features), and another that tests stringing and retraction separately. This way each combined file stays efficient and under ~20 minutes. The goal is to balance thoroughness with practicality so calibration doesn’t become a half-day affair. We will ensure our recommended combined tests are streamlined (small footprints, minimal infill, just enough layers to test the feature) so they finish quickly.
	•	Learning Curve for New Users: A novice might run a complex calibration print and see various flaws (sags, blobs, strings, etc.) but not immediately understand which printer setting corresponds to each flaw. Individual tests come with clearer instructions (e.g. “if you see stringing on the retraction test, increase retraction distance”). Combined tests demand a bit more knowledge to decode the results. For this reason, beginners often prefer a guided sequence of simple tests (like the Teaching Tech step-by-step approach) before attempting an all-in-one torture test. Too much data in one print can be overwhelming without context. We can mitigate this by providing good documentation or on-screen guidance in the tool (e.g. “If the bridging section failed, consider increasing fan speed or lowering temperature,” etc., right next to the result input fields). Our CalibrationTool can cater to different experience levels by offering both modular tests and combined tests with explanation.

Bottom Line – Our Approach: We will use a hybrid strategy that leverages both single-focus and combined tests. Single-parameter tests will be used when precision and isolation are needed (especially for initial calibration of fundamental parameters), and combined multi-feature tests will be used when efficiency or multi-factor interaction data is desired. This aligns with best practices noted in the Autodesk/Kickstarter 3D printer test protocol: use a comprehensive test for quick screening, but use targeted feature-specific models for detailed tuning of specific issues ￼. Our DOE-driven workflow will reflect this balance, as described below.

DOE-Driven Calibration System Design

With the above context in mind, we outline the DOE-driven calibration system. The system will guide users through a structured sequence: initial screening (possibly with multi-feature tests), focused calibrations for specific parameters, and (optionally) multi-factor optimization experiments. It integrates with OrcaSlicer’s capabilities (especially its ability to produce calibration towers and handle 3MF project files with modifiers).

User Challenges and Needs

Target Audience: “Prosumers” – advanced hobbyist or semi-professional 3D printer users who often upgrade or fine-tune their machines, try different filament brands, and demand high print quality. From community guides and user feedback, the recurring pain points for such users include:
	•	First-layer and Bed Adhesion: Getting a perfect first layer (Z-offset, bed leveling, adhesion) consistently.
	•	Extrusion/Flow Calibration: Ensuring that the printer extrudes the right amount (steps/mm and flow rate/extrusion multiplier tuning) for dimensional accuracy and strong layer bonding.
	•	Stringing and Oozing: Eliminating fine strings and blobs (tuned by retraction distance/speed, temperature, and coasting/wipe settings).
	•	Bridging and Overhangs: Improving the printer’s ability to print unsupported spans and steep overhang angles without sagging or drooping (affected by cooling, print speed, fan settings, support settings).
	•	Ringing/Ghosting: Reducing vibrations and echo artifacts near sharp corners (tied to acceleration, jerk/junction deviation, frame rigidity, etc., often addressed by input shaping or lower acceleration).
	•	Dimensional Accuracy and Fit: Ensuring printed parts are dimensionally accurate and that clearance fits (holes, peg-in-hole tests) are appropriate, which might involve flow tuning or axis step calibration.
	•	High-speed Extrusion Limits (MVS): Pushing the printer’s speed and flow (max volumetric flow rate) without under-extrusion, to know the safe print speed limits for a given material and nozzle.
	•	Advanced features: Pressure Advance (Linear Advance) tuning to counteract extrusion pressure delay, and resonance compensation (e.g., input shaper) for some printers.

Users want fast, consistent ways to dial these in, preferably with objective measurements rather than trial-and-error guesswork. This aligns with OrcaSlicer’s built-in calibration flow, which already includes things like flow rate calibration (the 3×3 block test with an automatic formula computation), a Pressure Advance tower, a temperature tower, a retraction tower, and a VFA (vibration frequency analysis) test. These tools encode quantifiable procedures (e.g., the flow calibration prints 9 small blocks and uses a formula to calculate the optimal flow percentage from the measured best block ￼). Our system will lean on these existing patterns for consistency and proven success.

In summary, the calibration system must address the above issues through guided tests that produce measurable results, and it must do so efficiently. By adopting a DOE approach, we intend to streamline the process of finding optimal settings by varying multiple factors systematically instead of one-by-one blind trial and error.

Design Philosophy: Quantifiable and Standardized

Two core principles will guide the design of our calibration experiments:
	1.	Quantify Whenever Feasible: Wherever possible, tests should yield quantitative data (actual measurements or counts) rather than purely subjective judgments. Quantitative outputs can be analyzed, plotted, and optimized. For example, measure the exact width of a printed calibration cube (to compute dimensional error in mm), count the number of strings between towers, or identify the longest bridge length that printed without sag. These numeric responses allow the software to perform calculations (like Taguchi signal-to-noise ratios or regression for optimization) and provide more objective recommendations.
	2.	Standardize Visual Judgments via Rubrics: Not everything can be purely numeric (some quality aspects are visual), so when subjective evaluation is needed (e.g. “bridging quality” or “surface finish”), we will use defined scoring rubrics with reference images to standardize the input. For instance, bridging could be scored 0 to 5 based on how many strands fell or how straight the bridge droop is compared to reference photos. This converts subjective impressions into a coarse quantitative score. A great reference here is the Autodesk/Kickstarter test (KSR/ADSK), which was explicitly designed for feature-based quantitative scoring – each feature has a pass/fail or measurable outcome to reduce subjectivity ￼. We will emulate that approach in our rubrics.

In practice, this means the calibration models we use will be chosen or designed to produce clear measurable outcomes (e.g. known target dimensions, specific countable features) and the UI will guide users to input results in a consistent way. By quantifying and standardizing, we ensure that our DOE analysis is based on reliable data. We also lean on community-accepted benchmarks (like the KSR test for overall performance, or Teaching Tech’s tests for specific tuning) to ground our approach in proven techniques.

Calibration Test Catalog

We will provide a catalog of test prints for different calibration purposes. Some of these will be static models (existing STLs or pre-designed 3MF projects), and others will be parameterized towers generated by the tool based on user input ranges (similar to how OrcaSlicer or Teaching Tech’s site generates custom G-code for towers). The key is that each test is associated with certain parameters to vary and a known method of evaluating the outcome.

Below is a breakdown of the test types we’ll include:

A. Combined “Screening” Tests (multi-feature, single print):

These are intended to cover multiple metrics in one go for efficiency, especially useful for initial screening or periodic checks:
	•	All-in-One Feature Test (KSR/ADSK style): A small-to-medium sized plate or single-object print that includes a variety of features. For example, the Autodesk/Kickstarter test model is one such design: it has pillars for fine detail, bridges, overhangs at increasing angles, dimensional towers, holes and pegs for tolerance, etc., all in one print. It can be scored quantitatively across several criteria ￼. We can use this or a similar community-developed model as a “holistic printer test.” This is great for DOE screening because one print yields many response variables (bridging score, overhang angle achieved, etc.) simultaneously.
	•	Calibration Cube with Tolerance Gauges: A simple 20 mm calibration cube that includes extra features like a set of small holes or gaps of various sizes. This can test X/Y/Z dimensional accuracy (by measuring the cube) and the smallest clearance that prints as a free gap or movable pin. It’s a quick print and gives numeric outputs (mm error on each axis, and e.g. “0.4 mm gap moves freely, 0.3 mm gap is fused” which yields a clearance capability metric). This is often used in the community to calibrate flow and dimensional accuracy.

(Why not rely only on a single all-in-one?) Even the Autodesk/Kickstarter team notes that while one big model is great for getting a broad overview quickly, targeted tests are better for fine tuning specific issues ￼. So, we include combined tests for screening and verification, but we use targeted tests for actual tuning adjustments.

B. Targeted Single-Parameter Tests (one factor per print or per segment):

These are focused tests, many of which will be implemented as towers or small models that systematically vary one parameter:
	•	Temperature Tower: A classic tower with multiple horizontal segments, where the nozzle temperature is changed for each segment (e.g., 5 segments from 220°C down to 200°C in 5° steps). Our version will incorporate small bridging and overhang features in each segment (as in Teaching Tech’s design) so that the user can judge not just stringing or surface finish, but also layer adhesion (with the snap-off pyramid) and bridging quality at each temperature ￼. The result is typically the user picking the temperature band that had the best overall trade-off (or specifically, highest layer adhesion without defects). This can be a semi-quantitative judgement (they might value adhesion first, then appearance).
	•	Retraction Tower: Similar concept: a tower with multiple segments (or multiple columns in one print) where retraction settings change per segment. For example, distance might increase with height, and perhaps retraction speed could vary with separate columns or models. The test usually consists of two vertical posts that create opportunities for stringing between them. The user would observe which segment shows the least stringing (or measure string count/length per segment). The output could be “the minimal retraction distance that eliminated stringing” (in mm) and the preferred retraction speed. Our tool can generate this by injecting G-code to change retraction parameters at specified layer heights (OrcaSlicer supports custom G-code triggers for such changes).
	•	Flow Rate Calibration (Extrusion Multiplier): OrcaSlicer already has a calibration routine for this: it prints a set of 9 small squares (3×3 grid) each with a slightly different flow multiplier (e.g. 95%, 100%, 105%, etc. via M221 or slicer flow modifiers). The user measures or visually checks which one has the proper extrusion width or which one has the best top surface, and then an equation is used to compute the optimal flow. We will reuse the Orca 3×3 flow test for this, including its calculation formula for new flow rate ￼. This yields a direct numeric result (a new flow % to set in the slicer). We can automate parts of it: e.g. after the print, user selects the best block index, and the tool computes the new multiplier.
	•	Cooling / Bridging Test: A part designed to test bridging specifically. For example, a print with a series of increasingly longer bridges (like 1 cm, 2 cm, 3 cm spans) to see at what length the bridge fails, or multiple spans at the same length to see how well they form. We could implement a fan speed tower (varying fan power by layer) to see how cooling affects bridging. The output might be “longest bridge length that printed without significant sag (mm)” or a score of how many out of N test bridges came out clean. If multiple fan speeds were tried in one print, the user picks the best-looking section.
	•	Max Volumetric Speed (MVS) Test: Often done as a stepped tower or a series of lines where print speed or flow rate increases by layer or segment, until under-extrusion is observed. OrcaSlicer has a “Speed and Flow” calibration which effectively tests this. The result is typically the maximum volumetric flow (in mm³/s) the hotend can sustain without defects. We will incorporate a test (like a tower with increasing speed) and have the user identify the layer at which quality dropped (thus determining the threshold). This yields a numeric “MVS” value that can be used to set slicer limits for that filament.
	•	Pressure Advance (Linear Advance) Tower: Many calibration guides include a linear advance test: a tower with sections printed with various PA (or similar) values, showing the effect on corners (bulging vs sharp) and on start/stop of lines. OrcaSlicer can generate a pressure advance pattern. The output is the value that yields the cleanest corners. This is typically done once per filament type (and sometimes per printer if extruder system differs). It results in a numeric K value for Marlin or a pressure advance value for Klipper.
	•	Resonance / Vibration Test (VFA): For printers with input shaping or just to assess ringing, a test is often a series of walls or letters printed at different speeds or with vibration frequencies. OrcaSlicer’s VFA calibration prints a set of shapes at varying input shaper frequencies to find which minimizes ringing. If the printer firmware supports it, this helps identify the resonance frequency. The output could be which frequency had least ringing (or which print had least ghosting). For our purposes, this is more of a printer setup calibration than filament-specific.
	•	Standard Benchmark Prints: Finally, we could include a couple of widely recognized models like a 3DBenchy as an optional validation print. While not quantitative, many users like to print a Benchy after tuning to visually confirm improvements. We note Benchy is a de-facto standard torture test for overall print quality (overhangs, bridging, small details, surfaces) and is public domain, so we can include it. The tool might not “score” a Benchy, but we could use it in a final validation step (“print this with your new settings to verify results”). This is more for user satisfaction and a sanity check.

Each test above either provides a direct measurement or a well-scoped qualitative outcome that we can map to a number. We will ship with a set of pre-designed models (either by including STLs or by procedural generation). The 3MF format will be used to package complex tests with multiple parts or modifiers, because 3MF can contain the objects along with slicer settings and modifier regions (making it easy to share and re-slice with consistent settings across users) ￼.

Scoring Metrics and Rubrics

For each test, we need a way to turn the printed result into data the software can use. This means defining what the response variable is and how the user should measure or evaluate it. Below are example scoring methods for key tests, designed to be quick and as objective as possible:
	•	Dimensional Accuracy (20 mm Cube): After printing a calibration cube, the user measures the X, Y, Z dimensions with calipers. The software can take the inputs (actual measured values vs 20.00 mm target) and compute the mean absolute error. We’ll likely also record the individual axis errors. Smaller is better for this metric. We can set a threshold (e.g., within 0.1 mm is excellent). This yields a numeric result in mm deviation.
	•	Clearance/Fit (Tolerance Test): For a part that has a series of holes or gaps (e.g., from 0.1 mm clearance up to 0.5 mm), the user checks which ones are free versus fused. The output can be the smallest gap (mm) that printed free (larger value means the printer needs that much clearance, so larger is actually worse in a sense, but we can define “larger gap = better tolerance achieved” or invert it). Or conversely, if there are pegs of increasing size that should fit into a hole, the largest peg that fits could be noted. In any case, this is a numeric threshold in mm. Larger is better if we frame it as “achieved clearance”.
	•	Bridging: If a model has multiple bridges (e.g., five bridges of increasing length or five identical bridges), we can simply count how many of them printed successfully without major sag or break. For instance, “4 out of 5 bridges were clean” could translate to a score of 4. We might also measure the longest span that printed nicely (in mm). Both could be recorded. We’ll likely use a discrete 0–5 score (since humans can easily grade 5 samples) and/or a length. Higher is better for both metrics (more bridges succeeded, longer span held).
	•	Overhangs: Similar approach: a test might have overhangs at 30°, 45°, 60°, 70° angles. The user notes the steepest angle that printed acceptably (without severe droop or surface roughness). That angle in degrees is the metric (higher = better capability). Alternatively, we assign a 1–5 score based on a reference chart (with example images of good/bad overhangs). Either way, higher is better (a printer that can handle 70° overhang scores higher than one that fails beyond 45°).
	•	Stringing: For the retraction test, the user could count the number of visible strings or measure the fine wisps’ length. E.g., “there are 2 small strings between the pillars” or “total string length ~5 mm.” We can just have them input a count. Lower is better (zero strings being ideal). We might convert it to a 1–5 scale for analysis (like 0 strings = 5 points, 1–2 strings = 4, a few = 3, etc., to handle it as a score).
	•	Flow (Extrusion Multiplier): In the Orca 3×3 test, the user picks the square that had no gaps and no over-extrusion. That selection corresponds to a modifier value (for example, square #5 might be 100% flow, #6 is 102%, #4 is 98%, etc.). OrcaSlicer’s documented formula then calculates the new flow percentage. We will automate that: the user just clicks the best square, and the program computes the new flow value. This is inherently quantitative (it yields a new flow calibration number). We will store that as a result.
	•	Ringing (VFA test): If using a ringing test tower, the scoring might be counting how many “ghost” ripples appear after a sharp corner at various test speeds or frequencies. A simple approach: if the tower prints sections at different resonance compensation frequencies, pick the section that had the least ghosting. This can be translated to “the optimal input shaper frequency.” Alternatively, if it prints a series of lines at various speeds (to see at what speed ringing becomes unacceptable), the user picks the fastest speed with acceptable ringing. We can score the severity of ghosting from 0 (none) to 5 (very bad) via reference images. In any case, the output could be an optimal setting or a qualitative score of ringing.
	•	Max Volumetric Speed (MVS): From the MVS test, the user identifies the point where under-extrusion or filament starvation began. For example, at 12 mm³/s everything was fine, at 14 mm³/s infill started getting sparse. We capture that threshold (12 mm³/s in this case) as the material’s maximum flow rate. Higher is better (it means the filament/hotend can go faster). This directly informs slicer settings like “max volumetric speed.” It’s a numeric result.

To summarize these in a more structured form, here’s a quick reference table of Test Metrics and Scoring:

Test / Response	How to Score (User Input → Stored Data)	Notes (Interpretation)
Dimensional Accuracy (calibration cube)	Measure X, Y, Z error in mm; compute mean absolute error. Store X/Y/Z errors separately as well.	Numeric (smaller is better). e.g., 0.15 mm avg error.
Clearance / Tolerance (gaps or pins)	Note smallest gap (in mm) that is free (or largest pin that fits).	Numeric (larger is better). e.g., 0.3 mm clearance needed.
Bridging (bridge test or section)	Count number of clean bridges (out of N) → score 0–N. Optionally record longest successful span length.	Discrete count + length (larger is better). e.g., 4/5 bridges, up to 25 mm span.
Overhang (overhang test)	Note maximum angle that printed well (degrees). Or assign 1–5 score based on reference images.	Numeric/ordinal (larger is better). e.g., handles 60°.
Stringing (retraction test)	Count number of strings (or total string length). Possibly convert to 0–5 score (0 strings = 5, etc.).	Numeric (smaller is better). e.g., 2 strings => score 4/5.
Flow Calibration (9-block test)	Select best-looking block; tool computes new flow rate (e.g., 1.02 = 102%). Store that multiplier.	Numeric (target ~1.0 ideal). Direct calculation using Orca’s formula.
Ringing (VFA) (speed/frequency tower)	Select section with least ringing (or count ringing ripples at worst case). Possibly a qualitative 0–5 score comparing to reference ringing images.	Ordinal or selected parameter (depends on test). e.g., best at 40 Hz input shaper.
Max Volumetric Speed (speed tower)	Identify layer/section where under-extrusion began; record corresponding speed or flow rate (mm/s or mm³/s).	Numeric (larger is better until limit). e.g., ~12 mm³/s MVS.

For an all-in-one screening print (like the KSR test), there will be multiple features to score. In that case, we can adopt the scoring system from that test: each feature gets a 1–5 score, and they define a weighted sum or overall percentage. For example, KSR/ADSK test evaluates: dimensional accuracy, fine negative feature (hole) accuracy, overhangs, bridges, stringing, support removal, and surface finish, each on a 1–5 scale, which can be totaled ￼. Our tool could mirror that: the combined test would have a form where the user enters a score for each category (with guidance). The advantage is we get a composite score to compare overall performance before/after tuning or between different filament profiles.

We will integrate reference images and short descriptions in the UI for each scoring prompt. For instance, when asking for a stringing score, show pictures of “5 = no stringing,” “3 = moderate stringing,” “1 = severe stringing” to help the user be consistent. Likewise for bridging (images of a perfect bridge vs a failed bridge), and overhang surfaces, etc. These references will come from known documentation (e.g., Simplify3D’s print quality troubleshooting guide or community image sets) and the Autodesk test documentation, which provides visual examples for each score in their protocol ￼. By doing this, we convert user observations into data as reliably as possible.

Separating Printer Calibration vs Filament Profile Tuning

In slicing software (and in OrcaSlicer’s profile system), there’s a clear distinction between printer settings and filament settings (as well as print-specific settings). We will mirror that distinction in our calibration workflow by having two tracks:
	•	Printer Setup Calibration (Hardware-Specific, done infrequently): This track is for things you typically do once per machine (or after a major hardware change). It includes:
	•	Frame and motion checks (belt tension, etc. – largely manual checks).
	•	First layer and Z-offset calibration – often done via a first-layer print test.
	•	Extruder E-steps and Flow – ensuring the extruder moves the correct length of filament (steps/mm) and setting an initial flow multiplier close to 1.0.
	•	PID Tuning – not a print, but we might remind the user to PID tune their hotend/bed.
	•	Pressure Advance (Linear Advance) – calibrate if the printer firmware supports it (especially for Bowden setups).
	•	Resonance (Input Shaper/VFA) – printing a ringing test to set input shaper or to decide on acceleration limits.
	•	Max speed/acceleration – e.g., an acceleration tower or simply using known safe values.
These tests result in updates to the printer profile or machine firmware (for things like E-steps, acceleration, etc.). They are generally not repeated for every filament; they’re about the machine’s physical capabilities.
	•	Filament Profile Calibration (Material-Specific, done for each new filament or major environment change): This track is for dialing in settings that depend on the filament’s properties:
	•	Nozzle Temperature – find the optimal temperature range for that filament (via temp tower).
	•	Flow Rate (Extrusion Multiplier) – fine-tune if that filament’s flow differs (via flow test).
	•	Retraction – distance and speed that work best to prevent stringing for that filament (retraction tower).
	•	Cooling Fan Setting – e.g., some PLA might print best at 100% fan, some silk PLA at 50%, PETG maybe 30% – we can determine via bridging/fan tests.
	•	Max Volumetric Speed – how fast can we push this filament before quality suffers (important for high-speed printing or large nozzle).
	•	Special tweaks – if applicable, e.g. for flexible filaments maybe slower acceleration, etc. (These might be handled via recommendations rather than tests.)
These tests result in updates to the filament profile (temperatures, flow, retraction, fan, etc.) in the slicer settings.

By separating these tracks in the UI, we ensure users focus on the right things in the right order. For example, there’s no point in doing an extensive filament retraction test if your extruder steps are way off (fix printer first), and conversely, when you switch to a new PLA brand you shouldn’t need to redo input shaping. Our DOE framework will usually assume the printer baseline is already good (or guide the user to do that first). We may implement it such that when you launch the calibration tool for the first time, it suggests doing Printer Setup track; and whenever you add a new filament profile, it guides you through Filament tuning track.

This also aligns well with how OrcaSlicer organizes profiles (Printer vs Filament vs Print settings). We can thus map calibration outputs to the correct profile fields: e.g., a new retraction distance goes into the filament profile, a new acceleration limit goes into the printer profile, etc.

DOE Strategy: Using Design of Experiments for Calibration

Now for the core of the system: applying DOE methodology. The idea is to intelligently vary multiple settings and analyze the results to find optimal combinations, rather than adjusting one thing at a time in isolation. Our approach will involve two phases commonly used in DOE:

6.1 Screening (Factor Significance) – Taguchi Orthogonal Arrays

For screening many factors at once, we’ll use Taguchi orthogonal array designs, which are fractional factorials with a specific structure. Taguchi designs allow us to study several factors with a relatively small number of runs, at the cost of not being able to fully resolve all interactions (but that’s okay for initial screening).
	•	For a quick filament tuning scenario, we might choose an L9 orthogonal array (which is a 3-level design for 4 factors in 9 runs) ￼. This could cover, say, 4 factors each at 3 chosen levels:
	•	Nozzle Temperature (e.g., low/medium/high within the filament’s range),
	•	Flow Multiplier (e.g., 0.95, 1.00, 1.05),
	•	Retraction Distance (e.g., 0.4, 0.6, 0.8 mm for a direct drive PLA for instance),
	•	Fan Speed (e.g., 30%, 60%, 100%).
These 4 factors × 3 levels = 81 possible combos full factorial; Taguchi L9 picks 9 strategic combos that spread out those levels orthogonally.
	•	For a more comprehensive experiment, we could use an L18 design which can handle up to 8 factors (7 factors at 3 levels, and 1 factor at 2 levels) in 18 runs ￼. For example, an L18 could let an advanced user co-optimize 7 different settings at once (though this is a lot!). A possible set might include: Temp, Flow, Retraction Distance, Retraction Speed (maybe 2 levels for direct vs Bowden or slow/fast?), Fan, Outer Wall Speed, and maybe Layer Height or another parameter. In most cases, we might not use all 18 if not needed, but it’s an option for expert use.

Using Taguchi arrays is beneficial because:
	•	Fewer Prints: It drastically cuts down the number of combinations to print and test. E.g., testing 4 factors at 3 levels each with full factorial would be 3^4 = 81 prints; Taguchi L9 uses 9 prints to glean main effects.
	•	Estimate Main Effects Robustly: Taguchi designs allow calculation of “main effect” averages and signal-to-noise (S/N) ratios for each factor’s levels ￼. This shows which factors have the biggest impact on each outcome (e.g., if temperature has a strong effect on stringing, you’ll see it in the analysis).
	•	Signal-to-Noise Ratios: We can use Taguchi’s S/N analysis to combine the variability and mean performance into one metric depending on goal type – larger-is-better, smaller-is-better, or nominal-is-best. For example, for stringing (smaller-is-better) we compute S/N = -10 * log10(mean of squares of response), etc. This can help identify a robust setting choice.

Example: Suppose we do an L9 with the 4 factors mentioned (Temp, Flow, Retract Dist, Fan). We’d prepare 9 distinct G-code files or 3MF projects, each with a fixed combination of those settings (as per the orthogonal array matrix). Each print would be a standard “screening plate” containing a few test features: maybe a couple of stringing posts, a small bridge, and a calibration cube all together (so that in each run we can measure stringing, bridging, and dimensional accuracy under that combination). After printing all 9, the user inputs:
	•	stringing count for each run,
	•	bridging score for each run,
	•	dimensional error for each run, etc.

From this, the software computes, for example, the average stringing count at Temp=200 vs 210 vs 220, or the average bridging score at Fan 30 vs 60 vs 100, etc., and determines which factors influence which outcome most. It might reveal, for instance, that stringing is most affected by retraction distance and temperature, while bridging is most affected by fan speed.

We also compute Taguchi’s S/N ratio for each response to guide toward optimal level combination. For stringing (smaller is better), a higher S/N indicates a combination of levels that yields low stringing consistently. For bridging (larger is better), a higher S/N indicates consistently good bridges.

The Taguchi screening will let us rank factors by importance. Maybe we find that two factors (say, Temp and Retract Distance) dominate the stringing and bridging outcomes, whereas Flow didn’t matter much within the tested range. This informs what to focus on next.

(Why Taguchi specifically?) It’s a classical approach for robust design screening, well-known in engineering, and appropriate here because it finds good settings even amidst noise. Also, Taguchi arrays are standardized, so we can have pre-set designs for given factor counts which simplifies implementation (we don’t need a custom solver for fractional factorial – we can hardcode or generate known orthogonal arrays). Taguchi’s philosophy of robust settings via S/N fits our goal of finding settings that work well overall.

6.2 Optimization (Refinement) – Response Surface Methodology (RSM)

After screening, we should have narrowed down the critical factors and approximate good levels. To fine-tune further, especially if there’s an optimal “in-between” value or an interaction between factors, we move to response surface methods.
	•	A common design for 3 factors is a Box–Behnken design, which is efficient and requires e.g. 15 runs for 3 factors at 3 levels each (including center point replicates) ￼. Box–Behnken will vary the factors in a way that we can fit a quadratic model (including interaction terms). For example, if our top 3 factors are Temperature, Retraction Distance, and Fan Speed, a Box–Behnken might test combinations like all at mid-level, each at high/low with others mid, etc. The result is we can use regression to fit a response surface (a quadratic equation for each response like stringing count = f(temp, retract, fan)).
	•	Alternatively, a Central Composite Design (CCD) could be used if we want to include more levels (including extreme ones beyond initial range), but Box–Behnken is safer if we want to avoid extreme combinations that might be problematic to print.

Using RSM, we can pinpoint optimum settings, for example:
	•	Find the temperature and retraction combination that minimizes stringing while keeping bridging above a certain score.
	•	We might use a desirability function to combine multiple objectives (e.g., minimize stringing and dimensional error, maximize bridging score). The tool could allow the user to weight what they care about (perhaps via sliders like “surface quality vs strength”).

The number of additional prints here is relatively small (on the order of 10–15 typically for a 2-3 factor optimization), which is reasonable after the initial screening.

If the user doesn’t want to do this step, they could skip it and just apply what was learned from Taguchi (often Taguchi’s recommended levels via main effects can be good enough). But for those who want the best fine-tuning, RSM provides that next level of precision.

6.3 Validation

Finally, after arriving at recommended settings, the system will prompt the user to validate them. This could be:
	•	Re-run a combined test or a known benchmark with the new settings to ensure improvement. For example, print the all-in-one test again and see the scores improve. The tool can show a “before vs after” comparison of scores if the user had initial data.
	•	Or have the user print a real model they care about (not automated, but a suggestion) to verify that print quality is satisfactory.

We will facilitate validation by allowing the user to export a full 3MF project file with all the new calibrated settings applied. The advantage of 3MF is that it packages the object and all the slicer settings (temperatures, speeds, etc.) into one file. For example, we could generate a 3MF for the KSR test model with the optimized settings embedded, so the user can slice/print it to confirm performance. If something is still off, they can tweak or even feed results back into another DOE loop.

Implementation in the CalibrationTool (Integration with Codebase)

Now we translate the above plan into concrete features in the app, ensuring it aligns with the existing architecture (React components, state management, etc.) and OrcaSlicer’s capabilities.

Existing Capabilities to Leverage:
	•	The repo already has a variety of calibration generators (for temp tower, flow, retraction, etc.) and likely uses templates or algorithms similar to OrcaSlicer. For instance, the AutoTower concept where G-code is injected at certain heights for temp changes, etc., and a facility to export 3MF or G-code.
	•	The UI framework (shadcn/ui with Radix components) can be used to create multi-step forms (wizards) and tables for inputs.
	•	Data structures for storing calibration results/recommendations (perhaps currently just showing them, but we’ll extend to store multiple runs).

We will add the following major components/modules:
	1.	DOE Planner UI: A new section of the app (accessible from a sidebar or main menu) where the user can set up an experiment. This will likely be a multi-step wizard:
	•	Step 1: Choose Calibration Track – “Printer Setup” or “Filament Tuning”. If Filament, perhaps select which filament profile or enter new.
	•	Step 2: Select factors to experiment with. We will provide presets for common sets (e.g., “Basic PLA Tune: Temp, Flow, Retract, Fan (L9)”, “Advanced: add Outer Speed, etc.”). Advanced users can customize factors and levels (with sensible limits).
	•	Step 3: Choose DOE design – default will pick appropriate Taguchi array based on factors count (or allow user to choose L9 vs L18). Possibly present the design matrix for review.
	•	Step 4: Generate Test Prints – This will produce a list of runs with specific parameter combinations. For each run, the tool will either generate a compound test model (like the screening plate with multiple features) with those settings, or instruct the user to print a certain tower if only one factor varies.
	•	We will likely implement a “Screening Plate” model internally (either as an STL or a parametric OpenSCAD that we embed) which has a small bridge, two posts, and a cube. This can be used for any arbitrary combination test. Alternatively, we can use the KSR test as the geometry for all runs, but that’s a bit heavy for 9 or 18 prints and not necessary for all DOE runs.
	•	The app will set slicer settings for that run. If using OrcaSlicer’s 3MF project format, we can actually programmatically create a 3MF where the filament settings are adjusted for that run’s factors. Another approach: generate G-code directly via OrcaSlicer CLI or our own generator using the known parameter values.
	•	The user will be prompted to print each file in turn. We might allow sequential naming and a checklist (Run 1, Run 2, …, Run 9).
	•	Step 5: Input Results – After printing, the user comes back and enters the observed metrics for each run. The UI here might be a table where runs are rows and metrics are columns. Or a step-by-step form that asks for each response from Run 1, then Run 2, etc., with the rubrics and images visible for guidance. We will ensure this data entry is as painless as possible (perhaps even mobile-friendly if they open the app on their phone near the printer).
	•	Step 6: Analysis – Once data is in, the tool will perform the DOE analysis:
	•	Calculate means and S/N for each factor level.
	•	Display main effect plots: e.g., a small chart showing average bridging score at each temperature tested, etc.
	•	Highlight which factors had the strongest effect on each outcome. Possibly rank by variance explained.
	•	Suggest optimal factor levels based on the analysis (Taguchi often suggests the combination of best levels for S/N or means). For example, it might say “Preliminary result: Temperature ~210°C, Retraction ~0.6 mm, Fan ~100%, Flow ~1.0 seem best for balancing the tested criteria.”
	•	If interactions seem likely (or if an optimal combo wasn’t explicitly tested in the Taguchi matrix), the tool can suggest a follow-up (like RSM or a confirmation run).
	•	Step 7: Optimization (optional) – If the user wants to refine further, they can proceed to an RSM experiment setup. The UI can pre-select the top 2–3 factors. The design (Box–Behnken or CCD) is generated similarly, producing another set of runs (usually including some repeats at the center for error estimation).
	•	The process repeats: user prints those, inputs results. Then the analysis fits a response surface model (we can use regression libraries or simply solve quadratic fit since 3 factors small data).
	•	The tool then finds the optimal setting combination (we could even allow an “optimizer” that finds the combination of the continuous factor ranges that gives best results for chosen weights).
	•	Present recommended settings and expected outcome metrics.
	•	Step 8: Apply Settings – Finally, we provide an “Apply to Profile” or “Export Profile” step:
	•	If the user is using OrcaSlicer (which they likely are if we say OrcaSlicer-first), we can generate a snippet of profile JSON or a .ini that they can import, or instruct them to set those values manually. Perhaps the app could directly integrate with Orca’s config if accessible.
	•	Alternatively, export a 3MF project file that has the calibrated settings. This 3MF could include a test model (like a Benchy or the KSR test) so the user can print it as a final validation with those settings baked in ￼.
	•	We’ll also save the results internally, so the app can show “Filament X calibrated on Date, results: optimal temp, etc.”, possibly with a summary report.
	2.	Run Generator Backend: We need the logic to create the actual test prints for each run of the DOE. This will utilize our existing calibration models:
	•	For a combined screening plate, we will likely have a stored STL (or a function to generate one) that has the needed features. We then need to apply the specific settings for that run. We can leverage OrcaSlicer’s 3MF project format for this: essentially, create a copy of a base 3MF where we inject the profile changes (temperature, flow, etc.). OrcaSlicer uses plain text JSON inside 3MF for profiles, or we could use its CLI to slice with given settings.
	•	For towers like temp or retraction towers, if our DOE includes, say, temperature as a factor at multiple levels in one run, it might be more efficient to actually incorporate that into a single print rather than separate runs. However, in Taguchi DOE, each run typically is a unique combination printed separately (to maintain independence). So likely, each DOE run is a separate print with static settings, rather than trying to do multiple DOE points in one print (which would tangle the data).
	•	We will have to ensure that for each run, the printer/slicer settings are correctly applied: e.g., set temperature via start G-code to the target, set flow percentage (M221 or slicer flow), set retraction length/speed (via slicer settings or custom G-code if needed), set fan speed (M106 Sxxx after first layer).
	•	We can use modifier blocks in Orca or separate processes to change certain settings for different parts of a test model if needed, but for simplicity, likely each run will have uniform settings throughout its geometry.
	•	The app should clearly label the output files (e.g., “DOE_Run1_Temp210_Fan60_Re0.6.gcode”) for easy identification when printing.
	3.	Result Storage and Data Model: We will introduce some data models such as:
	•	Experiment (table or object) – with fields: id, date, user, printer profile, filament profile, design type (e.g., L9 Taguchi), factor list, etc.
	•	Factor – name, levels, maybe units (°C, mm, %).
	•	Run – link to Experiment, a dictionary of factor levels (e.g., Temp=210, Flow=1.0, Retract=0.6, Fan=60), and a place to attach the measured responses.
	•	Response – could be stored per run as a dict of metric: value.
	•	We might not need a separate Response entity if we just store it inside Run or as part of Experiment data as arrays.
	•	AnalysisResults – perhaps store the computed optimal settings, or the main effect values, etc., for future reference or for showing in UI later.
This could all be kept in local storage or a small indexedDB if we want persistence between sessions. The data volume is tiny (a few numbers per experiment).
	4.	Analytics Engine: For Taguchi, the math is straightforward averages. We can code functions to:
	•	Compute S/N ratio for a list of values given the objective type (larger better, etc.).
	•	Compute factor level means: iterate over runs, accumulate values for each factor level combination.
	•	Determine the recommended level for each factor (the one with best avg or S/N).
	•	We might also do ANOVA to rank factor significance, but Taguchi typically uses visual interpretation of main effects and S/N ranking.
	•	For RSM: we might integrate a small solver or use regression (since 2nd order polynomial fits can be solved by linear regression given the designed points). Python could do it, but since our environment is browser/JS, we might either call a web worker with a math library or implement regression in JS (the data sets are small, so that’s fine).
	•	Possibly integrate with an existing DOE library if one exists for JS, but likely not needed.
	5.	UI Hooks:
	•	We will use components like sliders, dropdowns, and numeric inputs for factor level selection. We will also need to dynamically generate input fields for results. This suggests a form that is dynamically built based on the experiment’s defined responses.
	•	The scoring reference images might be small thumbnails that pop up in a modal or tooltip. We need to host those images (could embed them since the app is local).
	•	Plotting results: a simple bar chart of factor effects could be useful. We might use a small chart library or just textually describe (“When temperature increased from 200 to 220, stringing count went from 8 to 3 on average – indicating hotter reduces stringing in this range” – or whatever the data says).
	•	We will provide a textual recommendation as well, summarizing findings (this could be generated by some template or even by calling a GPT model if that was in scope, but likely just our code).

Integration with Existing Flows:
The CalibrationTool already has pages for things like Flow calibration, etc. Our DOE Planner won’t replace those; it will complement them. In fact, after a DOE screening, we might direct the user to run a specific built-in calibration for fine tuning. For example, if DOE suggests flow should be around 0.95, we might still have them do the Orca flow 3×3 to precisely measure it. We can streamline this by automatically setting the range around that suggestion.

Likewise, DOE might identify an ideal temperature, but the user might want to run one more temp tower focusing in a narrower range to confirm (especially if DOE used only three coarse levels). Our tool can facilitate those one-off prints as needed.

However, ideally, the DOE plus internal scoring should suffice to reach a good result without manual one-factor-at-a-time loops unless the user wants to.

Example Workflow: A Filament Tuning DOE Trial

To make this concrete, consider a fictional example scenario:
	•	Context: The user has a direct-drive printer, loaded with a new PLA filament. They want to calibrate it for optimal print quality.
	•	They open the DOE Planner, choose “Filament Tuning,” select 4 factors (Temp, Flow, Retract Distance, Fan) for a Taguchi L9 experiment. We provide default levels:
	•	Temp: 200, 210, 220 °C (based on typical PLA range).
	•	Flow: 0.95, 1.00, 1.05 (relative multiplier).
	•	Retraction Distance: 0.4, 0.6, 0.8 mm (since direct drive doesn’t need much).
	•	Fan: 30%, 60%, 100%.
	•	The planner shows the L9 matrix of 9 runs with these combinations (we’ll label them 1–9). For instance, one possible orthogonal array assignment (not unique) could be:

Run | Temp | Flow  | Retract | Fan
1   | 200  | 0.95  | 0.4     | 30
2   | 200  | 1.00  | 0.6     | 60
3   | 200  | 1.05  | 0.8     | 100
4   | 210  | 0.95  | 0.6     | 100
5   | 210  | 1.00  | 0.8     | 30
6   | 210  | 1.05  | 0.4     | 60
7   | 220  | 0.95  | 0.8     | 60
8   | 220  | 1.00  | 0.4     | 100
9   | 220  | 1.05  | 0.6     | 30

	•	The app generates 9 print files. Each is a small test model (say, our screening plate which has a 30 mm bridge, two posts for stringing, and a 20 mm cube). It applies the above settings to each file (for Run1: temp 200, flow 0.95, etc.).
	•	The user prints all 9 (perhaps over time) and keeps them labeled.
	•	Now they go to input results. The app might show a table like:

Run	Strings observed	Bridges good (0-5)	X/Y/Z Error (mm)	Notes
1	(input)	(input)	(input avg)	
2	…	…	…	
…				

Suppose they fill it as (totally making up data):
	•	Run 1: 8 strings, bridge score 2/5 (some sag), dimensional error 0.20 mm.
	•	Run 2: 4 strings, bridge 3/5, error 0.18 mm.
	•	Run 3: 2 strings, bridge 2/5 (bridge sag due to high fan?), error 0.30 mm.
	•	Run 4: 3 strings, bridge 4/5, error 0.16 mm.
	•	Run 5: 5 strings, bridge 3/5, error 0.12 mm.
	•	Run 6: 6 strings, bridge 4/5, error 0.14 mm.
	•	Run 7: 4 strings, bridge 5/5, error 0.22 mm.
	•	Run 8: 7 strings, bridge 3/5, error 0.10 mm (maybe high temp improved flow hence very low error).
	•	Run 9: 5 strings, bridge 2/5, error 0.11 mm.

	•	Analysis:
	•	The tool calculates averages:
	•	Stringing: By factor: It might find stringing was lowest at high Temp (220 → avg 5 strings vs 200 → avg 4.67 vs 210 → avg 4.67 in our fake data, not a big difference here), and clearly better at Retract 0.8 vs 0.4 (e.g., 0.8 mm gave fewer strings on average). That suggests retraction distance is important. We might see flow had minor effect on stringing here (except extreme flow can cause blobs maybe). And perhaps fan: 100% fan might reduce stringing if it solidifies filament faster, or increase if it cools nozzle? The data might show a trend.
	•	Bridging: Likely best at Fan 100% (since run with fan 100 had higher scores overall), and perhaps slightly better at 210–220°C (hotter improves layer bonding of bridge?). Our data shows run7 (220°C, low flow, 0.8 retract, 60% fan) got 5/5 on bridges, and run4,6 also had 4/5 with high fan. So fan appears critical. Also maybe temperature: runs at 200°C had lower bridge scores (2,3).
	•	Dimensional error: Looks like runs with Flow 1.05 had slightly higher error (0.30, 0.14, 0.22) vs Flow 1.00 or 0.95 (mostly 0.10–0.18). So it suggests flow 1.05 might be over-extruding a bit, causing more dimensional error. We see the best (0.10-0.16) mostly around Flow 1.00 and 0.95. So probably flow should be ~1.0.
	•	The Taguchi S/N could reinforce these findings by highlighting the factor that improves consistency. But even without S/N, we can deduce:
	•	Retract 0.8 mm seems to yield very low stringing (runs 3,5,7 had 2,5,4 strings vs retract 0.4 runs had 8,6,7 strings).
	•	Fan 100% yielded better bridges (runs 3,4,8 had lower bridge sag issues compared to fan 30 runs like 1,5,9).
	•	Flow around 1.0 gave best dimensions (the user might target ~1.0 and then do a finer flow cal).
	•	Temperature effect here maybe shows 210 was a sweet spot: runs 4,5,6 at 210°C generally did well across metrics.
	•	The software might output something like:
	•	“Stringing was most affected by retraction distance (longer retraction = fewer strings) and by nozzle temperature (a bit fewer strings at higher temp in this dataset). Bridging was most affected by fan speed (100% fan gave the best bridge results). Dimensional accuracy improved with slightly lower flow settings. Based on these 9 tests, a good starting point for this filament appears to be: Temperature ~210°C, Flow = 1.00, Retraction = 0.6–0.8 mm, Fan = 100%.”
	•	It might also suggest confirming flow precisely: “Next, run a flow calibration to fine-tune extrusion multiplier (expected to be around 0.98–1.00).” And maybe “Run a retraction tower around 0.5–0.8 mm to confirm optimal retraction with these temperature/fan settings.” (This leverages our existing targeted tests for final refinement.)
	•	If the user is satisfied, they apply those settings. If they want to optimize further, maybe they decide to do an RSM on Temp and Retract (since those two might have an interaction: stringing might depend on both).
	•	A Box–Behnken on Temp (200,210,220) and Retract (0.4,0.6,0.8) and Fan (let’s say they fixed Fan at 100 now and Flow at 1.0) could be done. That’s 13 runs perhaps – maybe they skip it unless super critical.
	•	Finally, they export a 3MF for a Benchy with those settings or update the filament profile in OrcaSlicer accordingly. Then print a Benchy or the Kickstarter test to verify improvements.

This example shows how DOE can reduce the guesswork. Instead of separate temp, retraction, fan tests (which would be sequential and possibly not accounting interactions), the user did 9 prints and got a broad picture. It’s still somewhat intensive, but for a prosumer tuning a high-end printer or a new material, it’s worth it for the optimal quality.

We will ensure the software also provides simpler recommendations for casual users (not everyone will do a full L9). Users could still do one-factor tests or accept defaults. The DOE Planner is a power feature, but we’ll make it as user-friendly as possible so more users can take advantage of it without deep statistical knowledge.

When to Use Combined vs Separate Tests in the Workflow

Throughout the calibration process, we will smartly decide when to use a combined test versus a targeted test:
	•	Initial Screening: We favor a combined test (or a small set of them) to quickly gauge overall performance. For example, the first thing after assembling a printer might be to print the all-in-one test model (KSR test) to see if anything is glaringly wrong. Similarly, when tuning a filament, an initial DOE run might use a combined test geometry to capture multiple responses at once. This is efficient and aligns with the idea of using one big model for a broad read ￼. The Taguchi experiments as described will often use a combined test piece containing multiple features (bridge + pillars + cube) – effectively a mini all-in-one specialized for DOE runs.
	•	Focused Tuning: Once specific issues are identified (e.g., stringing is the worst problem, or overhang quality is poor), we switch to separate targeted tests to fine-tune that specific parameter without other variables. This is in line with the Autodesk/Kickstarter guideline that after the general test, you should use feature-specific models for detailed evaluation ￼. Our tool will guide the user: for example, if after screening, stringing is still not resolved, it might prompt “Run a Retraction Tower next for more precision.” Or if dimensional accuracy is off, run the flow calibration.
	•	Validation: After tuning each critical factor individually, we might use a combined test again to validate that all issues are now resolved together and that no new interactions popped up. (E.g., after fixing retraction and temperature separately, print one more multi-feature object to ensure stringing is gone and bridging and walls are still good.)

In short, the DOE approach itself can involve both combined and separate tests: Taguchi combined runs for efficiency, then targeted towers for confirmation, then combined print for final check. By blending both, we get the best of both worlds – thorough calibration without unnecessary prints ￼.

This hybrid strategy will be communicated clearly to the user so they understand why we’re doing another test and what it achieves. The UI might label tests as “[Automated]” vs “[Manual]” suggestions, etc.

Data Model and UX Integration Details

To implement the above, we outline how data and state flow through the system:
	•	Data Structures:
	•	CalibrationExperiment: stores metadata (type: printer or filament, design used, date, printer model, filament type). It also contains an array of factors and an array of runs.
	•	Factor: stores name (e.g. “Nozzle Temperature”), unit (“°C”), and the levels (array of values). Could also have a flag for how to apply it (e.g., this corresponds to a G-code command or profile setting).
	•	Run: for each run in the design, stores an ID or index, and a map of factor -> level (e.g., {“Temp”:210, “Flow”:1.0, “Retract”:0.6, “Fan”:100%}). Also will have a result object that maps metric -> value once entered.
	•	Metric definitions: We can have a predefined list of metrics we expect from a given test type. For a screening plate, metrics might be [“stringing_count”,“bridging_score”,“dim_error”,“tolerance”] etc. Each metric entry can have info like larger_is_better or target_nominal.
	•	AnalysisResult: could include recommended settings and maybe the raw calculations for display (like arrays of S/N for each factor).
	•	State Management: We can use React context or Zustand (if already in use) to hold the current experiment state as the user goes through the wizard. On the final step, we might save it to local storage or allow export (JSON) for record-keeping.
	•	User Interface Flow:
	•	We will implement a Stepper or multi-step form component. Each step will likely be its own route or component, but we can also do it within one component conditional on current step.
	•	At the result input step, the UI will be critical: it should clearly show which print the user is scoring (maybe allow uploading a photo? – nice to have, but not necessary). We could allow the user to fill results in any order, but guiding run-by-run is simpler to avoid confusion.
	•	The analysis step should present key takeaways in a friendly way. Perhaps using plain language summaries (we can prepare template strings that fill in factor names and directions of effects).
	•	We might incorporate some simple interactive charts (like clicking a factor to see how the outcome changed with its levels).
	•	Error Handling: If a user prints fail or data is inconsistent, allow them to discard a run or reprint it. Also, validation on inputs (e.g., string count must be a number, etc.).
	•	Persistence: Save experiments so user can refer back (“Last week I tuned PETG, here were the results”). Possibly allow exporting the data to CSV for the real data nerds.

MVP vs Future Enhancements

Phase 1 (MVP): Focus on a streamlined use case to prove the concept:
	•	Implement an L9 DOE for filament tuning with 4 factors (Temp, Flow, Retraction, Fan), as this is a common scenario and manageable number of prints. Provide a fixed screening test geometry (like the small plate).
	•	Scoring UI for the key metrics (stringing, bridging, dimensional) with reference images.
	•	Automatic suggestion of new profile values for those four factors.
	•	Integration with the existing OrcaSlicer calibration generators for follow-ups: e.g., after L9, a button “Print Flow Tower” that pre-fills the tower with the temperature you found.
	•	Export of a .3mf project for a validation model with the new settings.
	•	Ensure the basic data analysis (main effects) is working and giving sensible advice.

Phase 2 (Future):
	•	Add support for L18 designs for advanced users who want to include more factors (e.g., adding outer wall speed, infill speed, etc., or doing a printer mechanical test with factors like acceleration, jerk, etc.).
	•	Add the RSM optimization step (Box–Behnken or CCD): this requires regression analysis and possibly a more advanced UI to let user pick multi-objective priorities. This is a power feature.
	•	Incorporate VFA and MVS tests more deeply: maybe include ringing and volumetric capacity in the DOE or at least in the scoring to ensure high-speed performance is part of the calibration.
	•	Possibly integrate a computer vision helper: e.g., the user can take a photo of the test and an ML model could count strings or measure bridge droop. This is ambitious, but could hugely simplify user input. (This might be beyond scope, but it’s an idea.)
	•	Broaden to Printer Setup DOE: e.g., maybe experimenting with input shaper frequencies or acceleration vs jerk trade-offs systematically. This is less likely since those are usually one-time tunes, but we could implement a basic version (e.g., test 3 acceleration levels × 3 jerk levels, see which yields best corner sharpness vs ringing compromise).

Throughout, we will keep the UI user-friendly and not overly statistical. We might hide terms like “ANOVA” or “regression” and instead say “We tested 9 combinations; here’s what we learned.”

Appendix: Scoring Rubric Details for Implementation

For reference, here are some specific scoring guidelines we’ll use in the UI (as hints or defaults):
	•	Dimensional Error to Score: We can map the mm error to a 5-point scale for user feedback. For example: ≤0.05 mm error = 5 (excellent), 0.05–0.1 = 4, 0.1–0.2 = 3, 0.2–0.3 = 2, >0.3 = 1 (poor). We will store the actual mm error for analysis, but also provide this qualitative scale.
	•	Clearance (Tolerance): If the smallest free gap is X mm, we might map that inversely to a score. e.g., needing ≥0.5 mm gap = score 1 (poor tolerance), 0.4 mm = 2, 0.3 mm = 3, 0.2 mm = 4, 0.1 mm = 5 (excellent, can resolve very tight gaps).
	•	Bridging: Simply use the count out of N as the score (so 0–5 bridges okay gives score 0–5). If using length, could normalize (like if max span without sag is 30mm, maybe that’s a 5 if 30 is the max test length).
	•	Overhang: If angles tested 30–70°, we can say each 10° step = 1 point: passing 70° = 5, 60° = 4, 50° = 3, 40° = 2, 30° only = 1.
	•	Stringing: Use the count of strings: 0 = 5, 1–2 = 4, 3–5 = 3, 6–10 = 2, >10 = 1 (assuming a certain test length; we’ll adjust thresholds based on typical outputs).
	•	Flow (Orca): Not a 5-point thing; we directly calculate the new flow % from the block selection. We will present the new flow value to the user and perhaps a message like “Set Flow to 95% in filament settings” if that’s the result.
	•	Ringing (VFA): Possibly number of ringing lines visible: 0 lines = 5 (great), 1 = 4, 2 = 3, 3 = 2, >3 = 1. Or we’ll just have them pick the best section and trust that as optimal.
	•	MVS: No score needed; we record the maximum feedrate or volumetric rate. But for comparison, we could say relative to typical values (e.g., PLA on an E3D V6 ~ 11 mm³/s, if user got 15, that’s above average so “5”, if only 5 mm³/s, that’s “1” etc. This might not be necessary to present, mostly for setting print speeds.)

These details will be embedded in the UI in tooltips or descriptions so the user knows how to judge each result. The goal is to minimize ambiguity: e.g., “Bridge is good if it’s straight without droop in the middle. Count how many bridges in the test print look good and enter that number.”

References and Sources

The plan draws on established community practices and references. Key sources for our approach include:
	•	OrcaSlicer Documentation: Official wiki on calibration procedures (flow rate calibration, VFA, etc.) – we align with those methods ￼.
	•	Prusa Knowledge Base on 3MF: Demonstrates how 3MF can save entire project configs ￼, which we will use for sharing calibration projects.
	•	Autodesk/Kickstarter 3D Printer Test (KSR): Open-source test emphasizing feature-based design and quantitative scoring ￼ ￼. We follow its guidance on when to use combined vs targeted tests and use its scoring ideas for our rubrics. The test itself is used as a benchmark in our system.
	•	Teaching Tech’s Calibration Guide: A comprehensive step-by-step calibration resource, from which we adopt ideas like the improved temperature tower design ￼ and others. It shows the value of guided calibration and inspired our UI approach.
	•	Community Discussions and Advice: (e.g., Reddit, forums) on calibration sequencing – reinforcing points like tuning temperature for adhesion first, then retraction for stringing, etc., which influenced our recommended workflow.
	•	Academic/Industrial DOE References: NIST’s Engineering Statistics handbook for Taguchi and RSM designs ￼ ￼, confirming our chosen designs (L9, L18, Box-Behnken) are appropriate and how many runs they require.

By implementing this DOE-driven calibration system, we aim to give users a powerful yet user-friendly way to scientifically tune their printers and materials. It will reduce guesswork, shorten the total calibration time (especially when dealing with multiple new materials or new machines), and result in better print quality through data-driven decisions. The integration with OrcaSlicer ensures we’re building on a strong foundation of existing calibration tools and slicing capability, rather than reinventing the wheel.

Direct URLs (for reference and further reading):
	•	CalibrationTool GitHub (existing project): [flight505/CalibrationTool repository] – to correlate with existing code structure (React components, etc.).
	•	OrcaSlicer Calibration Wiki (overview of flow, temp tower, PA, etc.): ** ￼ ￼**.
	•	OrcaSlicer VFA (ringing) test page: [OrcaSlicer wiki on VFA calibration].
	•	Prusa Knowledge Base – Saving projects as 3MF: ** ￼** (shows 3MF contains objects and settings).
	•	Autodesk/Kickstarter Test repository and wiki: ** ￼ ￼** (feature design, scoring, and rationale for one big model vs targeted models).
	•	Kickstarter blog announcement of the test: Toward Better 3D Printers (Kickstarter Blog).
	•	Printables link for KSR test: Kickstarter & Autodesk collab test on Printables.com (for model and scoring sheet).
	•	Teaching Tech Calibration Guide (V2): ** ￼** (temp tower model details and other test generators).
	•	Obico blog – OrcaSlicer calibration deep dive (explains each calibration tool in OrcaSlicer and how to use, useful for integration).
	•	All3DP troubleshooting and calibration articles (for reference images and typical ranges).
	•	Simplify3D Print Quality Guide (another source of images for issues like stringing, etc.).
	•	NIST/Engineering Statistics Handbook – Taguchi designs (explains L9, L18 arrays) ** ￼, and Response Surface designs ** ￼.