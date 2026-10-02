// ============================================================================
// fonts.js: the page's font stacks (kept in step with --sans / --serif / --mono in template.html) and the font-loading gate.
// Provides: SANS, SERIF, MONO (canvas / SVG font-family strings), fontsReady (resolves when every embedded face is loaded).
// The faces are embedded as base64 @font-face rules (tools/build_page.py, fonts/*.woff2). Anything that measures text (tw(), label
// placement, canvas stills, the static SVG diagrams) must run after fontsReady, or it is laid out with fallback-font metrics.
// ============================================================================
export const SANS = '"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
export const SERIF = 'Newsreader,"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
export const MONO = '"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
// Every @font-face is a data: URI, so loading is a local decode. Start all of them now rather than when text first needs them.
export const fontsReady = document.fonts
  ? Promise.all([...document.fonts].map((f) => f.load().catch(() => null))).then(() => document.fonts.ready)
  : Promise.resolve();
