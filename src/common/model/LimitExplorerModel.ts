import { NumberProperty, Property } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";

export const examples = ["continuous", "removable", "jump", "oscillation"] as const;
type Example = (typeof examples)[number];

export function evaluate(example: Example, x: number): number | null {
  if (example === "jump") {
    return x < 0 ? -1 : 1;
  }
  if (example === "oscillation") {
    return x === 0 ? null : Math.sin(1 / x);
  }
  return example === "removable" && x === 0 ? 1 : 2 * x;
}

/** Returns a witness strictly inside the punctured neighborhood. */
export function counterexample(example: Example, limit: number, epsilon: number, delta: number): number | null {
  if (example === "jump" || example === "oscillation") {
    const extreme = limit > 0 ? -1 : 1;
    if (Math.abs(extreme - limit) < epsilon) {
      return null;
    }
    if (example === "jump") {
      return (extreme * delta) / 2;
    }
    const phase = Math.PI / 2;
    const turns = Math.ceil(1 / (2 * Math.PI * delta));
    return extreme / (phase + turns * 2 * Math.PI);
  }

  // For a line, the supremum is reached only at an excluded endpoint.
  if (Math.abs(limit) + 2 * delta <= epsilon) {
    return null;
  }
  const direction = limit > 0 ? -1 : 1;
  const threshold = Math.max(0, (epsilon - Math.abs(limit)) / 2);
  return (direction * (threshold + delta)) / 2;
}

export class LimitExplorerModel implements TModel {
  public readonly example = new Property<Example>("removable");
  public readonly left = new NumberProperty(0.45);
  public readonly right = new NumberProperty(0.45);
  public readonly zoom = new NumberProperty(0);
  public readonly target = new NumberProperty(0);
  public readonly epsilon = new NumberProperty(0.5);
  public readonly delta = new NumberProperty(0.4);

  public readonly mode: "approach" | "epsilon-delta";

  public constructor(mode: "approach" | "epsilon-delta") {
    this.mode = mode;
  }

  public get span(): number {
    return 10 ** -this.zoom.value;
  }
  public get leftX(): number {
    return -this.left.value * this.span;
  }
  public get rightX(): number {
    return this.right.value * this.span;
  }

  public reset(): void {
    for (const property of [this.example, this.left, this.right, this.zoom, this.target, this.epsilon, this.delta]) {
      property.reset();
    }
  }

  public dispose(): void {
    this.example.dispose();
    this.left.dispose();
    this.right.dispose();
    this.zoom.dispose();
    this.target.dispose();
    this.epsilon.dispose();
    this.delta.dispose();
  }
}
