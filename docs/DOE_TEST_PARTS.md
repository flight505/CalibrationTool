# The generated DOE Test Parts Specification

## Bridge Array V2
Here’s Overhang Ramp V2 — overhang_ramp_v2 as an ASCII STL, generated deterministically from a parametric model:

Download: overhang_ramp_v2.stl

⸻

Geometry I implemented (explicit conventions)
	•	Base: 100 × 40 × 1.2 mm (X × Y × Z).
	•	Five cantilever stages (lanes): each plate 30 × 6 mm, thickness 1.4 mm.
	•	Angles: interpreted as degrees from vertical (common in slicer “overhang angle” settings):
	•	from‑vertical = 30°, 40°, 50°, 60°, 70°,
	•	which equals from‑horizontal = 60°, 50°, 40°, 30°, 20° respectively.
	•	Anchor/hinge: each plate is attached along a line at X = 35 mm, Z = 28.98 mm above the base (chosen so the worst case, 60° from horizontal, still clears the base by ~1 mm at the free tip).
	•	Riser blocks (per lane): 6 mm thick in X, extend 0.3 mm past the pivot toward +X so the plates overlap (robust manifold union); they rise from Z=2 mm (top of base) slightly above the pivot.
	•	Stiffener rib at trailing edge: a flange perpendicular to the plate plane, thickness 1.2 mm (along plate length), height 4 mm above the plate, sunk 0.02 mm into the plate to avoid coplanar faces.
	•	Lane layout (Y): lanes are centered across the 40 mm depth with 2 mm clearance between lanes: Y starts at [1, 9, 17, 25, 33] mm, each lane is 6 mm wide.

If you prefer the angles defined from horizontal instead, say the word and I’ll regenerate with those exact angles (or include both in a dual‑set STL).

⸻

Why this should slice cleanly
	•	STL is ASCII with outward normals computed by cross products.
	•	All features have overlaps (0.3 mm at hinge, 0.02 mm rib sink) to ensure proper unions in OrcaSlicer.
	•	No hidden support under the stages; each plate is a true overhang from its pivot.

⸻

Quick verification numbers
	•	Worst‑case drop at 60° from horizontal: 30 * sin(60°) ≈ 25.98 mm;
chosen pivot height: 2 + 25.98 + 1 ≈ 28.98 mm → free tip bottom ~3.0 mm above the base.
	•	Free tip X reach (20° from horizontal): 35 + 30*cos(20°) ≈ 63.2 mm (well within the 120 mm base).

⸻

Optional tweaks (I can regenerate immediately)
	•	Angle standardization: from‑horizontal vs from‑vertical (or add engraved angle text pads for your app to label).
	•	Rib geometry: adjust thickness/height or move it slightly inboard (e.g., 0.5 mm) if you want the very edge clean.
	•	Anchor strategy: a single continuous back wall vs per‑lane risers (currently per‑lane for clarity).
	•	Export formats: OpenSCAD parametric source, STEP, or a JSON parameter block your Calibration Tool can ingest.

If anything looks off in OrcaSlicer (bounds, unions, normals), tell me exactly what you see and I’ll adjust and re‑export right away.

## Overhang Ramp V2
Here’s Overhang Ramp V2 — overhang_ramp_v2 as an ASCII STL, generated deterministically from a parametric model:

⸻

Geometry I implemented (explicit conventions)
	•	Base: 100 × 40 × 12 mm (X × Y × Z).
	•	Five cantilever stages (lanes): each plate 30 × 6 mm, thickness 1.4 mm.
	•	Angles: interpreted as degrees from vertical (common in slicer “overhang angle” settings):
	•	from‑vertical = 30°, 40°, 50°, 60°, 70°,
	•	which equals from‑horizontal = 60°, 50°, 40°, 30°, 20° respectively.
	•	Anchor/hinge: each plate is attached along a line at X = 35 mm, Z = 28.98 mm above the base (chosen so the worst case, 60° from horizontal, still clears the base by ~1 mm at the free tip).
	•	Riser blocks (per lane): 6 mm thick in X, extend 0.3 mm past the pivot toward +X so the plates overlap (robust manifold union); they rise from Z=2 mm (top of base) slightly above the pivot.
	•	Stiffener rib at trailing edge: a flange perpendicular to the plate plane, thickness 1.2 mm (along plate length), height 4 mm above the plate, sunk 0.02 mm into the plate to avoid coplanar faces.
	•	Lane layout (Y): lanes are centered across the 40 mm depth with 2 mm clearance between lanes: Y starts at [1, 9, 17, 25, 33] mm, each lane is 6 mm wide.

If you prefer the angles defined from horizontal instead, say the word and I’ll regenerate with those exact angles (or include both in a dual‑set STL).

⸻

Why this should slice cleanly
	•	STL is ASCII with outward normals computed by cross products.
	•	All features have overlaps (0.3 mm at hinge, 0.02 mm rib sink) to ensure proper unions in OrcaSlicer.
	•	No hidden support under the stages; each plate is a true overhang from its pivot.

⸻

Quick verification numbers
	•	Worst‑case drop at 60° from horizontal: 30 * sin(60°) ≈ 25.98 mm;
chosen pivot height: 2 + 25.98 + 1 ≈ 28.98 mm → free tip bottom ~3.0 mm above the base.
	•	Free tip X reach (20° from horizontal): 35 + 30*cos(20°) ≈ 63.2 mm (well within the 120 mm base).

tweaks 

	•	Hinge overlap increased: plate‑to‑riser overlap in +X increased from 0.3 mm → 1.5 mm so the connection is visually and physically substantial in slicers.
	•	Rationale: the plate’s local thickness (1.4 mm) rotated up to φ=60° gives an effective x‑offset of sin(60°)×1.4 ≈ 1.21 mm. With 1.5 mm overlap, the entire plate thickness is embedded in the riser at the hinge for all angles (30–70° from vertical), ensuring a clear union.
	•	Tip clearance preserved: pivot height recomputed so the worst case (φ=60° from horizontal) bottom surface at the free tip sits ~1.0 mm above the base.


## Stringing Towers

## Thin-Wall Flow Patch

## Dimensional Cube V2