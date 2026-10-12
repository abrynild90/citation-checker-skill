# Counterspace graphics and motion review — 10 October 2026

Reviewed current main `eb5b12b8d2f69b978cc685c7c55ad7c7531fba8d` before implementation. Inspected 26 surfaces at 1440 × 1000 and 390 × 844 in light and dark themes, with two sampled stages of every scene, full chart screenshots and actual browser recordings. Subsequent confirmation covered the aircraft retirement boundary, camera menus, completion/replay, reduced motion and graphics-context loss. The review uses this run's evidence, not earlier design scores.

## Direction and implementation

Applied Impeccable 4.5.2's polish and animate guidance and Product Design's screenshot-first audit workflow. Impeccable was retrieved from its upstream repository; it was available for this task. No requested design skill remained unavailable.

Motion priorities: the event is the focal action; camera transitions preserve continuity only when requested; controls acknowledge the reader immediately; one shared renderer remains the performance budget. No new animation library, imagery or decorative effect was added.

- Reduced the atmosphere gain to 65% of the configured value and softened the Earth shader's rim contribution, preserving NASA imagery and existing scene-specific lighting.
- Bounded laser glare at 56 pixels instead of 92, removed rapid flare pulsing and rotation, and tied GNSS signal variation to scene time rather than the wall clock.
- Gave Fengyun debris crisp edges without a haze layer, with smaller two-to-five-and-a-half-pixel fragments. Source counts, distributions and scale warnings are unchanged.
- Replaced the close-approach key's text glyphs with SVG geometry matching the chart. Labels and symbols wrap together.
- Added a wrapping phone caption for the full selected step; refined the compact picture/story balance to keep it readable.
- View changes, camera menus, dragging, zooming, seeking, source notes and scene-list reading interrupt automatic playback. User camera transitions take 360 ms with exponential easing. Removed decorative camera drift and the duplicate camera-render loop.
- Completed scenes hold the final diagram with Replay; replay starts the event or selected episode from its beginning. The button, selected step, time and completion announcement stay synchronized. Tour timers yield to manual interaction, and stopping a tour pauses the scene.
- Paused playback stops its continuous animation-frame loop. Background tabs pause. Episode fades shortened from 650 to 280 ms, and pending fades cancel when paused or unloaded.
- A lost graphics context stops the scene and shows the source-qualified still diagram. Retry remains available.
- Fixed an existing intermittent Solwind error when heading calculation sampled an aircraft position after its retirement. A one-sided sample now uses the visible position at appearance and exit boundaries.

Historical data, citations, legal relationships, factual scene accounts, geometry qualifications and the established editorial identity were preserved.

## Surface review

“Good” is an editorial judgment supported by screenshot and behavior evidence, not a numerical performance guarantee. It means no blocking composition or interaction defect remained in the reviewed state.

