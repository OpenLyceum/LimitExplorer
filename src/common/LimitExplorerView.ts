import { Multilink, StringProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, type Node } from "scenerystack/scenery";
import { StringManager } from "../i18n/StringManager.js";
import Colors from "../LimitExplorerColors.js";
import { button, column, computed, format, LessonView, slider, text } from "./LessonView.js";
import {
  counterexample,
  evaluate,
  examples,
  type LimitExplorerModel,
  type Piece,
  pieceRange,
} from "./model/LimitExplorerModel.js";

// Each arrow-key press moves a custom part by this much (Shift: a quarter).
const PIECE_KEY_STEP = 0.2;

/** "x + 0.5" or "x − 0.5": one branch of the student's function. */
function branch(height: number): string {
  return height === 0 ? "x" : `x ${height < 0 ? "−" : "+"} ${format(Math.abs(height))}`;
}

function formulaFor(example: LimitExplorerModel["example"]["value"], piece: Piece): string {
  return example === "custom"
    ? `f(x) = ${branch(piece.left)}  (x < 0)    f(0) = ${format(piece.point)}    f(x) = ${branch(piece.right)}  (x > 0)`
    : formulas[example];
}

/** Half the plot's height in model units: room for the bands, the curve, and the custom grips. */
function verticalExtent(model: LimitExplorerModel, horizontal: number): number {
  const example = model.example.value;
  // The custom function's grips can reach pieceRange plus the branch slope.
  const customExtent = example === "custom" ? pieceRange + horizontal + 0.25 : 0;
  if (model.mode === "epsilon-delta") {
    return Math.max(2.2, Math.abs(model.target.value) + model.epsilon.value + 0.2, customExtent);
  }
  if (example === "custom") {
    return customExtent;
  }
  return example === "continuous" || example === "removable" ? 2.2 * model.span : 1.25;
}

