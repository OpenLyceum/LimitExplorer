import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../LimitExplorerColors.js";

function makeIcon(outline: string, points: readonly (readonly [number, number])[] = []): ScreenIcon {
  const background = new Rectangle(0, 0, 548, 373, { fill: Colors.backgroundColorProperty });
  const line = new Path(new Shape(outline), {
    stroke: Colors.accentColorProperty,
    lineWidth: 18,
    lineCap: "round",
    lineJoin: "round",
  });
  const markers = points.map(([x, y]) => new Circle(12, { x, y, fill: Colors.secondaryColorProperty }));
  return new ScreenIcon(new Node({ children: [background, line, ...markers] }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: Colors.backgroundColorProperty,
  });
}

export function createApproachIcon(): ScreenIcon {
  return makeIcon("M 94 302 L 268 186 L 453 63", [
    [268, 186],
    [268, 104],
  ]);
}

export function createEpsilonDeltaIcon(): ScreenIcon {
  return makeIcon("M 124 266 L 430 97 M 162 59 L 162 315 M 386 59 L 386 315 M 58 129 L 488 129 M 58 249 L 488 249", [
    [274, 184],
  ]);
}
