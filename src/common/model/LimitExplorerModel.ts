import { NumberProperty, Property } from "scenerystack/axon";
import { dotRandom, roundSymmetric } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const examples = ["continuous", "removable", "jump", "oscillation", "custom"] as const;
type Example = (typeof examples)[number];

/**
 * The student's own function: f(x) = left + x for x < 0, right + x for x > 0,
 * and f(0) = point. The branches' heights at 0 are the one-sided limits.
 */
export type Piece = { readonly left: number; readonly right: number; readonly point: number };
const defaultPiece: Piece = { left: -0.5, right: 1, point: 0.5 };
export const pieceRange = 2;

export function evaluate(example: Example, x: number, piece = defaultPiece): number | null {
  if (example === "custom") {
    return x === 0 ? piece.point : (x < 0 ? piece.left : piece.right) + x;
  }
  if (example === "jump") {
    return x < 0 ? -1 : 1;
  }
  if (example === "oscillation") {
    return x === 0 ? null : Math.sin(1 / x);
  }
  return example === "removable" && x === 0 ? 1 : 2 * x;
}

/**
 * For the custom function, each branch is linear, so |f(x) − L| on the open
 * side interval is largest at one end. A witness exists when that end value
 * exceeds ε; return a point between that end and where |f − L| falls to ε.
 */
function customCounterexample(piece: Piece, limit: number, epsilon: number, delta: number): number | null {
  for (const side of [-1, 1]) {
    const base = (side < 0 ? piece.left : piece.right) - limit;
    const g0 = base;
    const g1 = base + side * delta;
    const [extreme, end] = Math.abs(g1) >= Math.abs(g0) ? [g1, 1] : [g0, 0];
    const roundoff = 2 * Number.EPSILON * Math.max(Math.abs(extreme), epsilon, 1);
    if (Math.abs(extreme) - epsilon <= roundoff) {
      continue;
    }
    // g(t) = g0 + (g1 − g0) t on t ∈ (0, 1); find where it crosses ±ε toward the extreme.
    const crossing = g1 === g0 ? 1 - end : (Math.sign(extreme) * epsilon - g0) / (g1 - g0);
    const t = (end + Math.max(0, Math.min(1, crossing))) / 2;
    return side * delta * t;
  }
  return null;
}

/** Returns a witness strictly inside the punctured neighborhood. */
export function counterexample(
  example: Example,
  limit: number,
  epsilon: number,
  delta: number,
  piece = defaultPiece,
): number | null {
  if (example === "custom") {
    return customCounterexample(piece, limit, epsilon, delta);
  }
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
  const supremum = Math.abs(limit) + 2 * delta;
  // Decimal slider values can differ from their displayed values by roundoff.
  const roundoff = 2 * Number.EPSILON * Math.max(supremum, epsilon);
  if (supremum - epsilon <= roundoff) {
    return null;
  }
  const direction = limit > 0 ? -1 : 1;
  const threshold = Math.max(0, (epsilon - Math.abs(limit)) / 2);
  return (direction * (threshold + delta)) / 2;
}

export type Verdict = "correct" | "tooWide" | "tooSmall";
const DELTA_STEP = 0.001;

/**
 * The largest δ in [DELTA_STEP, 1] for which no input in the punctured band
 * leaves the ε-band, by bisection: if a δ works, every smaller δ does too.
 */
/** @internal Directly tested numerical helper. */
export function largestDelta(example: Example, limit: number, epsilon: number, piece = defaultPiece): number {
  const works = (delta: number) => counterexample(example, limit, epsilon, delta, piece) === null;
  if (works(1)) {
    return 1;
  }
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const middle = (low + high) / 2;
    if (works(middle)) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

export class LimitExplorerModel implements TModel {
  public readonly example = new Property<Example>("removable");
  public readonly left = new NumberProperty(0.45);
  public readonly right = new NumberProperty(0.45);
  public readonly zoom = new NumberProperty(0);
  public readonly target = new NumberProperty(0);
  public readonly epsilon = new NumberProperty(0.5);
  public readonly delta = new NumberProperty(0.4);
  public readonly piece = new Property<Piece>(defaultPiece);
  /** The ε of an active "largest δ" challenge, or null. */
  public readonly challenge = new Property<number | null>(null);
  public readonly verdict = new Property<Verdict | null>(null);
  private settingUp = false;

  public readonly mode: "approach" | "epsilon-delta";

  public constructor(mode: "approach" | "epsilon-delta") {
    this.mode = mode;
    // Changing the function, L, or ε ends a challenge; a new δ clears the verdict.
    for (const property of [this.example, this.target, this.epsilon, this.piece] as const) {
      property.lazyLink(() => {
        if (!this.settingUp) {
          this.challenge.value = null;
          this.verdict.value = null;
        }
      });
    }
    this.delta.lazyLink(() => {
      this.verdict.value = null;
    });
  }

  /**
   * A function whose limit at 0 exists, L set to that limit, and a random ε.
   * The student looks for the largest δ that keeps every nearby output inside the ε-band.
   */
  public newChallenge(): void {
    this.settingUp = true;
    const example = dotRandom.sample(["continuous", "removable", "custom"] as const);
    this.example.value = example;
    let limit = 0;
    if (example === "custom") {
      limit = dotRandom.sample([-1, -0.5, 0, 0.5, 1]);
      const point = dotRandom.sample([-1.5, 1.5]);
      this.piece.value = { left: limit, right: limit, point };
    }
    this.target.value = limit;
    // Every ε here keeps the largest δ below 1, the end of the δ slider.
    this.epsilon.value = dotRandom.sample([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]);
    this.delta.value = 1;
    this.zoom.value = 0;
    this.challenge.value = this.epsilon.value;
    this.verdict.value = null;
    this.settingUp = false;
  }

  /** Correct when δ works and is within one slider step of the largest δ that works. */
  public checkChallenge(): void {
    if (this.challenge.value === null) {
      return;
    }
    const delta = this.delta.value;
    const best = largestDelta(this.example.value, this.target.value, this.epsilon.value, this.piece.value);
    const works =
      counterexample(this.example.value, this.target.value, this.epsilon.value, delta, this.piece.value) === null;
    this.verdict.value = !works ? "tooWide" : delta >= best - DELTA_STEP - 1e-9 ? "correct" : "tooSmall";
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

  /** Sets one part of the custom function, snapped to 0.05 and kept on the graph. */
  public shape(part: keyof Piece, value: number): void {
    const snapped = Math.max(-pieceRange, Math.min(pieceRange, roundSymmetric(value * 20) / 20));
    if (snapped !== this.piece.value[part]) {
      this.piece.value = { ...this.piece.value, [part]: snapped };
    }
  }

  public reset(): void {
    for (const property of [this.example, this.left, this.right, this.zoom, this.target, this.epsilon, this.delta]) {
      property.reset();
    }
    this.piece.reset();
    this.challenge.reset();
    this.verdict.reset();
  }

  public dispose(): void {
    this.example.dispose();
    this.left.dispose();
    this.right.dispose();
    this.zoom.dispose();
    this.target.dispose();
    this.epsilon.dispose();
    this.delta.dispose();
    this.piece.dispose();
    this.challenge.dispose();
    this.verdict.dispose();
  }
}
