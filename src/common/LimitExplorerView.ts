import { Multilink } from "scenerystack/axon";
import { roundSymmetric, toFixedNumber } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node, VBox } from "scenerystack/scenery";
import { StringManager } from "../i18n/StringManager.js";
import Colors from "../LimitExplorerColors.js";
import {
  button,
  type Choice,
  column,
  comboBox,
  computed,
  format,
  LessonView,
  niceTicks,
  richText,
  row,
  slider,
  text,
} from "./LessonView.js";
import {
  counterexample,
  type Example,
  entryFor,
  epsilonDeltaExamples,
  examples,
  type LimitExplorerModel,
  limitKinds,
  limitOf,
  type Piece,
  pieceRange,
} from "./model/LimitExplorerModel.js";

// Each arrow-key press moves a custom part by this much (Shift: a quarter).
const PIECE_KEY_STEP = 0.2;
// L slider range: wide enough for every example's limit.
const TARGET_RANGE = 3;
// Distances 10⁻¹ … 10⁻⁵ from a in the table of values.
const TABLE_POWERS = [1, 2, 3, 4, 5] as const;

/** "x + 0.5" or "x − 0.5": one branch of the student's function. */
function branch(height: number): string {
  return height === 0 ? "x" : `x ${height < 0 ? "−" : "+"} ${format(Math.abs(height))}`;
}

function customFormula(piece: Piece): string {
  return `f(x) = ${branch(piece.left)} (x &lt; 0),  f(0) = ${format(piece.point)},  ${branch(piece.right)} (x &gt; 0)`;
}

/** A function value for tables and readouts: plain when moderate, scientific when huge or tiny. */
function value(y: number | null, undefinedText: string): string {
  if (y === null || !Number.isFinite(y)) {
    return undefinedText;
  }
  return Math.abs(y) >= 1e6 || (y !== 0 && Math.abs(y) < 1e-4) ? y.toExponential(3) : format(y, 6);
}

/** Enough decimals to tell neighboring ticks `step` apart. */
function digitsFor(step: number): number {
  return Math.max(0, Math.min(8, Math.ceil(-Math.log10(step) + 1e-9)));
}

