import { describe, expect, it } from "vitest";
import { counterexample, evaluate } from "../src/common/model/LimitExplorerModel.js";

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
});
