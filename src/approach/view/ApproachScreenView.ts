import { LimitExplorerView } from "../../common/LimitExplorerView.js";
import type { ApproachModel } from "../model/ApproachModel.js";

export class ApproachScreenView extends LimitExplorerView {
  public constructor(model: ApproachModel) {
    super(model);
  }
}
