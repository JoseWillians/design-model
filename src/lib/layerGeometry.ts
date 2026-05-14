import type { LayerBounds, TemplateCanvas } from "./templateTypes";

export type ResizeHandle = "n" | "e" | "s" | "w" | "ne" | "nw" | "se" | "sw";

export interface PointDelta {
  dx: number;
  dy: number;
}

export interface SizeConstraints {
  minWidth?: number;
  minHeight?: number;
}

export interface BoundsClampOptions extends SizeConstraints {
  canvas: Pick<TemplateCanvas, "width" | "height">;
}

const DEFAULT_MIN_SIZE = 1;

const getMinWidth = (constraints?: SizeConstraints) =>
  Math.max(DEFAULT_MIN_SIZE, constraints?.minWidth ?? DEFAULT_MIN_SIZE);

const getMinHeight = (constraints?: SizeConstraints) =>
  Math.max(DEFAULT_MIN_SIZE, constraints?.minHeight ?? DEFAULT_MIN_SIZE);

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const snapValue = (value: number, gridSize: number) => {
  if (gridSize <= 0) {
    return value;
  }

  return Math.round(value / gridSize) * gridSize;
};

export const snapBounds = (bounds: LayerBounds, gridSize: number): LayerBounds => ({
  ...bounds,
  x: snapValue(bounds.x, gridSize),
  y: snapValue(bounds.y, gridSize),
  width: snapValue(bounds.width, gridSize),
  height: snapValue(bounds.height, gridSize),
});

export const snapPositionBounds = (bounds: LayerBounds, gridSize: number): LayerBounds => ({
  ...bounds,
  x: snapValue(bounds.x, gridSize),
  y: snapValue(bounds.y, gridSize),
});

export const clampBounds = (
  bounds: LayerBounds,
  options: BoundsClampOptions,
): LayerBounds => {
  const minWidth = getMinWidth(options);
  const minHeight = getMinHeight(options);
  const width = clampNumber(bounds.width, minWidth, Math.max(minWidth, options.canvas.width));
  const height = clampNumber(bounds.height, minHeight, Math.max(minHeight, options.canvas.height));

  return {
    ...bounds,
    x: clampNumber(bounds.x, 0, Math.max(0, options.canvas.width - width)),
    y: clampNumber(bounds.y, 0, Math.max(0, options.canvas.height - height)),
    width,
    height,
  };
};

export const clampResizedBounds = (
  startBounds: LayerBounds,
  resizedBounds: LayerBounds,
  handle: ResizeHandle,
  options: BoundsClampOptions,
): LayerBounds => {
  const minWidth = getMinWidth(options);
  const minHeight = getMinHeight(options);
  const movesWest = handle.includes("w");
  const movesEast = handle.includes("e");
  const movesNorth = handle.includes("n");
  const movesSouth = handle.includes("s");
  const right = startBounds.x + startBounds.width;
  const bottom = startBounds.y + startBounds.height;

  let nextX = startBounds.x;
  let nextY = startBounds.y;
  let nextWidth = startBounds.width;
  let nextHeight = startBounds.height;

  if (movesEast) {
    nextWidth = clampNumber(resizedBounds.width, minWidth, Math.max(minWidth, options.canvas.width - startBounds.x));
  }

  if (movesWest) {
    nextWidth = clampNumber(resizedBounds.width, minWidth, Math.max(minWidth, right));
    nextX = clampNumber(right - nextWidth, 0, Math.max(0, right - minWidth));
    nextWidth = right - nextX;
  }

  if (movesSouth) {
    nextHeight = clampNumber(resizedBounds.height, minHeight, Math.max(minHeight, options.canvas.height - startBounds.y));
  }

  if (movesNorth) {
    nextHeight = clampNumber(resizedBounds.height, minHeight, Math.max(minHeight, bottom));
    nextY = clampNumber(bottom - nextHeight, 0, Math.max(0, bottom - minHeight));
    nextHeight = bottom - nextY;
  }

  return {
    ...resizedBounds,
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
};

export const moveBounds = (bounds: LayerBounds, delta: PointDelta): LayerBounds => ({
  ...bounds,
  x: bounds.x + delta.dx,
  y: bounds.y + delta.dy,
});

export const resizeBounds = (
  bounds: LayerBounds,
  handle: ResizeHandle,
  delta: PointDelta,
  constraints?: SizeConstraints,
): LayerBounds => {
  const minWidth = getMinWidth(constraints);
  const minHeight = getMinHeight(constraints);
  const movesWest = handle.includes("w");
  const movesEast = handle.includes("e");
  const movesNorth = handle.includes("n");
  const movesSouth = handle.includes("s");

  let nextX = bounds.x;
  let nextY = bounds.y;
  let nextWidth = bounds.width;
  let nextHeight = bounds.height;

  if (movesWest) {
    const width = Math.max(minWidth, bounds.width - delta.dx);
    nextX = bounds.x + (bounds.width - width);
    nextWidth = width;
  }

  if (movesEast) {
    nextWidth = Math.max(minWidth, bounds.width + delta.dx);
  }

  if (movesNorth) {
    const height = Math.max(minHeight, bounds.height - delta.dy);
    nextY = bounds.y + (bounds.height - height);
    nextHeight = height;
  }

  if (movesSouth) {
    nextHeight = Math.max(minHeight, bounds.height + delta.dy);
  }

  return {
    ...bounds,
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight,
  };
};
