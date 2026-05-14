import type { ExportPayload, TemplateDocument, TemplateLayer, TemplateTokens } from "./templateTypes";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const toKebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .replace(/(^-|-$)/g, "");

const px = (value: number) => `${value}px`;

const layerToCss = (layer: TemplateLayer, depth = 0): string => {
  const selector = `.template-layer-${slugify(layer.id)}`;
  const indent = "  ".repeat(depth);
  const declarations = [
    "position: absolute",
    `left: ${px(layer.bounds.x)}`,
    `top: ${px(layer.bounds.y)}`,
    `width: ${px(layer.bounds.width)}`,
    `height: ${px(layer.bounds.height)}`,
    layer.bounds.rotation ? `transform: rotate(${layer.bounds.rotation}deg)` : undefined,
    layer.visible ? undefined : "display: none",
    layer.style?.fill ? `background: ${layer.style.fill}` : undefined,
    layer.style?.stroke ? `border: ${layer.style.strokeWidth ?? 1}px solid ${layer.style.stroke}` : undefined,
    layer.style?.radius ? `border-radius: ${px(layer.style.radius)}` : undefined,
    layer.style?.opacity !== undefined ? `opacity: ${layer.style.opacity}` : undefined,
    layer.style?.shadow ? `box-shadow: ${layer.style.shadow}` : undefined,
    layer.style?.blendMode ? `mix-blend-mode: ${layer.style.blendMode}` : undefined,
    layer.type === "text" ? `color: ${layer.textStyle.color}` : undefined,
    layer.type === "text" ? `font-family: ${layer.textStyle.fontFamily}` : undefined,
    layer.type === "text" ? `font-size: ${px(layer.textStyle.fontSize)}` : undefined,
    layer.type === "text" ? `font-weight: ${layer.textStyle.fontWeight}` : undefined,
    layer.type === "text" ? `line-height: ${layer.textStyle.lineHeight}` : undefined,
    layer.type === "text" ? `letter-spacing: ${px(layer.textStyle.letterSpacing ?? 0)}` : undefined,
    layer.type === "text" && layer.textStyle.align ? `text-align: ${layer.textStyle.align}` : undefined,
    layer.type === "image" ? `object-fit: ${layer.fit ?? "cover"}` : undefined,
  ].filter(Boolean);

  const css = `${indent}${selector} {\n${declarations.map((item) => `${indent}  ${item};`).join("\n")}\n${indent}}`;
  const childCss = layer.children?.map((child) => layerToCss(child, depth)).join("\n\n");

  return childCss ? `${css}\n\n${childCss}` : css;
};

const tokensToCss = (tokens: TemplateTokens): string => {
  const colorVars = Object.entries(tokens.colors).map(([key, value]) => `  --color-${toKebabCase(key)}: ${value};`);
  const spacingVars = Object.entries(tokens.spacing).map(([key, value]) => `  --space-${toKebabCase(key)}: ${px(value)};`);
  const radiusVars = Object.entries(tokens.radii).map(([key, value]) => `  --radius-${toKebabCase(key)}: ${px(value)};`);
  const shadowVars = Object.entries(tokens.shadows).map(([key, value]) => `  --shadow-${toKebabCase(key)}: ${value};`);
  const typographyVars = Object.entries(tokens.typography).flatMap(([key, value]) => [
    `  --font-${toKebabCase(key)}-family: ${value.fontFamily};`,
    `  --font-${toKebabCase(key)}-size: ${px(value.fontSize)};`,
    `  --font-${toKebabCase(key)}-weight: ${value.fontWeight};`,
    `  --font-${toKebabCase(key)}-line-height: ${value.lineHeight};`,
  ]);

  return [":root {", ...colorVars, ...spacingVars, ...radiusVars, ...shadowVars, ...typographyVars, "}"].join("\n");
};

export const exportTemplateAsJson = (template: TemplateDocument): ExportPayload => ({
  filename: `${slugify(template.metadata.name || template.metadata.id)}.json`,
  mimeType: "application/json",
  content: JSON.stringify(template, null, 2),
});

export const exportTemplateAsCss = (template: TemplateDocument): ExportPayload => {
  const rootClass = `.template-${slugify(template.metadata.id)}`;
  const rootCss = [
    `${rootClass} {`,
    "  position: relative;",
    `  width: ${px(template.canvas.width)};`,
    `  height: ${px(template.canvas.height)};`,
    `  background: ${template.canvas.background};`,
    "  overflow: hidden;",
    "}",
  ].join("\n");
  const layerCss = template.layers.map((layer) => layerToCss(layer)).join("\n\n");

  return {
    filename: `${slugify(template.metadata.name || template.metadata.id)}.css`,
    mimeType: "text/css",
    content: [tokensToCss(template.tokens), rootCss, layerCss].filter(Boolean).join("\n\n"),
  };
};

export const createDownloadUrl = (payload: ExportPayload): string => {
  const blob = new Blob([payload.content], { type: payload.mimeType });

  return URL.createObjectURL(blob);
};
