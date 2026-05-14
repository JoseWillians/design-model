import { defaultTemplateTokens } from "./templateSeed";
import type { DevicePreset, TemplateCanvas, TemplateCategory, TemplateDocument, TemplateTokens } from "./templateTypes";

export type BlankTemplatePreset = DevicePreset;

export interface BlankTemplateCanvasOptions extends Partial<Omit<TemplateCanvas, "preset">> {
  preset?: BlankTemplatePreset;
}

export interface CreateBlankTemplateOptions {
  id?: string;
  name?: string;
  description?: string;
  category?: TemplateCategory;
  tags?: string[];
  canvas?: BlankTemplateCanvasOptions;
  tokens?: TemplateTokens;
  createdAt?: string;
  updatedAt?: string;
}

const presetCanvasDefaults: Record<BlankTemplatePreset, TemplateCanvas> = {
  desktop: {
    width: 1440,
    height: 1024,
    preset: "desktop",
    background: defaultTemplateTokens.colors.canvas,
    gridSize: 8,
  },
  tablet: {
    width: 834,
    height: 1112,
    preset: "tablet",
    background: defaultTemplateTokens.colors.canvas,
    gridSize: 8,
  },
  mobile: {
    width: 390,
    height: 844,
    preset: "mobile",
    background: defaultTemplateTokens.colors.surface,
    gridSize: 4,
  },
  square: {
    width: 1080,
    height: 1080,
    preset: "square",
    background: defaultTemplateTokens.colors.surface,
    gridSize: 8,
  },
  story: {
    width: 1080,
    height: 1920,
    preset: "story",
    background: defaultTemplateTokens.colors.surface,
    gridSize: 8,
  },
};

const cloneTokens = (tokens: TemplateTokens): TemplateTokens => JSON.parse(JSON.stringify(tokens));

const createTemplateId = () => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `template-blank-${randomPart}`;
};

export const createBlankTemplateCanvas = (options: BlankTemplateCanvasOptions = {}): TemplateCanvas => {
  const preset = options.preset ?? "desktop";
  const defaults = presetCanvasDefaults[preset];

  return {
    ...defaults,
    ...options,
    preset,
  };
};

export const createBlankTemplate = (options: CreateBlankTemplateOptions = {}): TemplateDocument => {
  const timestamp = new Date().toISOString();
  const createdAt = options.createdAt ?? timestamp;
  const updatedAt = options.updatedAt ?? createdAt;

  return {
    metadata: {
      id: options.id ?? createTemplateId(),
      name: options.name ?? "Template em branco",
      description: options.description ?? "Base vazia para montar um template do zero.",
      category: options.category ?? "landing",
      status: "draft",
      tags: options.tags ?? ["branco", "personalizado"],
      createdAt,
      updatedAt,
    },
    canvas: createBlankTemplateCanvas(options.canvas),
    tokens: cloneTokens(options.tokens ?? defaultTemplateTokens),
    layers: [],
  };
};
