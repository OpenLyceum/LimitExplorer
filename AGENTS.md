# AGENTS.md — Limit Explorer

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Limit Explorer (`limit-explorer`) is a SceneryStack simulation scaffolded from SceneryStackTemplate.

## Key files

| File | Purpose |
|---|---|
| `src/LimitExplorerColors.ts` | All `ProfileColorProperty` instances |
| `src/LimitExplorerConstants.ts` | Named numeric constants |
| `src/LimitExplorerNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/common/LimitExplorerPanel.ts` | Pre-themed `Panel` wrapper |
| `src/common/LimitExplorerButtonOptions.ts` | Flat button / combo-box option bundles |
| `src/approach/ApproachScreen.ts` | Screen wrapper |
| `src/approach/model/ApproachModel.ts` | Simulation state and logic |
| `src/approach/view/ApproachScreenView.ts` | Visual nodes, layout, a11y wiring |
| `src/epsilon-delta/EpsilonDeltaScreen.ts` | Screen wrapper |
| `src/epsilon-delta/model/EpsilonDeltaModel.ts` | Simulation state and logic |
| `src/epsilon-delta/view/EpsilonDeltaScreenView.ts` | Visual nodes, layout, a11y wiring |

## Compliance carve-outs

- `memory-leak:PlotHandle` — file-private drag handle inside the plot/lesson view; not exported for `describeDisposalLeaks`.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
