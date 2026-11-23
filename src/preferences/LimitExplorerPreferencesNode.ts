/**
 * LimitExplorerPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Add controls here
 * when the sim gains sim-specific preferences. The empty shell still wraps content
 * in LimitExplorerPanel so the shared panel toolkit stays reachable.
 */
import { VBox } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import { LimitExplorerPanel } from "../common/LimitExplorerPanel.js";
import LimitExplorerNamespace from "../LimitExplorerNamespace.js";
import type { LimitExplorerPreferencesModel } from "./LimitExplorerPreferencesModel.js";

export class LimitExplorerPreferencesNode extends VBox {
  public constructor(_preferencesModel: LimitExplorerPreferencesModel, _tandem?: Tandem) {
    // Pattern for a preference control (skill: scenerystack-preferences). The dialog is
    // always white, so use the controlSurface colors, not textColorProperty.
    //
    //   const prefStrings = StringManager.getInstance().getPreferences();
    //   const showGridCheckbox = new Checkbox(
    //     preferencesModel.showGridProperty,
    //     new Text(prefStrings.showGridStringProperty, {
    //       font: new PhetFont(14),
    //       fill: LimitExplorerColors.controlSurfaceTextColorProperty,
    //     }),
    //     {
    //       // Shared slider / NumberControl / checkbox bundles live in LimitExplorerControlOptions.ts:
    //       // copy the template's src/common/*ControlOptions.ts and apply the LimitExplorer prefix.
    //       checkboxColor: LimitExplorerColors.controlSurfaceTextColorProperty,
    //       checkboxColorBackground: LimitExplorerColors.controlSurfaceColorProperty,
    //       ...(tandem && { tandem: tandem.createTandem("showGridCheckbox") }),
    //     },
    //   );
    //
    // Add showGridCheckbox to the content children below.
    const content = new VBox({
      align: "left",
      spacing: 12,
      children: [],
    });
    // Transparent / borderless so the Preferences dialog stays visually empty.
    const panel = new LimitExplorerPanel(content, {
      fill: "transparent",
      stroke: null,
      xMargin: 0,
      yMargin: 0,
    });
    super({
      align: "left",
      spacing: 12,
      children: [panel],
    });
  }
}

LimitExplorerNamespace.register("LimitExplorerPreferencesNode", LimitExplorerPreferencesNode);
