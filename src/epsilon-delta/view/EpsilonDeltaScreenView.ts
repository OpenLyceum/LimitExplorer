import { LimitExplorerView } from "../../common/LimitExplorerView.js";
import type { EpsilonDeltaModel } from "../model/EpsilonDeltaModel.js";

export class EpsilonDeltaScreenView extends LimitExplorerView {
  public constructor(model: EpsilonDeltaModel) {
    super(model);
  }
}