export class LimitExplorerView extends LessonView {
  public constructor(model: LimitExplorerModel) {
    const manager = StringManager.getInstance();
    const names = manager.getScreenNames();
    const strings = manager.getLessonStrings();
    const approach = model.mode === "approach";
    const summary = (approach ? manager.getApproachA11yStrings() : manager.getEpsilonDeltaA11yStrings()).screenSummary;
    const dependencies = [
      model.example,
      model.left,
      model.right,
      model.zoom,
      model.target,
      model.epsilon,
      model.delta,
      model.piece,
    ] as const;
    const f = (x: number) => model.entry.f(x);
    const undefinedText = () => strings.undefinedStringProperty.value;
    const probeDetails = (x: number) => `x = ${format(x, 6)}    f(x) = ${value(f(x), undefinedText())}`;
    const left = computed(
      [...dependencies],
      () => `${strings.leftStringProperty.value}   ${probeDetails(model.leftX)}`,
    );
    const right = computed(
      [...dependencies],
      () => `${strings.rightStringProperty.value}   ${probeDetails(model.rightX)}`,
    );
    const point = computed([...dependencies], () => {
      const { a } = model.entry;
      return `f(${format(a)}) = ${value(f(a), undefinedText())}`;
    });
    const formula = computed([model.example, model.piece], () =>
      model.example.value === "custom" ? customFormula(model.piece.value) : model.entry.label,
    );
    // The combo box already shows a library formula; only the student's own function needs a line.
    const customLine = computed([formula, model.example], () =>
      model.example.value === "custom" ? formula.value : "",
    );
    const plainFormula = () =>
      formula.value
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
    const witness = () =>
      counterexample(
        model.example.value,
        model.target.value,
        model.epsilon.value,
        model.delta.value,
        model.piece.value,
      );
    const verdict = computed([...dependencies], () => {
      const x = witness();
      return x === null
        ? strings.passStringProperty.value
        : `${strings.failStringProperty.value}  ·  ${probeDetails(x)}`;
    });
    const feedback = computed([model.predictionVerdict, model.example, model.piece], () => {
      const judged = model.predictionVerdict.value;
      if (judged === null) {
        return "";
      }
      const entry = model.entry;
      const answer = StringUtils.fillIn(strings[`${entry.kind}AnswerStringProperty`].value, {
        value: format(limitOf(entry) ?? 0, 4),
        left: value(entry.left, "?"),
        right: value(entry.right, "?"),
      });
      const category = strings[`${model.example.value}StringProperty`].value;
      return `${judged === "right" ? strings.predictRightStringProperty.value : strings.predictWrongStringProperty.value} ${category}: ${answer}`;
    });
    const title = approach ? names.approachStringProperty : names.epsilonDeltaStringProperty;
    super({
      title,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details: computed([...dependencies, formula, feedback], () =>
        approach
          ? `${plainFormula()}. ${left.value}. ${right.value}. ${point.value}. ${feedback.value}`
          : `${plainFormula()}. L = ${format(model.target.value)}, ε = ${format(model.epsilon.value)}, δ = ${format(model.delta.value, 3)}. ${verdict.value}`,
      ),
    });

    const offered: readonly Example[] = approach ? examples : epsilonDeltaExamples;
    const choices: Choice<Example>[] = offered.map((example) => ({
      value: example,
      label: example === "custom" ? strings.customStringProperty : entryFor(example).label,
      name:
        example === "custom"
          ? strings.customStringProperty
          : entryFor(example)
              .label.replace(/<[^>]+>/g, "")
              .replace(/ {2,}/g, " "),
    }));
    const functionBox = comboBox(model.example, choices, this.listParent, strings.functionStringProperty, 292);
    const zoom = slider(strings.zoomStringProperty, model.zoom, 0, 3, 1, (x) => 10 ** x, 0.1);
    let controls: Node;
    let notes: Node;
    if (approach) {
      controls = column(
        functionBox,
        richText(customLine, 15, 292),
        zoom,
        text(point, 15, 292, true),
        this.valueTable(model),
      );
      // Each answer is a button: pressing it commits the prediction and reveals the verdict.
      const predictionButtons = limitKinds.map((kind) =>
        button(strings[`${kind}StringProperty`], () => {
          model.prediction.value = kind;
          model.checkPrediction();
        }),
      );
      notes = column(
        row(text(strings.predictionStringProperty, 14, 110, true), ...predictionButtons),
        richText(feedback, 14, this.notesWidth, true, true),
        text(left, 15, this.notesWidth),
        text(right, 15, this.notesWidth),
      );
    } else {
      controls = column(
        functionBox,
        richText(customLine, 15, 292),
        zoom,
        slider(strings.targetStringProperty, model.target, -TARGET_RANGE, TARGET_RANGE, 2, undefined, 0.05),
        slider(strings.epsilonStringProperty, model.epsilon, 0.05, 2, 2, undefined, 0.05),
        slider(strings.deltaStringProperty, model.delta, 0.001, 1, 3, undefined, 0.001),
        text(
          computed([model.example], () =>
            model.entry.kind === "finite"
              ? strings.trySmallerStringProperty.value
              : strings.challengeStringProperty.value,
          ),
          14,
        ),
        ...LimitExplorerView.challengeControls(model),
      );
      notes = column(
        text(verdict, 17, this.notesWidth, true),
        text(strings.inputBandStringProperty, 15, this.notesWidth),
        text(strings.outputBandStringProperty, 15, this.notesWidth),
        text(
          computed([model.example], () =>
            model.example.value === "custom" ? strings.customNoteStringProperty.value : "",
          ),
          15,
          this.notesWidth,
        ),
      );
    }
    this.finish(controls, notes, () => model.reset());

    const plot = this.plot;
    const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
    const snap = (x: number, step: number) => roundSymmetric(x / step) * step;
    if (approach) {
      this.plot.onDrag((x) => {
        const property = x < model.entry.a ? model.left : model.right;
        property.value = clamp(Math.abs(x - model.entry.a) / model.span, 0.005, 1);
      });
      const probe = (
        property: typeof model.left,
        fill: typeof Colors.secondaryColorProperty,
        name: typeof strings.leftProbeHandleStringProperty,
        outward: -1 | 1,
      ) =>
        plot.handle({
          fill,
          cursor: "ew-resize",
          drag: (x) => {
            property.value = clamp(Math.abs(plot.modelX(x) - model.entry.a) / model.span, 0.005, 1);
          },
          keyboard: {
            name,
            direction: "leftRight",
            step: (dx) => {
              property.value = clamp(toFixedNumber(property.value + outward * dx * 0.02, 4), 0.005, 1);
            },
          },
          readout: () => probeDetails(property === model.left ? model.leftX : model.rightX),
        });
      this.handles = [
        [
          probe(model.left, Colors.secondaryColorProperty, strings.leftProbeHandleStringProperty, -1),
          () => model.leftX,
        ],
        [
          probe(model.right, Colors.tertiaryColorProperty, strings.rightProbeHandleStringProperty, 1),
          () => model.rightX,
        ],
      ];
    } else {
      const target = plot.handle({
        cursor: "ns-resize",
        drag: (_x, y) => {
          model.target.value = clamp(snap(plot.modelY(y), 0.05), -TARGET_RANGE, TARGET_RANGE);
        },
        readout: () => `L = ${format(model.target.value)}`,
      });
      const epsilon = plot.handle({
        fill: Colors.secondaryColorProperty,
        cursor: "ns-resize",
        drag: (_x, y) => {
          model.epsilon.value = clamp(snap(Math.abs(plot.modelY(y) - model.target.value), 0.05), 0.05, 2);
        },
        readout: () => `ε = ${format(model.epsilon.value)}`,
      });
      const delta = plot.handle({
        fill: Colors.tertiaryColorProperty,
        cursor: "ew-resize",
        drag: (x) => {
          model.delta.value = clamp(snap(Math.abs(plot.modelX(x) - model.entry.a), 0.001), 0.001, 1);
        },
        readout: () => `δ = ${format(model.delta.value, 3)}`,
      });
      this.placeBandHandles = (low, high, horizontal) => {
        const { a } = model.entry;
        target.place(plot.plotX(a + 0.75 * model.span), plot.plotY(model.target.value));
        epsilon.place(plot.plotX(a - 0.75 * model.span), plot.plotY(model.target.value + model.epsilon.value));
        // Keep the handle reachable when zooming in past the band boundary.
        delta.place(plot.plotX(a + Math.min(model.delta.value, horizontal)), plot.plotY(low + 0.1 * (high - low)));
        delta.opacity = model.delta.value <= horizontal ? 1 : 0.55;
      };
    }

    // The custom function's parts have no slider, so these grips take the keyboard too.
    const part = (key: keyof Piece, name: typeof strings.leftBranchStringProperty, readout: () => string) =>
      plot.handle({
        fill: key === "point" ? Colors.accentColorProperty : Colors.textColorProperty,
        cursor: "ns-resize",
        drag: (_x, y) => {
          // A branch grip at x moves the branch so it passes through the pointer: height = y − x.
          const offset = key === "left" ? -this.branchX(model) : key === "right" ? this.branchX(model) : 0;
          model.shape(key, plot.modelY(y) + offset);
        },
        readout,
        keyboard: {
          name,
          direction: "upDown",
          step: (_dx, dy) => model.shape(key, model.piece.value[key] + dy * PIECE_KEY_STEP),
        },
      });
    this.pieceHandles = [
      [part("left", strings.leftBranchStringProperty, () => `x → 0⁻ : ${format(model.piece.value.left)}`), "left"],
      [part("point", strings.pointValueStringProperty, () => `f(0) = ${format(model.piece.value.point)}`), "point"],
      [part("right", strings.rightBranchStringProperty, () => `x → 0⁺ : ${format(model.piece.value.right)}`), "right"],
    ];

    Multilink.multilink([localeProperty, ...dependencies], () => this.draw(model));
  }

