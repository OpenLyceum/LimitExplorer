import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class EpsilonDeltaKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // The custom function's branches and point are moved with the arrow keys.
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection({
          headingStringProperty: StringManager.getInstance().getLessonStrings().moveGraphHandlesStringProperty,
        }),
        new SliderControlsKeyboardHelpSection(),
      ],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
