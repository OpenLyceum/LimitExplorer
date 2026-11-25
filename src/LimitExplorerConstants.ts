/**
 * LimitExplorerConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Model / math values note their unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in LimitExplorerColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * LAYOUT matches the other Calculus I sims (Mean Value Theorem, Riemann Sum
 * Builder, Related Rates) — keep those copies in sync.
 */

import LimitExplorerNamespace from "./LimitExplorerNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/**
 * Corner radius shared by control panels and dialogs.
 * @public
 */
export const PANEL_CORNER_RADIUS = 6;

/**
 * Shared lesson scaffold: plot left, panel right, notes under the plot.
 * Keys stay camelCase to match LessonView usage across the Calculus I fleet.
 */
export const LAYOUT = {
  inset: 32,
  gap: 24,
  plotWidth: 610,
  plotHeight: 360,
  panelWidth: 320,
  panelHeight: 430,
  top: 107,
  notesGap: 14,
};

// ── Model / numerics ──────────────────────────────────────────────────────────

/** Even samples of (0, δ) when searching for an ε–δ counterexample. */
export const LINEAR_SAMPLES = 400;

/** Geometric samples toward 0 when searching for an ε–δ counterexample. */
export const GEOMETRIC_SAMPLES = 160;

LimitExplorerNamespace.register("LimitExplorerConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  LAYOUT,
  LINEAR_SAMPLES,
  GEOMETRIC_SAMPLES,
});
