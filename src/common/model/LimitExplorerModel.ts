import { NumberProperty, Property } from "scenerystack/axon";
import { dotRandom, roundSymmetric } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const examples = [
  "continuous",
  "removable",
  "sinc",
  "jump",
  "reciprocal",
  "inverseSquare",
  "oscillation",
  "squeeze",
  "custom",
] as const;
export type Example = (typeof examples)[number];
/** The examples whose limit is finite or fails at a finite level, so an ε-band makes sense. */
export const epsilonDeltaExamples: readonly Example[] = [
  "continuous",
  "removable",
  "sinc",
  "jump",
  "oscillation",
  "squeeze",
  "custom",
];

/** What the limit at a turns out to be; the student predicts one of these. */
export const limitKinds = ["finite", "plusInfinity", "minusInfinity", "sidesDiffer", "oscillates"] as const;
export type LimitKind = (typeof limitKinds)[number];

/**
 * The student's own function, around a = 0: f(x) = left + x for x < 0, right + x for x > 0,
 * and f(0) = point. The branches' heights at 0 are the one-sided limits.
 */
export type Piece = { readonly left: number; readonly right: number; readonly point: number };
const defaultPiece: Piece = { left: -0.5, right: 1, point: 0.5 };
export const pieceRange = 2;

/**
 * One function and the point a where its limit is studied. `f` returns null where f is
 * undefined (including at a, when it has no value there). `left` and `right` are the
 * one-sided limits (±Infinity for unbounded, NaN when there is none). `envelope`, for an
 * oscillating function, gives the swing about the limit at distance h, so the view can shade
 * oscillations too fast to draw.
 */
export type LimitEntry = {
  readonly id: Example;
  readonly label: string;
  readonly a: number;
  readonly f: (x: number) => number | null;
  readonly left: number;
  readonly right: number;
  readonly kind: LimitKind;
  readonly envelope?: (h: number) => number;
};

const library: Readonly<Record<Exclude<Example, "custom">, LimitEntry>> = {
  continuous: {
    id: "continuous",
    label: "f(x) = x<sup>2</sup>,   a = 1",
    a: 1,
    f: (x) => x * x,
    left: 1,
    right: 1,
    kind: "finite",
  },
  removable: {
    id: "removable",
    label: "f(x) = (x<sup>2</sup> − 1) / (x − 1),   a = 1",
    a: 1,
    f: (x) => (x === 1 ? null : (x * x - 1) / (x - 1)),
    left: 2,
    right: 2,
    kind: "finite",
  },
  sinc: {
    id: "sinc",
    label: "f(x) = sin x / x,   a = 0",
    a: 0,
    f: (x) => (x === 0 ? null : Math.sin(x) / x),
    left: 1,
    right: 1,
    kind: "finite",
  },
  jump: {
    id: "jump",
    label: "f(x) = ⌊x⌋ (floor),   a = 1",
    a: 1,
    f: Math.floor,
    left: 0,
    right: 1,
    kind: "sidesDiffer",
  },
  reciprocal: {
    id: "reciprocal",
    label: "f(x) = 1/x,   a = 0",
    a: 0,
    f: (x) => (x === 0 ? null : 1 / x),
    left: Number.NEGATIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    kind: "sidesDiffer",
  },
  inverseSquare: {
    id: "inverseSquare",
    label: "f(x) = 1/x<sup>2</sup>,   a = 0",
    a: 0,
    f: (x) => (x === 0 ? null : 1 / (x * x)),
    left: Number.POSITIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    kind: "plusInfinity",
  },
  oscillation: {
    id: "oscillation",
    label: "f(x) = sin(1/x),   a = 0",
    a: 0,
    f: (x) => (x === 0 ? null : Math.sin(1 / x)),
    left: Number.NaN,
    right: Number.NaN,
    kind: "oscillates",
    envelope: () => 1,
  },
  squeeze: {
    id: "squeeze",
    label: "f(x) = x sin(1/x),   a = 0",
    a: 0,
    f: (x) => (x === 0 ? null : x * Math.sin(1 / x)),
    left: 0,
    right: 0,
    kind: "finite",
    envelope: Math.abs,
  },
};

/** The entry for an example; the custom one is rebuilt from the student's piece. */
export function entryFor(example: Example, piece: Piece = defaultPiece): LimitEntry {
  if (example !== "custom") {
    return library[example];
  }
  return {
    id: "custom",
    label: "",
    a: 0,
    f: (x) => (x === 0 ? piece.point : (x < 0 ? piece.left : piece.right) + x),
    left: piece.left,
    right: piece.right,
    kind: piece.left === piece.right ? "finite" : "sidesDiffer",
  };
}

/** f at x for an example, or null where it is undefined. */
export function evaluate(example: Example, x: number, piece = defaultPiece): number | null {
  return entryFor(example, piece).f(x);
}

