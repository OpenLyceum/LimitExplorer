import { Multilink, StringProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringManager } from "../i18n/StringManager.js";
import Colors from "../LimitExplorerColors.js";
import { button, column, computed, format, LessonView, slider, text } from "./LessonView.js";
import { counterexample, evaluate, examples, type LimitExplorerModel } from "./model/LimitExplorerModel.js";

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
    ] as const;
    const probeDetails = (x: number) => {
      const y = evaluate(model.example.value, x);
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
      const value = evaluate(model.example.value, 0);
      return `f(0) = ${value === null ? strings.undefinedStringProperty.value : format(value)}`;
    });
    const witness = () =>
      counterexample(model.example.value, model.target.value, model.epsilon.value, model.delta.value);
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
          ? `${formulas[model.example.value]}. ${left.value}. ${right.value}. ${point.value}.`
          : `${formulas[model.example.value]}. L = ${format(model.target.value)}, ε = ${format(model.epsilon.value)}, δ = ${format(model.delta.value, 3)}. ${verdict.value}`,
      ),
    });

    const exampleLabel = computed([model.example], () => strings[`${model.example.value}StringProperty`].value);
    const formula = computed([model.example], () => formulas[model.example.value]);
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
              computed([model.example], () =>
                model.example.value === "jump" || model.example.value === "oscillation"
                  ? strings.challengeStringProperty.value
                  : strings.trySmallerStringProperty.value,
              ),
              15,
            ),
          ]),
    );
    const note = computed([model.example], () =>
      model.example.value === "oscillation"
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
          ),
      () => model.reset(),
    );

    if (approach) {
      this.plot.onDrag((x) => {
        const property = x < 0 ? model.left : model.right;
        property.value = Math.max(0.005, Math.min(1, Math.abs(x) / model.span));
      });
    }

    Multilink.multilink([localeProperty, ...dependencies], () => this.draw(model));
  }

  private draw(model: LimitExplorerModel): void {
    const plot = this.plot;
    const example = model.example.value;
    const span = model.span;
    const horizontal = span * 1.06;
    const linear = example === "continuous" || example === "removable";
    const extent =
      model.mode === "epsilon-delta"
        ? Math.max(2.2, Math.abs(model.target.value) + model.epsilon.value + 0.2)
        : linear
          ? 2.2 * span
          : 1.25;
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

    this.drawFunction(example, horizontal);

    if (model.mode === "approach") {
      for (const [x, color] of [
        [model.leftX, Colors.secondaryColorProperty],
        [model.rightX, Colors.tertiaryColorProperty],
      ] as const) {
        const y = evaluate(example, x) ?? 0;
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
    } else {
      const x = counterexample(example, model.target.value, model.epsilon.value, model.delta.value);
      if (x !== null) {
        plot.point(x, evaluate(example, x) ?? 0, Colors.secondaryColorProperty);
      }
    }
  }
  private drawFunction(example: LimitExplorerModel["example"]["value"], span: number): void {
    const plot = this.plot;
    if (example === "oscillation") {
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