| Step | Surface | Health | Evidence and finding |
|---:|---|---|---|
| 1 | Home | Good | Editorial hierarchy, timeline marks and legend remain clear. |
| 2 | Scene browser | Good | All thirteen events remain easy to find; established thumbnails and factual titles retained. |
| 3 | Law timeline | Good | Treaties, resolutions and expert manuals retain their distinct symbols and qualifications. |
| 4 | Altitude and debris | Good | Logarithmic scale, maxima and debris-size explanations remain readable in both themes. |
| 5 | Pattern | Good | The six pairs and the distinction between timing and causation remain clear. |
| 6 | Quiz | Good | Plain questions and answer controls retain visible focus and usable phone spacing. |
| 7 | Explore | Good | Four chart choices retain their clear labels and compact phone layout. |
| 8 | Jamming, lasers and cyber | Good | Attribution, uncertainty and continuing-operation marks remain distinguishable. |
| 9 | Close approaches | Good | Drawn SVG symbols match the chart; each symbol stays with its label as the key wraps. |
| 10 | Capabilities | Good | Stack proportions, decade labels and the reconstructed-versus-assessed distinction retained. |
| 11 | Time before law | Good | Durations, source relationships and gaps remain legible. |
| 12 | Sources and method | Good | Search, citations, legal qualifications, counting rules and licences retained. |
| 13 | Footer | Good | Credits and licence information remain readable. |
| 14 | Starfish Prime | Good | Quieter Earth rim; explanatory field lines retained; pause and replay are stable. |
| 15 | Solwind | Good | Carrier-aircraft retirement error fixed; spacecraft, labels and final frame remain stable. |
| 16 | MIRACL | Good | Bounded, steady glare keeps the target and beam label readable; fast pulsing removed. |
| 17 | Fengyun-1C | Good | Smaller, crisp fragments show the distribution without a soft haze; counts and illustrative warning retained. |
| 18 | Operation Burnt Frost | Good | Quieter Earth lighting preserves the contrast of ship, interceptor and falling fragments. |
| 19 | DN-2 | Good | Phone framing and the distinction between reported height and SWF analysis retained. |
| 20 | Mission Shakti | Good | Impact, fragments and source counts remain distinct against the quieter Earth. |
| 21 | Cosmos 1408 | Good | Debris and the ISS-orbit relationship remain legible; camera and captions stay synchronized. |
| 22 | SJ-21 tow | Good | Docking and higher-orbit views retain their framing and explicit illustrative-arm qualification. |
| 23 | Viasat | Good | Ground-network failure remains distinct from the functioning satellite; paused picture is time-based. |
| 24 | Baltic GPS jamming | Good | Red and green signal states remain tied to the caption; flicker is slower and follows scene time. |
| 25 | Reusable spaceplanes | Good | Episode changes use shorter fades; manual control interrupts the tour and camera movement. |
| 26 | Three close approaches | Good | Episode selection, highlighted steps and phone labels remain coordinated; intent is not implied. |

## Validation

- Build completed. Smoke and behavior regressions passed at 375, 900, 1024 and 1440 pixels, including offline operation, accessible tabs, source/data readers, chart downloads, clipping checks and 200 keyboard focus stops.
- New motion checks passed for all thirteen scenes on desktop and phone: step and view interruption, idle playback, dragging, keyboard seeking, replay, tour cancellation, hidden-tab pause and graphics-context recovery. Aircraft appearance and exit boundaries are explicitly exercised.
- Axe found zero violations in the reviewed page states and all thirteen live scene panels at both test sizes. Recovery diagrams were also checked in both themes.
- Full copy scan checked 15,957 distinct pieces of text with zero wording errors. Advisory spacecraft names and necessary simulation qualifiers remain intentionally.
- One Impeccable mechanical scan of the built implementation pass returned no primary findings. This supplements the visual review; it is not a substitute for rendered evidence.
- Fresh confirmation reviewed all thirteen phone scenes without the original runtime error. All thirteen reduced-motion diagrams were inspected on desktop and phone.
- Final source build SHA-256: `e716431cbff68857a90b80a3e61fe43200d86f88b6f06b6234c849a36e5311bc`. Final browser confirmation rendered these exact bytes, including completion feedback and graphics recovery. Git blob: `297affd2a3dbda363fa8a27ef9ee4ac66c8f1943`.
- GitHub generated the exact reviewed page: its blob equals the local `297affd2a3dbda363fa8a27ef9ee4ac66c8f1943`, and every changed source file matches the reviewed local source. Merge is gated on all final GitHub checks.

## Limits

Phone review used Chromium at phone dimensions with software WebGL. Physical iOS/Android GPU performance, Safari and hardware frame rates were not measured. Geometry, object sizes, orbital spacing, paths and animated timing retain their illustrative qualifications. No claim of scientifically reconstructed trajectories is added.

No known unresolved defect remained in the final browser confirmation. Dense datasets still reward zooming, the data readers and source links; these are part of the established explanatory design.
