# Counterspace: six scene improvements

Reviewed against main `4a345672ca0af6c246592420278c8b5bc1cadd7b` with Impeccable's polish and craft-floor guidance. Scope is the first six recommendations, covering eight scenes. The capabilities chart is outside this change.

## Changes

1. **Cosmos 1408:** a schematic relates the historical cloud to ISS orbital height and separately reports five tracked fragments remaining in February 2026. The historical cloud fades before the dated source card appears; no positions are invented for the five survivors.
2. **Baltic GPS interference:** a receiver diagram distinguishes the satellite's continuing signal from radio noise at a receiver. The map's jammer zone is explicitly illustrative.
3. **Spaceplanes:** OTV-7's default episode view fits Earth and the complete orbit, with lowest/highest labels. A separate following view remains available. Each of the three episodes has a selectable still diagram.
4. **DN-2:** the comparison distinguishes China's stated 10,000 km from the SWF-cited estimate of at least 30,000 km. The rocket is smaller, the unused trajectory quieter, and the picture note identifies illustrative geometry.
5. **Close approaches:** separate stills explain the China–US, Russia–US and US–UK episodes. Their descriptions retain uncertainty and the distinction between a close approach and hostile intent. Trails are shorter and quieter.
6. **Solwind, Burnt Frost and Shakti:** consistent crisp fragments and shorter flashes accompany separate collision, spread, decay and later-count steps. Historical clouds retire before the later zero counts. A generic spacecraft symbol in the schematic is illustrative; the live Solwind model retains its documented distinctive form.

Episode and step selections interrupt animation, change the still picture and caption together, and return to the animation at the selected time while paused. Saved diagrams retain the chosen episode. Each episode has its own accessible description. The diagram save uses the same frame as live images and does not claim NASA imagery for schematic symbols. Enlarged phone text leaves more room for the scrollable account.

## Evidence and checks

- Fresh desktop (1440×900) and phone (390×844) screenshots: live scenes at 0.4, 0.7 and 0.92 of the illustrative sequence; all new stills and all selectable episodes in light and dark page themes. The viewer intentionally keeps the same dark graphic background in both themes.
- Additional layout probes at 375×800, including 3000×1875 exported diagrams. The eight scenes' static checks passed 32 states with no findings.
- Browser recordings of playback and interruption at desktop and phone widths; software rendering is not a hardware performance benchmark.
- Offline smoke, behavioral regression, motion/keyboard, accessibility, copy, contrast and touch/reflow checks. New regression coverage verifies reduced-motion episode selection and saved episode identity; new motion coverage verifies later clouds retire and seeking restores the historical Cosmos view.
- Page QA covered six viewport/theme combinations, chart exports, all scenes, keyboard focus and reduced motion. No page errors, horizontal overflow, layout-audit or accessibility findings were reported.
- The data rebuild validates 144 events, 19 legal items, five capability categories and six lag pairs. No ledger, citation or legal data was edited.
- Impeccable's manual detector reported no findings. The generated page is rebuilt and compared byte for byte with a separate build before publication.

The scene check now preserves the episode camera selected by an automatic view; resetting it to the overview camera before measuring a later time in the same episode produced false framing failures.

## Limits

Local Chromium uses software WebGL and touch/CPU emulation. Physical iPhone, Android, VoiceOver and sustained thermal performance have not been tested. Local WebKit cannot launch because system libraries are missing, and installing them is blocked by the environment; the GitHub Actions WebKit job is required before merge. Geometry, speeds, timing, hardware sizes and spacing remain illustrative as qualified in the pictures and accounts. No numerical design score is claimed for this implementation.
