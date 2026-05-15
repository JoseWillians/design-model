import { clampBounds, clampNumber } from "./layerGeometry";
import { defaultTemplateTokens } from "./templateSeed";
import type {
  FontWeight,
  LayerBounds,
  LayerStyle,
  ShapeKind,
  TemplateCanvas,
  TemplateCategory,
  TemplateDocument,
  TemplateLayer,
  TemplateMetadata,
  TemplateStatus,
  TemplateTokens,
  TextAlign,
  TextStyle,
} from "./templateTypes";

const CANVAS_MIN_SIZE = 160;
const CANVAS_MAX_SIZE = 8192;
const MAX_STRING_LENGTH = 1200;
const MAX_LAYER_COUNT = 250;

export type TemplateImportResult =
  | { ok: true; template: TemplateDocument }
  | { ok: false; error: string };

const categories = new Set<TemplateCategory>(["dashboard", "catalog", "landing", "mobile", "presentation", "social"]);
const statuses = new Set<TemplateStatus>(["draft", "published"]);
const shapes = new Set<ShapeKind>(["rectangle", "ellipse", "line"]);
const textAligns = new Set<TextAlign>(["left", "center", "right"]);
const fontWeights = new Set<FontWeight>([300, 400, 500, 600, 700, 800]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback: string, maxLength = MAX_STRING_LENGTH) =>
  typeof value === "string" ? value.slice(0, maxLength) : fallback;

const asFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const cloneTokens = (tokens: TemplateTokens): TemplateTokens => JSON.parse(JSON.stringify(tokens));

const normalizeStringRecord = (value: unknown, fallback: Record<string, string>, maxLength = 240) => {
  if (!isRecord(value)) return fallback;

  const entries = Object.entries(value)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, item]) => [key.slice(0, 80), item.slice(0, maxLength)] as const);

  return entries.length ? Object.fromEntries(entries) : fallback;
};

const normalizeNumberRecord = (value: unknown, fallback: Record<string, number>, min: number, max: number) => {
  if (!isRecord(value)) return fallback;

  const entries = Object.entries(value)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]))
    .map(([key, item]) => [key.slice(0, 80), clampNumber(item, min, max)] as const);

  return entries.length ? Object.fromEntries(entries) : fallback;
};

const normalizeTypographyTokens = (
  value: unknown,
  fallback: TemplateTokens["typography"],
): TemplateTokens["typography"] => {
  if (!isRecord(value)) return fallback;

  const entries = Object.entries(value)
    .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
    .map(([key, item]) => [
      key.slice(0, 80),
      {
        fontFamily: asString(item.fontFamily, "Inter, system-ui, sans-serif", 160),
        fontSize: Math.round(clampNumber(asFiniteNumber(item.fontSize, 16), 8, 240)),
        fontWeight: fontWeights.has(item.fontWeight as FontWeight) ? (item.fontWeight as FontWeight) : 400,
        lineHeight: clampNumber(asFiniteNumber(item.lineHeight, 1.2), 0.8, 3),
        letterSpacing: clampNumber(asFiniteNumber(item.letterSpacing, 0), -10, 30),
      },
    ] as const);

  return entries.length ? Object.fromEntries(entries) : fallback;
};

const normalizeMetadata = (value: unknown): TemplateMetadata | null => {
  if (!isRecord(value)) return null;
  const name = asString(value.name, "").trim();

  if (!name) {
    return null;
  }

  const category = categories.has(value.category as TemplateCategory)
    ? (value.category as TemplateCategory)
    : "landing";
  const status = statuses.has(value.status as TemplateStatus) ? (value.status as TemplateStatus) : "draft";
  const tags = Array.isArray(value.tags)
    ? value.tags.map((tag) => asString(tag, "", 36).trim()).filter(Boolean).slice(0, 8)
    : [];

  return {
    id: asString(value.id, "imported-template", 120),
    name,
    description: asString(value.description, "Template importado de JSON.", 280),
    category,
    status,
    tags,
    createdAt: asString(value.createdAt, new Date().toISOString(), 80),
    updatedAt: asString(value.updatedAt, new Date().toISOString(), 80),
  };
};

const normalizeCanvas = (value: unknown): TemplateCanvas | null => {
  if (!isRecord(value)) return null;

  const width = Math.round(clampNumber(asFiniteNumber(value.width, 1440), CANVAS_MIN_SIZE, CANVAS_MAX_SIZE));
  const height = Math.round(clampNumber(asFiniteNumber(value.height, 1024), CANVAS_MIN_SIZE, CANVAS_MAX_SIZE));
  const gridSize = Math.round(clampNumber(asFiniteNumber(value.gridSize, 8), 2, 64));

  return {
    width,
    height,
    preset: "custom",
    background: asString(value.background, defaultTemplateTokens.colors.canvas, 80),
    gridSize,
  };
};

const normalizeBounds = (value: unknown, canvas: TemplateCanvas): LayerBounds | null => {
  if (!isRecord(value)) return null;

  return clampBounds(
    {
      x: asFiniteNumber(value.x, 0),
      y: asFiniteNumber(value.y, 0),
      width: asFiniteNumber(value.width, 160),
      height: asFiniteNumber(value.height, 120),
      rotation: asFiniteNumber(value.rotation, 0),
    },
    { canvas, minWidth: 16, minHeight: 16 },
  );
};

