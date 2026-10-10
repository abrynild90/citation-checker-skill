# Counterspace design review — October 2026

Follow-up editorial review: **95/100 overall**, with every surface **95–96/100**. Prior review: 92/100 overall. Scores are design judgments, not external certification. Desktop 1440 × 1000; phone 390 × 844.

Rubric: hierarchy/clarity 30; usability/navigation 30; responsive readability/accessibility risks 25; observed behavior 15. Surface scores average desktop and phone, rounded to the nearest whole point; the overall averages unrounded viewport scores.

| Surface | Prior review | Desktop | Phone | Current |
| --- | ---: | ---: | ---: | ---: |
| Opening / hero | 91 | 96 | 95 | 96 |
| Scene gallery | 93 | 96 | 95 | 96 |
| Law and policy timeline | 91 | 95 | 95 | 95 |
| Altitude and debris | 91 | 95 | 95 | 95 |
| What the pattern shows | 92 | 95 | 95 | 95 |
| Quiz | 93 | 96 | 95 | 96 |
| Explore navigation | 91 | 95 | 95 | 95 |
| Jamming, lasers and cyber | 90 | 95 | 95 | 95 |
| Close approaches | 92 | 95 | 95 | 95 |
| State capabilities | 93 | 96 | 95 | 96 |
| Legal response lag | 91 | 95 | 95 | 95 |
| Sources and method | 92 | 95 | 95 | 95 |
| Footer / credits | 90 | 95 | 95 | 95 |
| Starfish Prime | 92 | 95 | 95 | 95 |
| Fengyun-1C | 91 | 95 | 95 | 95 |
| Cosmos 1408 | 91 | 95 | 95 | 95 |
| Viasat cyberattack | 93 | 96 | 95 | 96 |
| SJ-21 satellite towing | 92 | 96 | 95 | 96 |
| MIRACL laser | 93 | 96 | 95 | 96 |
| Burnt Frost | 92 | 95 | 95 | 95 |
| Mission Shakti | 91 | 95 | 95 | 95 |
| Solwind | 92 | 95 | 95 | 95 |
| DN-2 high-altitude launch | 91 | 95 | 95 | 95 |
| Baltic GNSS jamming | 92 | 96 | 95 | 96 |
| Close-approach 3D episodes | 91 | 95 | 95 | 95 |
| Reusable spaceplanes | 91 | 95 | 95 | 95 |

## Improvements

Searchable HTML record readers complement the altitude, non-destructive, proximity and lag charts. They preserve sources, qualifications and links to scenes. Target names are searchable. Empty results disable the chooser and provide feedback. The state reader counts thirteen distinct states, normalizes Russia’s aliases and reuses the chart’s uncertainty classification, including development inferred where SWF’s matrix has no data.

Opening links and persistent phone chapter navigation improve wayfinding. Phone source and footer text is larger. Direct source/citation links reduce the steps into the reference material.

Scene phase selection pauses playback. Full accounts also pause and allocate more phone room to text. Compact phone scenes replace the clipped step strip with a chooser; static diagrams open the full account when a step is selected.

## Verification

Offline smoke and behavioral regressions passed at 375, 900, 1024 and 1440 px. The final phone state-reader ordering check passed. Search, empty states, source access, state normalization, navigation focus, paused phase selection and full-account expansion were exercised. All thirteen expanded accounts passed in both viewports: 26 states with no observed runtime errors or axe violations. All thirteen compact scenes were visually reviewed in both viewports.

## Limits

Dense diagrams and long references still benefit from record readers, zoom and data tables. Scene geometry is illustrative. The audit does not independently validate historical/legal claims, certify full accessibility, or exhaustively test every physical device, assistive technology and camera/time combination.