const formulas = {
  continuous: "f(x) = 2x",
  removable: "f(x) = 2x  (x ≠ 0)    f(0) = 1",
  jump: "f(x) = −1  (x < 0)    f(x) = 1  (x ≥ 0)",
  oscillation: "f(x) = sin(1/x)  (x ≠ 0)",
};

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
    const f = (x: number) => evaluate(model.example.value, x, model.piece.value);
    const probeDetails = (x: number) => {
      const y = f(x);
      return `x = ${format(x, 6)}    f(x) = ${y === null ? strings.undefinedStringProperty.value : format(y, 5)}`;
    };
    const left = computed(
      [...dependencies],
      () => `${strings.leftStringProperty.value}   ${probeDetails(model.leftX)}`,
    );
    const right = computed(
      [...dependencies],
      () => `${strings.rightStringProperty.value}   ${probeDetails(model.rightX)}`,
    );
    const point = computed([...dependencies], () => {
      const value = f(0);
      return `f(0) = ${value === null ? strings.undefinedStringProperty.value : format(value)}`;
    });
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
    const title = approach ? names.approachStringProperty : names.epsilonDeltaStringProperty;
    super({
      title,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details: computed([...dependencies], () =>
        approach
          ? `${formulaFor(model.example.value, model.piece.value)}. ${left.value}. ${right.value}. ${point.value}.`
          : `${formulaFor(model.example.value, model.piece.value)}. L = ${format(model.target.value)}, ε = ${format(model.epsilon.value)}, δ = ${format(model.delta.value, 3)}. ${verdict.value}`,
      ),
    });

    const exampleLabel = computed([model.example], () => strings[`${model.example.value}StringProperty`].value);
    const formula = computed([model.example, model.piece], () => formulaFor(model.example.value, model.piece.value));
    const zoom = slider(strings.zoomStringProperty, model.zoom, 0, 3, 1, (x) => 10 ** x, 0.1);
    const controls = column(
      text(exampleLabel, 19, 286, true),
      text(formula),
      button(strings.presetStringProperty, () => {
        model.example.value = examples[(examples.indexOf(model.example.value) + 1) % examples.length] ?? "removable";
      }),
      zoom,
      ...(approach
        ? [
            slider(strings.leftProbeStringProperty, model.left, 0.005, 1, 3),
            slider(strings.rightProbeStringProperty, model.right, 0.005, 1, 3),
            text(point),
          ]
        : [
            slider(new StringProperty("L"), model.target, -2, 2, 2, undefined, 0.05),
            slider(new StringProperty("ε"), model.epsilon, 0.05, 2, 2, undefined, 0.05),
            slider(new StringProperty("δ"), model.delta, 0.001, 1, 3, undefined, 0.001),
            text(
              // The custom note is too long for the panel; it goes under the graph instead.
              computed([model.example], () =>
                model.example.value === "custom"
                  ? ""
                  : model.example.value === "jump" || model.example.value === "oscillation"
                    ? strings.challengeStringProperty.value
                    : strings.trySmallerStringProperty.value,
              ),
              15,
            ),
            ...LimitExplorerView.challengeControls(model),
          ]),
    );
    const note = computed([model.example], () =>
      model.example.value === "custom"
        ? strings.customNoteStringProperty.value
        : model.example.value === "oscillation"
          ? strings.zoomNoteStringProperty.value
          : strings.pointNoteStringProperty.value,
    );
    this.finish(
      controls,
      approach
        ? column(text(left, 18, 610, true), text(right, 18, 610, true), text(note, 15, 610))
        : column(
            text(verdict, 18, 610, true),
            text(strings.inputBandStringProperty, 15, 610),
            text(strings.outputBandStringProperty, 15, 610),
            text(
              computed([model.example], () =>
                model.example.value === "custom" ? strings.customNoteStringProperty.value : "",
              ),
              15,
              610,
            ),
          ),
      () => model.reset(),
    );

    const plot = this.plot;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const snap = (value: number, step: number) => Math.round(value / step) * step;
    if (approach) {
      this.plot.onDrag((x) => {
        const property = x < 0 ? model.left : model.right;
        property.value = clamp(Math.abs(x) / model.span, 0.005, 1);
      });
      const probe = (property: typeof model.left, fill: typeof Colors.secondaryColorProperty) =>
        plot.handle({
          fill,
          cursor: "ew-resize",
          drag: (x) => {
            property.value = clamp(Math.abs(plot.modelX(x)) / model.span, 0.005, 1);
          },
          readout: () => {
            const x = property === model.left ? model.leftX : model.rightX;
            const y = f(x);
            return `x = ${format(x, 6)} · f(x) = ${y === null ? strings.undefinedStringProperty.value : format(y, 5)}`;
          },
        });
      this.handles = [
        [probe(model.left, Colors.secondaryColorProperty), () => model.leftX],
        [probe(model.right, Colors.tertiaryColorProperty), () => model.rightX],
      ];
    } else {
      const target = plot.handle({
        cursor: "ns-resize",
        drag: (_x, y) => {
          model.target.value = clamp(snap(plot.modelY(y), 0.05), -2, 2);
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
          model.delta.value = clamp(snap(Math.abs(plot.modelX(x)), 0.001), 0.001, 1);
        },
        readout: () => `δ = ${format(model.delta.value, 3)}`,
      });
      this.placeBandHandles = (extent) => {
        target.place(plot.plotX(0.75 * model.span), plot.plotY(model.target.value));
        epsilon.place(plot.plotX(-0.75 * model.span), plot.plotY(model.target.value + model.epsilon.value));
        delta.place(plot.plotX(model.delta.value), plot.plotY(-0.8 * extent));
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
        keyboard: { name, step: (_dx, dy) => model.shape(key, model.piece.value[key] + dy * PIECE_KEY_STEP) },
      });
    this.pieceHandles = [
      [part("left", strings.leftBranchStringProperty, () => `x → 0⁻ : ${format(model.piece.value.left)}`), "left"],
      [part("point", strings.pointValueStringProperty, () => `f(0) = ${format(model.piece.value.point)}`), "point"],
      [part("right", strings.rightBranchStringProperty, () => `x → 0⁺ : ${format(model.piece.value.right)}`), "right"],
    ];

    Multilink.multilink([localeProperty, ...dependencies], () => this.draw(model));
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
      new HBox({
        spacing: 7,
        children: [button(strings.newChallengeStringProperty, () => model.newChallenge()), check],
      }),
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
  private readonly placeBandHandles: (extent: number) => void = () => undefined;

  private draw(model: LimitExplorerModel): void {
    const plot = this.plot;
    const example = model.example.value;
    const piece = model.piece.value;
    const f = (x: number) => evaluate(example, x, piece);
    const span = model.span;
    const horizontal = span * 1.06;
    const extent = verticalExtent(model, horizontal);
    plot.setDomain([-horizontal, horizontal, -extent, extent], "x", "f(x)", [-span, 0, span]);
    plot.clear();
    if (model.mode === "epsilon-delta") {
      const { value: d } = model.delta;
      const low = model.target.value - model.epsilon.value;
      const high = model.target.value + model.epsilon.value;
      plot.region(
        [
          [-d, -extent],
          [d, -extent],
          [d, extent],
          [-d, extent],
        ],
        Colors.positiveFillColorProperty,
      );
      for (const x of [-d, d]) {
        plot.line(
          [
            [x, -extent],
            [x, extent],
          ],
          Colors.tertiaryColorProperty,
          1.5,
          [5, 4],
        );
      }
      plot.line(
        [
          [-span, model.target.value],
          [span, model.target.value],
        ],
        Colors.accentColorProperty,
        1,
        [2, 4],
      );
      for (const y of [low, high]) {
        plot.line(
          [
            [-span, y],
            [span, y],
          ],
          Colors.secondaryColorProperty,
          1.5,
          [5, 4],
        );
      }
    }

    this.drawFunction(example, horizontal, piece);

    if (model.mode === "approach") {
      for (const [x, color] of [
        [model.leftX, Colors.secondaryColorProperty],
        [model.rightX, Colors.tertiaryColorProperty],
      ] as const) {
        const y = f(x) ?? 0;
        plot.line(
          [
            [x, 0],
            [x, y],
          ],
          color,
          1.5,
          [4, 4],
        );
        plot.point(x, y, color);
      }
      for (const [handle, x] of this.handles) {
        handle.place(plot.plotX(x()), plot.plotY(f(x()) ?? 0));
      }
    } else {
      this.placeBandHandles(extent);
      const x = counterexample(example, model.target.value, model.epsilon.value, model.delta.value, piece);
      if (x !== null) {
        plot.point(x, f(x) ?? 0, Colors.secondaryColorProperty);
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
      handle.place(plot.plotX(x), plot.plotY(key === "point" ? piece.point : (evaluate("custom", x, piece) ?? 0)));
      handle.visible &&= model.example.value === "custom";
    }
  }
  private drawFunction(example: LimitExplorerModel["example"]["value"], span: number, piece: Piece): void {
    const plot = this.plot;
    if (example === "custom") {
      plot.line([
        [-span, piece.left - span],
        [0, piece.left],
      ]);
      plot.line([
        [0, piece.right],
        [span, piece.right + span],
      ]);
      plot.point(0, piece.left, Colors.accentColorProperty, true);
      plot.point(0, piece.right, Colors.accentColorProperty, true);
    } else if (example === "oscillation") {
      // The phase changes by about a radian per horizontal pixel at this threshold.
      const threshold = Math.min(span, Math.sqrt((2 * span) / plot.widthInPixels));
      plot.region(
        [
          [-threshold, -1],
          [threshold, -1],
          [threshold, 1],
          [-threshold, 1],
        ],
        Colors.negativeFillColorProperty,
      );
      if (threshold < span) {
        for (const sign of [-1, 1]) {
          plot.line(
            Array.from({ length: 481 }, (_, i) => {
              const x = sign * (threshold + ((span - threshold) * i) / 480);
              return [x, Math.sin(1 / x)];
            }),
          );
        }
      }
    } else if (example === "jump") {
      plot.line([
        [-span, -1],
        [0, -1],
      ]);
      plot.line([
        [0, 1],
        [span, 1],
      ]);
      plot.point(0, -1, Colors.accentColorProperty, true);
      plot.point(0, 1, Colors.accentColorProperty);
    } else {
      plot.line([
        [-span, -2 * span],
        [span, 2 * span],
      ]);
      if (example === "removable") {
        plot.point(0, 0, Colors.accentColorProperty, true);
        plot.point(0, 1, Colors.accentColorProperty);
      }
    }
  }
}