  /** f at a − 10⁻ᵏ and a + 10⁻ᵏ: the numbers close in on the one-sided limits. */
  private valueTable(model: LimitExplorerModel): Node {
    const strings = StringManager.getInstance().getLessonStrings();
    const cell = (source: () => string, bold = false) =>
      text(computed([model.example, model.piece, strings.undefinedStringProperty], source), 13, 70, bold);
    const columnOf = (side: -1 | 1, which: "x" | "y") =>
      new VBox({
        align: "left",
        spacing: 3,
        children: [
          cell(() => (which === "x" ? (side < 0 ? "x → a⁻" : "x → a⁺") : "f(x)"), true),
          ...TABLE_POWERS.map((k) =>
            cell(() => {
              const x = model.entry.a + side * 10 ** -k;
              return which === "x" ? format(x, k) : value(model.entry.f(x), strings.undefinedStringProperty.value);
            }),
          ),
        ],
      });
    return column(
      text(strings.tableStringProperty, 14, 292, true),
      new HBox({
        spacing: 10,
        align: "top",
        children: [columnOf(-1, "x"), columnOf(-1, "y"), columnOf(1, "x"), columnOf(1, "y")],
      }),
    );
  }

  /** "Largest δ" challenge: new challenge and check buttons, the prompt, and the verdict. */
  private static challengeControls(model: LimitExplorerModel): Node[] {
    const strings = StringManager.getInstance().getLessonStrings();
    const check = button(strings.checkStringProperty, () => model.checkChallenge());
    model.challenge.link((challenge) => {
      check.enabled = challenge !== null;
    });
    const prompt = computed([model.challenge, strings.challengePromptStringProperty], () =>
      model.challenge.value === null
        ? ""
        : StringUtils.fillIn(strings.challengePromptStringProperty.value, { epsilon: format(model.challenge.value) }),
    );
    const verdict = computed([model.verdict], () =>
      model.verdict.value ? strings[`${model.verdict.value}StringProperty`].value : "",
    );
    return [
      row(
        button(strings.newChallengeStringProperty, () => model.newChallenge()),
        check,
      ),
      text(prompt, 14),
      text(verdict, 14, 298, true),
    ];
  }

