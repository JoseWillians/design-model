export type TemplateCategory =
  | "dashboard"
  | "catalog"
  | "landing"
  | "mobile"
  | "presentation"
  | "social";

export type TemplateStatus = "draft" | "published";

export type DevicePreset = "workspace" | "desktop" | "tablet" | "mobile" | "square" | "story" | "custom";

export type LayerType = "frame" | "group" | "text" | "shape" | "image";

export type ShapeKind = "rectangle" | "ellipse" | "line";

export type TextAlign = "left" | "center" | "right";

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800;

export type BlendMode = "normal" | "multiply" | "screen" | "overlay";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  status: TemplateStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCanvas {
  width: number;
  height: number;
  preset: DevicePreset;
  background: string;
  gridSize: number;
}

export interface TemplateTokens {
  colors: Record<string, string>;
  typography: Record<
    string,
    {
      fontFamily: string;
      fontSize: number;
      fontWeight: FontWeight;
      lineHeight: number;
      letterSpacing: number;
    }
  >;
  spacing: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, string>;
}

export interface LayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface LayerStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  radius?: number;
  shadow?: string;
  blendMode?: BlendMode;
}

export interface TextStyle {
  color: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing?: number;
  align?: TextAlign;
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  bounds: LayerBounds;
  visible: boolean;
  locked?: boolean;
  style?: LayerStyle;
  children?: TemplateLayer[];
}

export interface FrameLayer extends BaseLayer {
  type: "frame" | "group";
  children: TemplateLayer[];
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  textStyle: TextStyle;
}

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: ShapeKind;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  alt: string;
  fit?: "cover" | "contain";
}

export type TemplateLayer = FrameLayer | TextLayer | ShapeLayer | ImageLayer;

export interface TemplateDocument {
  metadata: TemplateMetadata;
  canvas: TemplateCanvas;
  tokens: TemplateTokens;
  layers: TemplateLayer[];
}

export interface TemplateCollection {
  version: number;
  templates: TemplateDocument[];
}

export interface ExportPayload {
  filename: string;
  mimeType: string;
  content: string;
}
