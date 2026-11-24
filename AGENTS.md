# AGENTS.md — Limit Explorer

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Limit Explorer (`limit-explorer`) teaches limits at a point.

- **Approach:** pick a function from the list. Each comes with its own point a. Move the probes toward a from both sides, with the handles (they take arrow keys) or by dragging on the graph. Zoom rescales both axes around a. A table lists f(a ± 10⁻ᵏ). The student predicts the kind of limit (a number, +∞, −∞, sides differ, oscillates) with one button press, and the feedback names the discontinuity.
- **Epsilon–Delta:** set L, ε and δ with sliders or by dragging the band handles, and see a counterexample whenever one exists. The "largest δ" challenge picks a function whose limit exists.

The functions are x² at 1; (x² − 1)/(x − 1) at 1 (a hole); sin x / x at 0; ⌊x⌋ at 1 (jump); 1/x and 1/x² at 0 (infinite); sin(1/x) at 0 (oscillation); x sin(1/x) at 0 (squeeze); and a piecewise-linear function the student shapes at 0.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/LimitExplorerModel.ts` | `LimitEntry` library (f, a, one-sided limits, kind, oscillation envelope), `counterexample`, `largestDelta`, prediction and challenge |
| `src/common/LimitExplorerView.ts` | Both screens: combo box, table of values, prediction buttons, band handles, curve drawing with breaks at jumps and poles, shading for unresolved oscillation |
| `src/common/LessonView.ts` | Canonical Calculus I scaffold, kept identical with Riemann Sum Builder, Mean Value Theorem and Related Rates apart from the sim prefix. Edit it in one sim and copy it to the others. |
| `tests/limits.test.ts` | One-sided limits against the library, counterexamples, largest δ, challenge, prediction |
| `tests/browser/keyboard-drag.spec.ts` | Keyboard probes, prediction feedback in the description, ε–δ sliders |

## Counterexamples

sin(1/x) and the student's function have exact witnesses. Every other function is sampled on each side of a: evenly over (0, δ), geometrically toward a, and just inside δ. The search returns the witness farthest from a, so it stays visible. `largestDelta` bisects on whether a witness exists, so the challenge and the check always agree.

## Compliance carve-outs

- `memory-leak:PlotHandle` — file-private drag handle inside the plot/lesson view; not exported for `describeDisposalLeaks`.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
