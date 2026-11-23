/**
 * Memory-leak regression suite (fleet standard).
 *
 * List every model/view object that links Properties, adds listeners, or owns child
 * nodes, with a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles
 * (idempotentDispose: true also checks a second dispose()). Add sim-specific leak
 * tests below using forceGC().
 */

import { ApproachModel } from "../src/approach/model/ApproachModel.js";
import { LimitExplorerModel } from "../src/common/model/LimitExplorerModel.js";
import { EpsilonDeltaModel } from "../src/epsilon-delta/model/EpsilonDeltaModel.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  { name: "LimitExplorerModel", create: () => new LimitExplorerModel("approach") },
  { name: "ApproachModel", create: () => new ApproachModel() },
  { name: "EpsilonDeltaModel", create: () => new EpsilonDeltaModel() },
]);