  /** The branch grips sit near the outer ends of the branches, clear of the probes and bands. */
  private branchX(model: LimitExplorerModel): number {
    return -0.9 * model.span;
  }

  private readonly pieceHandles: ReadonlyArray<readonly [ReturnType<LessonView["plot"]["handle"]>, keyof Piece]>;

  /** Approach probes: each handle rides the graph at its probe's x. */
  private readonly handles: ReadonlyArray<readonly [ReturnType<LessonView["plot"]["handle"]>, () => number]> = [];
  private readonly placeBandHandles: (low: number, high: number, horizontal: number) => void = () => undefined;

  /**
   * The visible y-range: the function's values near a (with a robust cut for poles), its
   * one-sided limits, and on the ε–δ screen the whole ε-band.
   */
  private window(model: LimitExplorerModel, samples: readonly number[]): [number, number] {
    const entry = model.entry;
    const finite = samples.filter((y) => Number.isFinite(y)).sort((p, q) => p - q);
    const quantile = (q: number) => finite[Math.floor(q * (finite.length - 1))] ?? 0;
    const unbounded = !(Number.isFinite(entry.left) && Number.isFinite(entry.right)) && entry.kind !== "oscillates";
    let low = unbounded ? quantile(0.1) : (finite[0] ?? 0);
    let high = unbounded ? quantile(0.9) : (finite[finite.length - 1] ?? 0);
    for (const y of [entry.left, entry.right, entry.f(entry.a)]) {
      if (y !== null && Number.isFinite(y)) {
        low = Math.min(low, y);
        high = Math.max(high, y);
      }
    }
    if (model.example.value === "custom") {
      low = Math.min(low, -pieceRange - model.span);
      high = Math.max(high, pieceRange + model.span);
    }
    if (model.mode === "epsilon-delta") {
      low = Math.min(low, model.target.value - model.epsilon.value);
      high = Math.max(high, model.target.value + model.epsilon.value);
    }
    const pad = Math.max((high - low) * 0.12, 0.05 * model.span, 1e-6);
    return [low - pad, high + pad];
  }

  private draw(model: LimitExplorerModel): void {
    const plot = this.plot;
    const entry = model.entry;
    const { a } = entry;
    const span = model.span;
    const horizontal = span * 1.06;
    const count = 900;
    const xs = Array.from({ length: count + 1 }, (_, i) => a - horizontal + (2 * horizontal * i) / count);
    const ys = xs.map((x) => (x === a ? null : entry.f(x)));
    const [low, high] = this.window(
      model,
      ys.filter((y): y is number => y !== null),
    );
    const xTicks = niceTicks(a - horizontal, a + horizontal, 5);
    const yTicks = niceTicks(low, high, 5);
    const xDigits = digitsFor((xTicks[1] ?? 1) - (xTicks[0] ?? 0));
    const yDigits = digitsFor((yTicks[1] ?? 1) - (yTicks[0] ?? 0));
    plot.setDomain([a - horizontal, a + horizontal, low, high], "x", "f(x)", xTicks, yTicks, {
      x: (x) => format(x, xDigits),
      y: (y) => format(y, yDigits),
    });
    plot.clear();
    if (model.mode === "epsilon-delta") {
      const d = model.delta.value;
      const L = model.target.value;
      plot.region(
        [
          [a - d, low],
          [a + d, low],
          [a + d, high],
          [a - d, high],
        ],
        Colors.positiveFillColorProperty,
      );
      for (const x of [a - d, a + d]) {
        plot.line(
          [
            [x, low],
            [x, high],
          ],
          Colors.tertiaryColorProperty,
          1.5,
          [5, 4],
        );
      }
      plot.line(
        [
          [a - horizontal, L],
          [a + horizontal, L],
        ],
        Colors.accentColorProperty,
        1,
        [2, 4],
      );
      for (const y of [L - model.epsilon.value, L + model.epsilon.value]) {
        plot.line(
          [
            [a - horizontal, y],
            [a + horizontal, y],
          ],
          Colors.secondaryColorProperty,
          1.5,
          [5, 4],
        );
      }
    }

    this.drawFunction(model, xs, ys, low, high);

    if (model.mode === "approach") {
      for (const [x, color] of [
        [model.leftX, Colors.secondaryColorProperty],
        [model.rightX, Colors.tertiaryColorProperty],
      ] as const) {
        const y = entry.f(x) ?? 0;
        plot.line(
          [
            [x, Math.max(low, Math.min(high, 0))],
            [x, y],
          ],
          color,
          1.5,
          [4, 4],
        );
        plot.point(x, y, color);
      }
      for (const [handle, x] of this.handles) {
        handle.place(plot.plotX(x()), plot.plotY(entry.f(x()) ?? 0));
      }
    } else {
      this.placeBandHandles(low, high, horizontal);
      const x = counterexample(
        model.example.value,
        model.target.value,
        model.epsilon.value,
        model.delta.value,
        model.piece.value,
      );
      if (x !== null) {
        plot.point(x, entry.f(x) ?? 0, Colors.secondaryColorProperty);
      }
    }
    this.placePieceHandles(model);
  }

