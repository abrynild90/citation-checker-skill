# Round 13 grading, slice S3 (Laser, SJ-21 tug, RPO, Spaceplanes)

Method: Playwright/SwiftShader; viewed contact sheets of live t=0.2/0.4/0.6/0.85 at 1440 and 375, every camera preset at t=0.3/0.7 (1440 only), static (reduced motion) 1440/375, live still and static still PNG. Captions checked against SWF text and match.

| Item | Score |
|---|---|
| Laser | 93 |
| SJ-21 tug | 92 |
| RPO | 91 |
| Spaceplanes | 91 |
| Visual impact | 92 |
| Graphics quality | 92 |
| Fun/engagement | 92 |

## Round 12 defects
Fixed: Laser Russia camera status now matches (pins mark Peresvet shelter sites); RPO step list no longer "1. 1 ·"; RPO static panels have Earth/craft icons; SJ-21 static pair enlarged with craft silhouettes; spaceplanes static rebuilt with craft icons, de-crowded labels, Obj. G tied to flight 3.
Not fixed: live stills still crop Earth (SJ-21 pair cut at right edge, labels ~8 px); SJ-21 static pair still straddles the GEO ring.

## Defects below 93
**SJ-21 (92)**: live still frames pair at right edge with tiny labels; static craft are flat sprites vs live 3D models; cam1 "Whole event" pair ~25 px; steps list mostly hidden behind scroll at 1440. Captions match SWF p. 03-11. Fix: reframe still on the pair inside the frame; move static pair off the ring.
**RPO (91)**: "Russia in LEO" t=0.3 has craft off-frame bottom-left; "China + US in GEO" t=0.7 and "US + UK in GEO" t=0.3 show empty frames with mismatched captions; 375 static labels overlap. Fix: presets must retarget the active episode so a craft is always in frame.
**Spaceplanes (91)**: "OTV-7: follows the craft" t=0.7 and "China: CSSHQ" t=0.3 are empty under another episode's caption; live CSSHQ model is an oversized flat gold slab; "Object J" label touches craft; still crops Earth under caption.
**Laser (93)**: minor only: MSTI-3 ~25 px in default view; static beam is a stub with a flat leader.
**Visual/graphics/fun (92)**: strong Blue Marble and beams; weaknesses are empty camera frames and cropped stills.

## Best single improvement
Make every camera preset track its subject across the whole timeline (no empty frames), and reframe live stills to include Earth and the subject.
