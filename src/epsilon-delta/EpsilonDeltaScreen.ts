/**
 * EpsilonDeltaScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createEpsilonDeltaIcon() in src/common/LimitExplorerScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createEpsilonDeltaIcon } from "../common/LimitExplorerScreenIcons.js";
import LimitExplorerColors from "../LimitExplorerColors.js";
import { EpsilonDeltaModel } from "./model/EpsilonDeltaModel.js";
import { EpsilonDeltaKeyboardHelpContent } from "./view/EpsilonDeltaKeyboardHelpContent.js";
import { EpsilonDeltaScreenView } from "./view/EpsilonDeltaScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type EpsilonDeltaScreenOptions = ScreenOptions & { tandem: Tandem };

export class EpsilonDeltaScreen extends Screen<EpsilonDeltaModel, EpsilonDeltaScreenView> {
  public constructor(options: EpsilonDeltaScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new EpsilonDeltaModel(),
      // View factory — receives the model instance
      (model) => new EpsilonDeltaScreenView(model),
      optionize<EpsilonDeltaScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: LimitExplorerColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new EpsilonDeltaKeyboardHelpContent(),
          homeScreenIcon: createEpsilonDeltaIcon(),
          navigationBarIcon: createEpsilonDeltaIcon(),
        },
        options,
      ),
    );
  }
}
