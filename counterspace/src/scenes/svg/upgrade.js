// ============================================================================
// scenes/svg/upgrade.js: static mode (reduced motion, or a scene opened without WebGL) fetches the Blue Marble once and redraws the diagram with it
// ============================================================================
import { earthImg, loadEarth } from '../earth.js';

let earthUpgrade = false,
  pendingStatic = null;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fetch the imagery, then redraw the diagram that asked last (if it is still in the document).
const fetchAndRedraw = (rerender) =>
  loadEarth(2048).then((ok) => {
    earthUpgrade = false;
    const q = pendingStatic;
    if (ok && q && q.node.isConnected) {
      pendingStatic = null;
      rerender(q.sim, q.el, q.t);
    }
  });

// The multi-panel diagram: upgrade in the scene dialog or under reduced motion.
export function upgradePanelsEarth(job, rerender) {
  if (earthImg) return;
  if (job.el.id === 'sceneView' || reducedMotion()) {
    pendingStatic = job;
    if (!earthUpgrade) {
      earthUpgrade = true;
      fetchAndRedraw(rerender);
    }
  }
}

// A single diagram. The hero's placeholder diagram only upgrades under reduced motion, and after the page has loaded and gone idle (never at first paint).
export function upgradeDiagramEarth(job, rerender) {
  if (earthImg) return;
  const { sim, el } = job;
  if (el.id === 'sceneView' || (reducedMotion() && sim.cfg.spin)) {
    pendingStatic = job;
    if (!earthUpgrade) {
      earthUpgrade = true;
      const go = () => fetchAndRedraw(rerender);
      if (sim.cfg.spin && document.readyState !== 'complete') addEventListener('load', () => (window.requestIdleCallback || setTimeout)(go), { once: true });
      else if (sim.cfg.spin) (window.requestIdleCallback || setTimeout)(go);
      else go();
    }
  }
}