const normalizeStyle = (value: unknown): LayerStyle | undefined => {
  if (!isRecord(value)) return undefined;

  return {
    fill: typeof value.fill === "string" ? asString(value.fill, "", 120) : undefined,
    stroke: typeof value.stroke === "string" ? asString(value.stroke, "", 120) : undefined,
    strokeWidth: typeof value.strokeWidth === "number" ? clampNumber(value.strokeWidth, 0, 24) : undefined,
    opacity: typeof value.opacity === "number" ? clampNumber(value.opacity, 0, 1) : undefined,
    radius: typeof value.radius === "number" ? clampNumber(value.radius, 0, 999) : undefined,
    shadow: typeof value.shadow === "string" ? asString(value.shadow, "", 240) : undefined,
    blendMode: value.blendMode === "multiply" || value.blendMode === "screen" || value.blendMode === "overlay" ? value.blendMode : "normal",
  };
};

const normalizeTextStyle = (value: unknown): TextStyle => {
  const source = isRecord(value) ? value : {};
  const fontWeight = fontWeights.has(source.fontWeight as FontWeight) ? (source.fontWeight as FontWeight) : 700;
  const align = textAligns.has(source.align as TextAlign) ? (source.align as TextAlign) : "left";

  return {
    color: asString(source.color, "#172033", 80),
    fontFamily: asString(source.fontFamily, "Inter, system-ui, sans-serif", 160),
    fontSize: Math.round(clampNumber(asFiniteNumber(source.fontSize, 24), 8, 240)),
    fontWeight,
    lineHeight: clampNumber(asFiniteNumber(source.lineHeight, 1.2), 0.8, 3),
    letterSpacing: clampNumber(asFiniteNumber(source.letterSpacing, 0), -10, 30),
    align,
  };
};

const normalizeLayer = (value: unknown, canvas: TemplateCanvas, count: { value: number }): TemplateLayer | null => {
  if (!isRecord(value) || count.value >= MAX_LAYER_COUNT) return null;
  count.value += 1;

  const bounds = normalizeBounds(value.bounds, canvas);
  if (!bounds) return null;

  const id = asString(value.id, `imported-layer-${count.value}`, 140);
  const name = asString(value.name, "Camada importada", 140);
  const visible = typeof value.visible === "boolean" ? value.visible : true;
  const locked = typeof value.locked === "boolean" ? value.locked : false;
  const style = normalizeStyle(value.style);
  const children = Array.isArray(value.children)
    ? value.children.map((child) => normalizeLayer(child, canvas, count)).filter((child): child is TemplateLayer => Boolean(child))
    : [];

  if (value.type === "frame" || value.type === "group") {
    return { id, name, type: value.type, bounds, visible, locked, style, children };
  }

  if (value.type === "text") {
    return {
      id,
      name,
      type: "text",
      bounds,
      visible,
      locked,
      style,
      content: asString(value.content, "Texto importado"),
      textStyle: normalizeTextStyle(value.textStyle),
    };
  }

  if (value.type === "image") {
    return {
      id,
      name,
      type: "image",
      bounds,
      visible,
      locked,
      style,
      src: asString(value.src, "", 2400),
      alt: asString(value.alt, "Imagem importada", 240),
      fit: value.fit === "contain" ? "contain" : "cover",
    };
  }

  if (value.type === "shape") {
    return {
      id,
      name,
      type: "shape",
      bounds,
      visible,
      locked,
      style,
      shape: shapes.has(value.shape as ShapeKind) ? (value.shape as ShapeKind) : "rectangle",
    };
  }

  return null;
};

const normalizeTokens = (value: unknown): TemplateTokens => {
  if (!isRecord(value)) {
    return cloneTokens(defaultTemplateTokens);
  }

  const fallback = cloneTokens(defaultTemplateTokens);

  return {
    colors: normalizeStringRecord(value.colors, fallback.colors, 120),
    typography: normalizeTypographyTokens(value.typography, fallback.typography),
    spacing: normalizeNumberRecord(value.spacing, fallback.spacing, 0, 512),
    radii: normalizeNumberRecord(value.radii, fallback.radii, 0, 999),
    shadows: normalizeStringRecord(value.shadows, fallback.shadows, 240),
  };
};

export const parseTemplateImport = (value: unknown): TemplateImportResult => {
  if (!isRecord(value)) {
    return { ok: false, error: "O JSON precisa conter um objeto de template." };
  }

  const metadata = normalizeMetadata(value.metadata);
  const canvas = normalizeCanvas(value.canvas);

  if (!metadata || !canvas || !isRecord(value.tokens) || !Array.isArray(value.layers)) {
    return { ok: false, error: "O arquivo nao parece ser um template exportado pelo Design Model." };
  }

  const count = { value: 0 };
  const layers = value.layers
    .map((layer) => normalizeLayer(layer, canvas, count))
    .filter((layer): layer is TemplateLayer => Boolean(layer));

  return {
    ok: true,
    template: {
      metadata,
      canvas,
      tokens: normalizeTokens(value.tokens),
      layers,
    },
  };
};
