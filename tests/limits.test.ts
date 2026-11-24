import { describe, expect, it } from "vitest";
import {
  counterexample,
  entryFor,
  evaluate,
  examples,
  LimitExplorerModel,
  largestDelta,
  limitOf,
} from "../src/common/model/LimitExplorerModel.js";

describe("function library", () => {
  it("matches each entry's one-sided limits numerically", () => {
    for (const example of examples) {
      const entry = entryFor(example);
      if (entry.kind === "oscillates") {
        continue;
      }
      for (const [side, limit] of [
        [-1, entry.left],
        [1, entry.right],
      ] as const) {
        const near = entry.f(entry.a + side * 1e-7) ?? Number.NaN;
        if (Number.isFinite(limit)) {
          expect(near).toBeCloseTo(limit, 5);
        } else {
          expect(Math.sign(near)).toBe(Math.sign(limit));
          expect(Math.abs(near)).toBeGreaterThan(1e6);
        }
      }
    }
  });

  it("knows which limits exist", () => {
    expect(limitOf(entryFor("removable"))).toBe(2);
    expect(evaluate("removable", 1)).toBeNull();
    expect(limitOf(entryFor("squeeze"))).toBe(0);
    expect(limitOf(entryFor("jump"))).toBeNull();
    expect(entryFor("inverseSquare").kind).toBe("plusInfinity");
    expect(entryFor("custom", { left: 1, right: 1, point: -2 }).kind).toBe("finite");
  });
});

describe("epsilon–delta verification", () => {
  it("excludes both a and the endpoints of the input band", () => {
    // f(x) = x² near 1 with L = 1: |x² − 1| < ε needs x < √(1 + ε) on the right.
    const epsilon = 0.5;
    const edge = Math.sqrt(1 + epsilon) - 1;
    expect(counterexample("continuous", 1, epsilon, edge)).toBeNull();
    const x = counterexample("continuous", 1, epsilon, edge + 0.01) ?? 0;
    expect(Math.abs(x - 1)).toBeLessThan(edge + 0.01);
    expect(Math.abs(x * x - 1)).toBeGreaterThan(epsilon);
    // The hole at 1 is never a witness, whatever L is.
    expect(counterexample("removable", 2, 0.3, 0.29)).toBeNull();
  });

  it("rejects the attained extrema of sin(1/x) and a jump for narrow bands", () => {
    for (const target of [-1, 0, 1]) {
      const delta = 0.001;
      const x = counterexample("oscillation", target, 1, delta) ?? 0;
      expect(Math.abs(x)).toBeLessThan(delta);
      expect(Math.abs(x)).toBeGreaterThan(0);
      expect(Math.abs((evaluate("oscillation", x) ?? 0) - target)).toBeGreaterThanOrEqual(1);
    }
    expect(counterexample("oscillation", 0, 1.05, 0.001)).toBeNull();
    // ⌊x⌋ near 1: 0 on the left and 1 on the right, so L = 0.5 fails for ε < 0.5.
    expect(counterexample("jump", 0.5, 0.4, 0.001)).not.toBeNull();
    expect(counterexample("jump", 0.5, 0.6, 0.001)).toBeNull();
  });

  it("squeezes x sin(1/x) inside |x|", () => {
    expect(counterexample("squeeze", 0, 0.1, 0.09)).toBeNull();
    expect(counterexample("squeeze", 0, 0.1, 0.5)).not.toBeNull();
  });

  it("finds witnesses for a custom function exactly when the bands are too narrow", () => {
    const meeting = { left: 1, right: 1, point: -2 };
    // Matching one-sided limits: f(0) is irrelevant, and a small δ always works.
    expect(counterexample("custom", 1, 0.5, 0.4, meeting)).toBeNull();
    const wide = counterexample("custom", 1, 0.5, 0.6, meeting) ?? 0;
    expect(Math.abs(wide)).toBeLessThan(0.6);
    expect(Math.abs((evaluate("custom", wide, meeting) ?? 0) - 1)).toBeGreaterThan(0.5);

    const jump = { left: -0.5, right: 1, point: 0.5 };
    for (const target of [-0.5, 0.25, 1]) {
      for (const delta of [0.5, 0.01, 0.0001]) {
        const x = counterexample("custom", target, 0.7, delta, jump);
        expect(x).not.toBeNull();
        expect(x).not.toBe(0);
        expect(Math.abs(x ?? 1)).toBeLessThan(delta);
        expect(Math.abs((evaluate("custom", x ?? 0, jump) ?? 0) - target)).toBeGreaterThan(0.7);
      }
    }
    expect(counterexample("custom", 0.25, 0.8, 0.04, jump)).toBeNull();
  });

  it("snaps and bounds the custom function's parts", () => {
    const model = new LimitExplorerModel("approach");
    model.shape("left", 0.437);
    model.shape("point", 9);
    expect(model.piece.value).toEqual({ left: 0.45, right: 1, point: 2 });
    model.dispose();
  });

  it("knows the largest δ and judges the challenge", () => {
    // |x² − 1| < ε on both sides of 1: the right side binds, δ = √(1 + ε) − 1.
    expect(largestDelta("continuous", 1, 0.6)).toBeCloseTo(Math.sqrt(1.6) - 1, 6);
    // Matching branches with slope 1: |x| < ε.
    expect(largestDelta("custom", 0.5, 0.4, { left: 0.5, right: 0.5, point: 2 })).toBeCloseTo(0.4, 6);
    const model = new LimitExplorerModel("epsilon-delta");
    for (let i = 0; i < 20; i++) {
      model.newChallenge();
      expect(model.challenge.value).toBe(model.epsilon.value);
      expect(model.target.value).toBe(limitOf(model.entry));
      const best = largestDelta(model.example.value, model.target.value, model.epsilon.value, model.piece.value);
      expect(best).toBeLessThan(0.99);
      model.delta.value = Math.round(best * 1000) / 1000 + 0.01;
      model.checkChallenge();
      expect(model.verdict.value).toBe("tooWide");
      model.delta.value = Math.floor(best * 1000) / 1000;
      model.checkChallenge();
      expect(model.verdict.value).toBe("correct");
      model.delta.value = Math.floor(best * 500) / 1000;
      model.checkChallenge();
      expect(model.verdict.value).toBe("tooSmall");
    }
    model.epsilon.value = 1.5;
    expect(model.challenge.value).toBeNull();
    model.dispose();
  });
});

describe("prediction", () => {
  it("judges the predicted kind of limit and resets on a new function", () => {
    const model = new LimitExplorerModel("approach");
    model.example.value = "reciprocal";
    model.prediction.value = "plusInfinity";
    model.checkPrediction();
    expect(model.predictionVerdict.value).toBe("wrong");
    model.prediction.value = "sidesDiffer";
    expect(model.predictionVerdict.value).toBeNull();
    model.checkPrediction();
    expect(model.predictionVerdict.value).toBe("right");
    model.example.value = "squeeze";
    expect(model.prediction.value).toBeNull();
    expect(model.predictionVerdict.value).toBeNull();
    model.dispose();
  });

  it("puts the probes on both sides of a", () => {
    const model = new LimitExplorerModel("approach");
    model.example.value = "continuous";
    expect(model.leftX).toBeLessThan(1);
    expect(model.rightX).toBeGreaterThan(1);
    model.dispose();
  });
});
