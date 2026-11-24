import { describe, expect, it } from "vitest";
import { counterexample, evaluate, LimitExplorerModel, largestDelta } from "../src/common/model/LimitExplorerModel.js";

describe("epsilon–delta verification", () => {
  it("excludes both the center and the endpoints of the input band", () => {
    expect(evaluate("removable", 0)).toBe(1);
    expect(counterexample("removable", 0, 0.5, 0.25)).toBeNull();
    const x = counterexample("removable", 0, 0.5, 0.3) ?? 0;
    expect(Math.abs(x)).toBeLessThan(0.3);
    expect(Math.abs(x)).toBeGreaterThan(0);
    expect(evaluate("removable", x)).toBeGreaterThan(0.5);
  });

  it("rejects the attained extrema at ε = 1 even for narrow bands", () => {
    for (const example of ["jump", "oscillation"] as const) {
      for (const target of [-1, 0, 1]) {
        const delta = 0.001;
        const x = counterexample(example, target, 1, delta) ?? 0;
        expect(Math.abs(x)).toBeLessThan(delta);
        expect(Math.abs(x)).toBeGreaterThan(0);
        expect(Math.abs((evaluate(example, x) ?? 0) - target)).toBeGreaterThanOrEqual(1);
      }
      expect(counterexample(example, 0, 1.05, 0.001)).toBeNull();
    }
  });

  it("accepts an exact decimal boundary despite rounding in the target slider", () => {
    const target = 34 * 0.05;
    const epsilon = 1.75;
    expect(counterexample("removable", target, epsilon, 0.025)).toBeNull();

    const delta = 0.026;
    const x = counterexample("removable", target, epsilon, delta) ?? 0;
    expect(x).toBeGreaterThan(-delta);
    expect(x).toBeLessThan(0);
    expect(Math.abs(2 * x - target)).toBeGreaterThan(epsilon);
  });

  it("uses the adverse side for an offset target", () => {
    const x = counterexample("continuous", 0.5, 0.6, 0.2) ?? 0;
    expect(x).toBeLessThan(0);
    expect(Math.abs((evaluate("continuous", x) ?? 0) - 0.5)).toBeGreaterThan(0.6);
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
    // |2x| < ε exactly when |x| < ε/2.
    expect(largestDelta("continuous", 0, 0.6)).toBeCloseTo(0.3, 6);
    // Matching branches with slope 1: |x| < ε.
    expect(largestDelta("custom", 0.5, 0.4, { left: 0.5, right: 0.5, point: 2 })).toBeCloseTo(0.4, 6);
    const model = new LimitExplorerModel("epsilon-delta");
    for (let i = 0; i < 20; i++) {
      model.newChallenge();
      expect(model.challenge.value).toBe(model.epsilon.value);
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
