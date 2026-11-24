import {
  BasicActionsKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class EpsilonDeltaKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    // The custom function's branches and point are moved with the arrow keys.
    super(
      [new MoveDraggableItemsKeyboardHelpSection(), new SliderControlsKeyboardHelpSection()],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