/** The limit at a when it exists and is finite, otherwise null. */
export function limitOf(entry: LimitEntry): number | null {
  return entry.kind === "finite" ? entry.left : null;
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

/** sin(1/x) reaches ±1 at points as close to 0 as we like: return one inside the band on the far side from L. */
function oscillationCounterexample(limit: number, epsilon: number, delta: number): number | null {
  const extreme = limit > 0 ? -1 : 1;
  if (Math.abs(extreme - limit) < epsilon) {
    return null;
  }
  const turns = Math.ceil(1 / (2 * Math.PI * delta));
  return extreme / (Math.PI / 2 + turns * 2 * Math.PI);
}

// Distances from a sampled on each side: evenly across (0, δ), geometrically toward 0,
// and just inside δ, where a monotone deviation is largest.
const LINEAR_SAMPLES = 400;
const GEOMETRIC_SAMPLES = 160;
const INSIDE = 1 - 1e-9;

/**
 * An x with 0 < |x − a| < δ and |f(x) − L| > ε, or null when none is found. Exact for
 * sin(1/x) and the student's piecewise-linear function; otherwise found by sampling, which
 * favors the visible witness farthest from a.
 */
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
  if (example === "oscillation") {
    return oscillationCounterexample(limit, epsilon, delta);
  }
  const { a, f } = entryFor(example, piece);
  const distances = [
    delta * INSIDE,
    ...Array.from({ length: LINEAR_SAMPLES - 1 }, (_, i) => (delta * (LINEAR_SAMPLES - 1 - i)) / LINEAR_SAMPLES),
    ...Array.from({ length: GEOMETRIC_SAMPLES }, (_, i) => delta * 10 ** (-(i + 1) / 20)),
  ];
  const tolerance = 1e-12 * Math.max(1, epsilon, Math.abs(limit));
  for (const h of distances) {
    for (const side of [-1, 1]) {
      const x = a + side * h;
      const y = f(x);
      if (y !== null && Math.abs(y - limit) - epsilon > tolerance) {
        return x;
      }
    }
  }
  return null;
}

export type Verdict = "correct" | "tooWide" | "tooSmall";
export type PredictionVerdict = "right" | "wrong";
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
  public readonly example: Property<Example>;
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
  /** The student's prediction of what kind of limit this is, and whether it was right. */
  public readonly prediction = new Property<LimitKind | null>(null);
  public readonly predictionVerdict = new Property<PredictionVerdict | null>(null);
  private settingUp = false;

  public readonly mode: "approach" | "epsilon-delta";

  public constructor(mode: "approach" | "epsilon-delta") {
    this.mode = mode;
    this.example = new Property<Example>(mode === "approach" ? "removable" : "continuous");
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
    // A new function or a new guess needs a new check.
    for (const property of [this.example, this.piece, this.prediction] as const) {
      property.lazyLink(() => {
        this.predictionVerdict.value = null;
      });
    }
    this.example.lazyLink(() => {
      this.prediction.value = null;
    });
  }

  /** The current function and its point a. */
  public get entry(): LimitEntry {
    return entryFor(this.example.value, this.piece.value);
  }

  /**
   * A function whose limit at a exists, L set to that limit, and a random ε.
   * The student looks for the largest δ that keeps every nearby output inside the ε-band.
   */
  public newChallenge(): void {
    this.settingUp = true;
    let best: number;
    do {
      const example = dotRandom.sample(["continuous", "removable", "sinc", "squeeze", "custom"] as const);
      this.example.value = example;
      if (example === "custom") {
        const level = dotRandom.sample([-1, -0.5, 0, 0.5, 1]);
        this.piece.value = { left: level, right: level, point: dotRandom.sample([-1.5, 1.5]) };
      }
      this.target.value = limitOf(this.entry) ?? 0;
      this.epsilon.value = dotRandom.sample([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8]);
      best = largestDelta(this.example.value, this.target.value, this.epsilon.value, this.piece.value);
      // Keep the answer below 1, the end of the δ slider.
    } while (best > 0.98);
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

  /** Judges the prediction against the kind of limit the function has at a. */
  public checkPrediction(): void {
    if (this.prediction.value !== null) {
      this.predictionVerdict.value = this.prediction.value === this.entry.kind ? "right" : "wrong";
    }
  }

  public get span(): number {
    return 10 ** -this.zoom.value;
  }
  public get leftX(): number {
    return this.entry.a - this.left.value * this.span;
  }
  public get rightX(): number {
    return this.entry.a + this.right.value * this.span;
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
    this.prediction.reset();
    this.predictionVerdict.reset();
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
    this.prediction.dispose();
    this.predictionVerdict.dispose();
  }
}