  private placePieceHandles(model: LimitExplorerModel): void {
    const plot = this.plot;
    const piece = model.piece.value;
    const branchX = this.branchX(model);
    for (const [handle, key] of this.pieceHandles) {
      const x = key === "left" ? branchX : key === "right" ? -branchX : 0;
      handle.place(plot.plotX(x), plot.plotY(key === "point" ? piece.point : (model.entry.f(x) ?? 0)));
      handle.visible &&= model.example.value === "custom";
    }
  }

  /**
   * Draws f from samples, breaking the curve at gaps, poles and jumps; shades oscillations
   * too fast to resolve; and marks holes, one-sided limits, f(a) and vertical asymptotes.
   */
  private drawFunction(
    model: LimitExplorerModel,
    xs: readonly number[],
    ys: ReadonlyArray<number | null>,
    low: number,
    high: number,
  ): void {
    const plot = this.plot;
    const entry = model.entry;
    const { a } = entry;
    const horizontal = (xs[xs.length - 1] ?? a) - a;
    // Inside this distance the phase of sin(1/h) turns about a radian per pixel.
    const threshold = entry.envelope ? Math.min(horizontal, Math.sqrt((2 * horizontal) / plot.widthInPixels)) : 0;
    if (entry.envelope && threshold > 0) {
      const envelope = entry.envelope;
      const level = entry.kind === "finite" ? entry.left : 0;
      const steps = 40;
      const top = Array.from({ length: steps + 1 }, (_, i): [number, number] => {
        const h = -threshold + (2 * threshold * i) / steps;
        return [a + h, level + envelope(h)];
      });
      const bottom = top.map(([x]): [number, number] => [x, level - envelope(x - a)]).reverse();
      plot.region([...top, ...bottom], Colors.negativeFillColorProperty);
    }
    const jump = (high - low) * 0.5;
    let segment: [number, number][] = [];
    const flush = () => {
      if (segment.length > 1) {
        plot.line(segment);
      }
      segment = [];
    };
    xs.forEach((x, i) => {
      const y = ys[i];
      if (y === null || y === undefined || !Number.isFinite(y) || Math.abs(x - a) < threshold) {
        flush();
        return;
      }
      const previous = segment[segment.length - 1];
      // A large step between neighbors is a jump or a pole, not part of the curve; the
      // student's branches never join across a.
      if (previous && (Math.abs(y - previous[1]) > jump || (entry.id === "custom" && previous[0] < a && x > a))) {
        flush();
      }
      segment.push([x, y]);
    });
    flush();

    const atA = entry.f(a);
    const finite = (y: number) => Number.isFinite(y);
    if (!(finite(entry.left) && finite(entry.right))) {
      if (entry.kind !== "oscillates") {
        plot.line(
          [
            [a, low],
            [a, high],
          ],
          Colors.textColorProperty,
          1,
          [6, 5],
        );
      }
    }
    for (const y of entry.left === entry.right ? [entry.left] : [entry.left, entry.right]) {
      if (finite(y) && atA !== y) {
        plot.point(a, y, Colors.accentColorProperty, true);
      }
    }
    if (atA !== null) {
      plot.point(a, atA, Colors.accentColorProperty);
    }
  }
}
