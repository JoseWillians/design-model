import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDown,
  ArrowUp,
  Bot,
  Box,
  BringToFront,
  Circle,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Image,
  LayoutDashboard,
  Lock,
  Maximize2,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCcw,
  SendToBack,
  Square,
  Trash2,
  Type,
  Unlock,
  Upload,
} from "lucide-react";
import { IconButton } from "./components/IconButton";
import { Panel } from "./components/Panel";
import { PropertyField } from "./components/PropertyField";
import { TemplateCard } from "./components/TemplateCard";
import { exportTemplateAsCss, exportTemplateAsJson, createDownloadUrl } from "./lib/exporters";
import {
  clampBounds,
  clampNumber,
  clampResizedBounds,
  moveBounds,
  resizeBounds,
  snapBounds,
  snapPositionBounds,
  type ResizeHandle,
} from "./lib/layerGeometry";
import {
  createBlankTemplate,
  createBlankTemplateCanvas,
  type BlankTemplatePreset,
} from "./lib/templateFactory";
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  importTemplateDocument,
  listTemplates,
  resetTemplates,
  updateTemplate,
} from "./lib/templateStore";
import type {
  FontWeight,
  DevicePreset,
  ShapeKind,
  TemplateDocument,
  LayerBounds,
  TemplateLayer,
  TextAlign,
} from "./lib/templateTypes";

const MIN_LAYER_SIZE = 16;
const CANVAS_MIN_SIZE = 160;
const CANVAS_MAX_SIZE = 8192;
const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CANVAS_PRESETS: Array<{ value: BlankTemplatePreset; label: string }> = [
  { value: "workspace", label: "Área livre" },
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
  { value: "square", label: "Square" },
  { value: "story", label: "Story" },
  { value: "custom", label: "Custom" },
];

type CanvasInteraction =
  | {
      mode: "move";
      layerId: string;
      startBounds: LayerBounds;
      startClientX: number;
      startClientY: number;
    }
  | {
      mode: "resize";
      layerId: string;
      handle: ResizeHandle;
      startBounds: LayerBounds;
      startClientX: number;
      startClientY: number;
    };

type LayerAlignment =
  | "left"
  | "center-horizontal"
  | "right"
  | "top"
  | "center-vertical"
  | "bottom";

type LayerOrderAction = "front" | "forward" | "backward" | "back";

type AgentLayerPatch = Partial<{
  name: string;
  visible: boolean;
  locked: boolean;
  bounds: Partial<LayerBounds>;
  style: TemplateLayer["style"];
  content: string;
  textStyle: Partial<Extract<TemplateLayer, { type: "text" }>["textStyle"]>;
  src: string;
  alt: string;
  fit: "cover" | "contain";
}>;

interface DesignModelAgentApi {
  version: string;
  getState: () => {
    templates: TemplateDocument[];
    selectedTemplate: TemplateDocument | undefined;
    selectedLayer: TemplateLayer | undefined;
    selectedLayerId: string;
    layers: TemplateLayer[];
  };
  selectTemplate: (templateId: string) => boolean;
  selectLayer: (layerId: string) => boolean;
  addLayer: (type: "text" | "rectangle" | "ellipse" | "image") => TemplateLayer | undefined;
  updateLayer: (layerId: string, patch: AgentLayerPatch) => boolean;
  alignLayer: (layerId: string, alignment: LayerAlignment) => boolean;
  updateCanvas: (patch: Partial<{ width: number; height: number; background: string; gridSize: number }>) => boolean;
  expandCanvas: () => boolean;
  exportCurrentTemplate: (kind?: "json" | "css") => string;
}

declare global {
  interface Window {
    designModelAgent?: DesignModelAgentApi;
  }
}

const createId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;

const getCanvasPresetFromSize = (width: number, height: number): DevicePreset => {
  if (width === 2560 && height === 1600) return "workspace";
  if (width === 1440 && height === 1024) return "desktop";
  if (width === 834 && height === 1112) return "tablet";
  if (width === 390 && height === 844) return "mobile";
  if (width === 1080 && height === 1080) return "square";
  if (width === 1080 && height === 1920) return "story";
  return "custom";
};

const flattenLayers = (layers: TemplateLayer[]): TemplateLayer[] =>
  layers.flatMap((layer) => [layer, ...(layer.children ? flattenLayers(layer.children) : [])]);

const findLayer = (layers: TemplateLayer[], layerId: string): TemplateLayer | undefined => {
  for (const layer of layers) {
    if (layer.id === layerId) return layer;
    const child = layer.children ? findLayer(layer.children, layerId) : undefined;
    if (child) return child;
  }

  return undefined;
};

const mapLayers = (
  layers: TemplateLayer[],
  layerId: string,
  mapper: (layer: TemplateLayer) => TemplateLayer,
): TemplateLayer[] =>
  layers.map((layer) => {
    if (layer.id === layerId) return mapper(layer);
    if (!layer.children) return layer;

    return {
      ...layer,
      children: mapLayers(layer.children, layerId, mapper),
    } as TemplateLayer;
  });

const removeLayer = (layers: TemplateLayer[], layerId: string): TemplateLayer[] =>
  layers
    .filter((layer) => layer.id !== layerId)
    .map((layer) =>
      layer.children
        ? ({
            ...layer,
            children: removeLayer(layer.children, layerId),
          } as TemplateLayer)
        : layer,
    );

const reorderLayer = (
  layers: TemplateLayer[],
  layerId: string,
  action: LayerOrderAction,
): { layers: TemplateLayer[]; moved: boolean } => {
  const index = layers.findIndex((layer) => layer.id === layerId);

  if (index >= 0) {
    const nextLayers = [...layers];
    const [layer] = nextLayers.splice(index, 1);
    const nextIndex =
      action === "front"
        ? nextLayers.length
        : action === "back"
          ? 0
          : action === "forward"
            ? Math.min(index + 1, nextLayers.length)
            : Math.max(index - 1, 0);

    nextLayers.splice(nextIndex, 0, layer);
    return { layers: nextLayers, moved: nextIndex !== index };
  }

  let moved = false;
  const nextLayers = layers.map((layer) => {
    if (!layer.children || moved) return layer;
    const result = reorderLayer(layer.children, layerId, action);
    moved = result.moved;

    return moved ? ({ ...layer, children: result.layers } as TemplateLayer) : layer;
  });

  return { layers: nextLayers, moved };
};

const cloneLayer = (layer: TemplateLayer): TemplateLayer => JSON.parse(JSON.stringify(layer));

const createLayer = (type: "text" | "rectangle" | "ellipse" | "image"): TemplateLayer => {
  const base = {
    id: createId(type),
    visible: true,
    bounds: { x: 96, y: 96, width: 260, height: type === "text" ? 72 : 160 },
  };

  if (type === "text") {
    return {
      ...base,
      name: "Texto",
      type: "text",
      content: "Novo texto",
      textStyle: {
        color: "#172033",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1.18,
        letterSpacing: 0,
        align: "left",
      },
    };
  }

  if (type === "image") {
    return {
      ...base,
      name: "Imagem",
      type: "image",
      src: "",
      alt: "Area reservada para imagem",
      fit: "cover",
      style: { fill: "#dbeafe", radius: 8, stroke: "#93c5fd", strokeWidth: 1 },
    };
  }

  return {
    ...base,
    name: type === "ellipse" ? "Elipse" : "Retangulo",
    type: "shape",
    shape: type as ShapeKind,
    style: { fill: type === "ellipse" ? "#fef3c7" : "#ffffff", radius: type === "ellipse" ? 999 : 8, shadow: "0 1px 3px rgba(23, 32, 51, 0.16)" },
  };
};

const layerIcon = (layer: TemplateLayer) => {
  if (layer.type === "text") return <Type size={15} />;
  if (layer.type === "image") return <Image size={15} />;
  if (layer.type === "frame" || layer.type === "group") return <LayoutDashboard size={15} />;
  if (layer.type !== "shape") return <Square size={15} />;
  if (layer.shape === "ellipse") return <Circle size={15} />;
  return <Square size={15} />;
};

const updateLayerField = <T extends TemplateLayer>(
  layer: TemplateLayer,
  patch: Partial<T>,
): TemplateLayer => ({ ...layer, ...patch } as TemplateLayer);

const isEditableShortcutTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();

  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
};

function App() {
  const [templates, setTemplates] = useState<TemplateDocument[]>(() => listTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templates[0]?.metadata.id ?? "");
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [zoom, setZoom] = useState(0.64);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [blankPreset, setBlankPreset] = useState<BlankTemplatePreset>("workspace");
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [notice, setNotice] = useState("Sessão pronta para criar.");
  const [interaction, setInteraction] = useState<CanvasInteraction | null>(null);
  const [previewBoundsByLayerId, setPreviewBoundsByLayerId] = useState<Record<string, LayerBounds>>({});
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const suppressLayerClickRef = useRef(false);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.metadata.id === selectedTemplateId) ?? templates[0],
    [templates, selectedTemplateId],
  );
  const layers = useMemo(
    () => (selectedTemplate ? flattenLayers(selectedTemplate.layers) : []),
    [selectedTemplate],
  );
  const selectedLayer = selectedTemplate && selectedLayerId ? findLayer(selectedTemplate.layers, selectedLayerId) : undefined;

  useEffect(() => {
    if (!selectedTemplate && templates[0]) {
      setSelectedTemplateId(templates[0].metadata.id);
    }
  }, [selectedTemplate, templates]);

  const syncTemplate = (template: TemplateDocument) => {
    const saved = updateTemplate(template.metadata.id, template);
    if (!saved) return;
    setTemplates(listTemplates());
  };

  const patchLayer = (layerId: string, mapper: (layer: TemplateLayer) => TemplateLayer) => {
    if (!selectedTemplate) return;
    const nextTemplate = {
      ...selectedTemplate,
      layers: mapLayers(selectedTemplate.layers, layerId, mapper),
    };
    syncTemplate(nextTemplate);
  };

  const patchLayerInTemplate = (
    template: TemplateDocument,
    layerId: string,
    mapper: (layer: TemplateLayer) => TemplateLayer,
  ) => {
    const saved = updateTemplate(template.metadata.id, {
      ...template,
      layers: mapLayers(template.layers, layerId, mapper),
    });

    if (!saved) return false;
    setTemplates(listTemplates());
    return true;
  };

  const clampLayerTreeToCanvas = (layersToClamp: TemplateLayer[], canvas: TemplateDocument["canvas"]): TemplateLayer[] =>
    layersToClamp.map((layer) => ({
      ...layer,
      bounds: clampBounds(layer.bounds, {
        canvas,
        minWidth: MIN_LAYER_SIZE,
        minHeight: MIN_LAYER_SIZE,
      }),
      children: layer.children ? clampLayerTreeToCanvas(layer.children, canvas) : layer.children,
    }) as TemplateLayer);

  const clampLayerBounds = (bounds: LayerBounds) => {
    if (!selectedTemplate) return bounds;

    return clampBounds(bounds, {
      canvas: selectedTemplate.canvas,
      minWidth: MIN_LAYER_SIZE,
      minHeight: MIN_LAYER_SIZE,
    });
  };

  const commitLayerBounds = (layerId: string, bounds: LayerBounds) => {
    patchLayer(layerId, (layer) => ({
      ...layer,
      bounds: clampLayerBounds(bounds),
    }));
  };

  useEffect(() => {
    if (!interaction || !selectedTemplate) return;

    const getNextBounds = (event: PointerEvent) => {
      const delta = {
        dx: (event.clientX - interaction.startClientX) / zoom,
        dy: (event.clientY - interaction.startClientY) / zoom,
      };
      const rawBounds =
        interaction.mode === "move"
          ? moveBounds(interaction.startBounds, delta)
          : resizeBounds(interaction.startBounds, interaction.handle, delta, {
              minWidth: MIN_LAYER_SIZE,
              minHeight: MIN_LAYER_SIZE,
            });
      const adjustedBounds =
        interaction.mode === "move"
          ? snapEnabled
            ? snapPositionBounds(rawBounds, selectedTemplate.canvas.gridSize)
            : rawBounds
          : snapEnabled
            ? snapBounds(rawBounds, selectedTemplate.canvas.gridSize)
            : rawBounds;

      if (interaction.mode === "resize") {
        return clampResizedBounds(interaction.startBounds, adjustedBounds, interaction.handle, {
          canvas: selectedTemplate.canvas,
          minWidth: MIN_LAYER_SIZE,
          minHeight: MIN_LAYER_SIZE,
        });
      }

      return clampBounds(adjustedBounds, {
        canvas: selectedTemplate.canvas,
        minWidth: MIN_LAYER_SIZE,
        minHeight: MIN_LAYER_SIZE,
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const nextBounds = getNextBounds(event);

      setPreviewBoundsByLayerId((current) => ({
        ...current,
        [interaction.layerId]: nextBounds,
      }));
    };

    const finishInteraction = (event: PointerEvent) => {
      const nextBounds = getNextBounds(event);

      commitLayerBounds(interaction.layerId, nextBounds);
      setSelectedLayerId(interaction.layerId);
      setPreviewBoundsByLayerId((current) => {
        const { [interaction.layerId]: _removed, ...rest } = current;
        return rest;
      });
      suppressLayerClickRef.current = true;
      window.setTimeout(() => {
        suppressLayerClickRef.current = false;
      }, 120);
      setInteraction(null);
      setNotice(interaction.mode === "move" ? "Camada reposicionada." : "Camada redimensionada.");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishInteraction, { once: true });
    window.addEventListener("pointercancel", finishInteraction, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishInteraction);
      window.removeEventListener("pointercancel", finishInteraction);
    };
  }, [interaction, selectedTemplate, snapEnabled, zoom]);

  const addLayer = (type: "text" | "rectangle" | "ellipse" | "image") => {
    if (!selectedTemplate) return;
    const layer = createLayer(type);
    const nextTemplate = {
      ...selectedTemplate,
      layers: [...selectedTemplate.layers, layer],
    };
    syncTemplate(nextTemplate);
    setSelectedLayerId(layer.id);
    setNotice("Camada adicionada ao canvas.");
    return layer;
  };

  const duplicateSelectedLayer = () => {
    if (!selectedTemplate || !selectedLayer) return;
    const duplicate = cloneLayer(selectedLayer);
    duplicate.id = createId("layer");
    duplicate.name = `${selectedLayer.name} copia`;
    duplicate.bounds = {
      ...selectedLayer.bounds,
      x: selectedLayer.bounds.x + selectedTemplate.canvas.gridSize * 2,
      y: selectedLayer.bounds.y + selectedTemplate.canvas.gridSize * 2,
    };
    const nextTemplate = {
      ...selectedTemplate,
      layers: [...selectedTemplate.layers, duplicate],
    };
    syncTemplate(nextTemplate);
    setSelectedLayerId(duplicate.id);
    setNotice("Camada duplicada.");
  };

  const deleteSelectedLayer = () => {
    if (!selectedTemplate || !selectedLayer) return;

    if (selectedLayer.locked) {
      setNotice("Desbloqueie a camada antes de excluir.");
      return;
    }

    const nextTemplate = {
      ...selectedTemplate,
      layers: removeLayer(selectedTemplate.layers, selectedLayer.id),
    };
    syncTemplate(nextTemplate);
    setSelectedLayerId("");
    setNotice("Camada removida.");
  };

  const toggleLayerLock = (layer: TemplateLayer) => {
    patchLayer(layer.id, (item) => ({ ...item, locked: !item.locked }));
    setNotice(layer.locked ? "Camada desbloqueada." : "Camada bloqueada.");
  };

  const updateSelectedLayerStyle = (stylePatch: TemplateLayer["style"]) => {
    if (!selectedLayer || selectedLayer.locked) return;

    patchLayer(selectedLayer.id, (layer) => ({
      ...layer,
      style: { ...layer.style, ...stylePatch },
    }));
  };

  const reorderSelectedLayer = (action: LayerOrderAction) => {
    if (!selectedTemplate || !selectedLayer) return;

    const result = reorderLayer(selectedTemplate.layers, selectedLayer.id, action);

    if (!result.moved) {
      setNotice("A camada já está nessa posição.");
      return;
    }

    syncTemplate({
      ...selectedTemplate,
      layers: result.layers,
    });
    setNotice("Ordem da camada atualizada.");
  };

  const alignSelectedLayer = (alignment: LayerAlignment, layerId = selectedLayer?.id) => {
    if (!selectedTemplate || !layerId) return false;
    const layer = findLayer(selectedTemplate.layers, layerId);

    if (!layer || layer.locked) {
      setNotice("Desbloqueie a camada antes de alinhar.");
      return false;
    }

    const nextBounds = { ...layer.bounds };

    if (alignment === "left") nextBounds.x = 0;
    if (alignment === "center-horizontal") nextBounds.x = (selectedTemplate.canvas.width - layer.bounds.width) / 2;
    if (alignment === "right") nextBounds.x = selectedTemplate.canvas.width - layer.bounds.width;
    if (alignment === "top") nextBounds.y = 0;
    if (alignment === "center-vertical") nextBounds.y = (selectedTemplate.canvas.height - layer.bounds.height) / 2;
    if (alignment === "bottom") nextBounds.y = selectedTemplate.canvas.height - layer.bounds.height;

    patchLayer(layer.id, (item) => ({
      ...item,
      bounds: clampLayerBounds(nextBounds),
    }));
    setSelectedLayerId(layer.id);
    setNotice("Camada alinhada ao canvas.");
    return true;
  };

  const alignLayerFromAgent = (layerId: string, alignment: LayerAlignment) => {
    const sourceTemplate =
      listTemplates().find((template) => template.metadata.id === (selectedTemplate?.metadata.id ?? selectedTemplateId)) ??
      selectedTemplate;
    if (!sourceTemplate) return false;
    const layer = findLayer(sourceTemplate.layers, layerId);

    if (!layer || layer.locked) return false;

    const nextBounds = { ...layer.bounds };

    if (alignment === "left") nextBounds.x = 0;
    if (alignment === "center-horizontal") nextBounds.x = (sourceTemplate.canvas.width - layer.bounds.width) / 2;
    if (alignment === "right") nextBounds.x = sourceTemplate.canvas.width - layer.bounds.width;
    if (alignment === "top") nextBounds.y = 0;
    if (alignment === "center-vertical") nextBounds.y = (sourceTemplate.canvas.height - layer.bounds.height) / 2;
    if (alignment === "bottom") nextBounds.y = sourceTemplate.canvas.height - layer.bounds.height;

    const patched = patchLayerInTemplate(sourceTemplate, layer.id, (item) => ({
      ...item,
      bounds: clampBounds(nextBounds, {
        canvas: sourceTemplate.canvas,
        minWidth: MIN_LAYER_SIZE,
        minHeight: MIN_LAYER_SIZE,
      }),
    }));

    if (patched) {
      setSelectedLayerId(layer.id);
      setNotice("Camada alinhada pela API local.");
    }

    return patched;
  };

  const duplicateCurrentTemplate = () => {
    if (!selectedTemplate) return;
    const duplicate = duplicateTemplate(selectedTemplate.metadata.id);
    if (!duplicate) return;
    setTemplates(listTemplates());
    setSelectedTemplateId(duplicate.metadata.id);
    setSelectedLayerId("");
    setNotice("Template duplicado.");
  };

  const createBlankTemplateFromScratch = () => {
    const blankTemplate = createTemplate(createBlankTemplate({ canvas: { preset: blankPreset } }));
    setTemplates(listTemplates());
    setSelectedTemplateId(blankTemplate.metadata.id);
    setSelectedLayerId("");
    setNotice("Template em branco criado. Adicione camadas para começar.");
  };

  const expandCurrentCanvasToWorkspace = () => {
    if (!selectedTemplate) return;
    const canvas = createBlankTemplateCanvas({
      preset: "workspace",
      background: selectedTemplate.canvas.background,
      gridSize: selectedTemplate.canvas.gridSize,
    });

    syncTemplate({
      ...selectedTemplate,
      canvas,
      layers: clampLayerTreeToCanvas(selectedTemplate.layers, canvas),
    });
    setZoom((current) => Math.min(current, 0.42));
    setNotice("Canvas expandido para área livre 2560x1600.");
  };

  const fitCanvasToView = () => {
    if (!selectedTemplate || !canvasScrollRef.current) return;
    const viewport = canvasScrollRef.current.getBoundingClientRect();
    const nextZoom = clampNumber(
      Math.min((viewport.width - 80) / selectedTemplate.canvas.width, (viewport.height - 80) / selectedTemplate.canvas.height),
      0.08,
      1.25,
    );

    setZoom(Number(nextZoom.toFixed(2)));
    setNotice("Canvas enquadrado na área visível.");
  };

  const updateCanvasPreset = (preset: DevicePreset) => {
    if (!selectedTemplate) return;

    if (preset === "custom") {
      syncTemplate({
        ...selectedTemplate,
        canvas: {
          ...selectedTemplate.canvas,
          preset: "custom",
        },
      });
      setNotice("Canvas customizado ativado. Ajuste largura e altura.");
      return;
    }

    const canvas = createBlankTemplateCanvas({
      preset,
      background: selectedTemplate.canvas.background,
      gridSize: selectedTemplate.canvas.gridSize,
    });

    syncTemplate({
      ...selectedTemplate,
      canvas,
      layers: clampLayerTreeToCanvas(selectedTemplate.layers, canvas),
    });
    setNotice(`Canvas atualizado para ${preset}.`);
  };

  const updateCanvasSize = (field: "width" | "height", value: number) => {
    if (!selectedTemplate) return;
    const rawValue = Number.isFinite(value) ? value : selectedTemplate.canvas[field];
    const nextValue = Math.round(clampNumber(rawValue, CANVAS_MIN_SIZE, CANVAS_MAX_SIZE));
    const wasClamped = rawValue !== nextValue;
    const canvas = {
      ...selectedTemplate.canvas,
      [field]: nextValue,
    };
    const nextCanvas = {
      ...canvas,
      preset: getCanvasPresetFromSize(canvas.width, canvas.height),
    };

    syncTemplate({
      ...selectedTemplate,
      canvas: nextCanvas,
      layers: clampLayerTreeToCanvas(selectedTemplate.layers, nextCanvas),
    });
    setNotice(
      wasClamped
        ? `Canvas limitado entre ${CANVAS_MIN_SIZE}px e ${CANVAS_MAX_SIZE}px.`
        : `Canvas ajustado para ${nextCanvas.width}x${nextCanvas.height}.`,
    );
  };

  const updateCanvasSettings = (
    patch: Partial<{ width: number; height: number; background: string; gridSize: number }>,
  ) => {
    if (!selectedTemplate) return false;

    const width = Math.round(
      clampNumber(
        Number.isFinite(patch.width) ? Number(patch.width) : selectedTemplate.canvas.width,
        CANVAS_MIN_SIZE,
        CANVAS_MAX_SIZE,
      ),
    );
    const height = Math.round(
      clampNumber(
        Number.isFinite(patch.height) ? Number(patch.height) : selectedTemplate.canvas.height,
        CANVAS_MIN_SIZE,
        CANVAS_MAX_SIZE,
      ),
    );
    const gridSize = Math.round(
      clampNumber(
        Number.isFinite(patch.gridSize) ? Number(patch.gridSize) : selectedTemplate.canvas.gridSize,
        2,
        64,
      ),
    );
    const canvas = {
      ...selectedTemplate.canvas,
      width,
      height,
      gridSize,
      background: typeof patch.background === "string" ? patch.background.slice(0, 80) : selectedTemplate.canvas.background,
      preset: getCanvasPresetFromSize(width, height),
    };

    syncTemplate({
      ...selectedTemplate,
      canvas,
      layers: clampLayerTreeToCanvas(selectedTemplate.layers, canvas),
    });
    setNotice(`Canvas atualizado para ${canvas.width}x${canvas.height}.`);
    return true;
  };

  const importTemplateFromFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const result = importTemplateDocument(parsed);

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setTemplates(listTemplates());
      setSelectedTemplateId(result.template.metadata.id);
      setSelectedLayerId("");
      setNotice(`Template importado: ${result.template.metadata.name}.`);
    } catch {
      setNotice("Nao foi possivel ler este JSON.");
    }
  };

  const removeCurrentTemplate = () => {
    if (!selectedTemplate || templates.length <= 1) return;
    const removed = deleteTemplate(selectedTemplate.metadata.id);
    if (!removed) return;
    const nextTemplates = listTemplates();
    setTemplates(nextTemplates);
    setSelectedTemplateId(nextTemplates[0]?.metadata.id ?? "");
    setSelectedLayerId("");
    setNotice("Template excluido.");
  };

  const resetAllTemplates = () => {
    const confirmed = window.confirm("Resetar templates locais e voltar aos exemplos iniciais?");
    if (!confirmed) return;
    const collection = resetTemplates();
    setTemplates(collection.templates);
    setSelectedTemplateId(collection.templates[0]?.metadata.id ?? "");
    setSelectedLayerId("");
    setNotice("Templates restaurados.");
  };

  const downloadPayload = (kind: "json" | "css") => {
    if (!selectedTemplate) return;
    const payload = kind === "json" ? exportTemplateAsJson(selectedTemplate) : exportTemplateAsCss(selectedTemplate);
    const url = createDownloadUrl(payload);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`Exportado: ${payload.filename}`);
  };

  const updateBounds = (field: keyof TemplateLayer["bounds"], value: number) => {
    if (!selectedLayer || !selectedTemplate) return;
    if (selectedLayer.locked) return;
    const nextBounds = clampBounds(
      { ...selectedLayer.bounds, [field]: Number.isFinite(value) ? value : 0 },
      {
        canvas: selectedTemplate.canvas,
        minWidth: MIN_LAYER_SIZE,
        minHeight: MIN_LAYER_SIZE,
      },
    );

    patchLayer(selectedLayer.id, (layer) => ({
      ...layer,
      bounds: nextBounds,
    }));
  };

  const updateLayerFromAgent = (layerId: string, patch: AgentLayerPatch) => {
    const sourceTemplate =
      listTemplates().find((template) => template.metadata.id === (selectedTemplate?.metadata.id ?? selectedTemplateId)) ??
      selectedTemplate;
    if (!sourceTemplate) return false;
    const layer = findLayer(sourceTemplate.layers, layerId);

    if (!layer) return false;

    if (layer.locked && patch.locked !== false) {
      setNotice("A API local não alterou uma camada bloqueada.");
      return false;
    }

    const patched = patchLayerInTemplate(sourceTemplate, layerId, (item) => {
      const nextBounds = patch.bounds
        ? clampBounds(
            {
              ...item.bounds,
              ...patch.bounds,
            },
            {
              canvas: sourceTemplate.canvas,
              minWidth: MIN_LAYER_SIZE,
              minHeight: MIN_LAYER_SIZE,
            },
          )
        : item.bounds;
      const base = {
        ...item,
        name: typeof patch.name === "string" ? patch.name.slice(0, 140) : item.name,
        visible: typeof patch.visible === "boolean" ? patch.visible : item.visible,
        locked: typeof patch.locked === "boolean" ? patch.locked : item.locked,
        bounds: nextBounds,
        style: patch.style ? { ...item.style, ...patch.style } : item.style,
      };

      if (item.type === "text") {
        return {
          ...base,
          content: typeof patch.content === "string" ? patch.content.slice(0, 1200) : item.content,
          textStyle: patch.textStyle ? { ...item.textStyle, ...patch.textStyle } : item.textStyle,
        };
      }

      if (item.type === "image") {
        return {
          ...base,
          src: typeof patch.src === "string" ? patch.src.slice(0, 2400) : item.src,
          alt: typeof patch.alt === "string" ? patch.alt.slice(0, 240) : item.alt,
          fit: patch.fit === "contain" || patch.fit === "cover" ? patch.fit : item.fit,
        };
      }

      return base as TemplateLayer;
    });

    if (!patched) return false;
    setSelectedLayerId(layerId);
    setNotice("Camada atualizada pela API local.");
    return true;
  };

  const handleLayerKeyboard = (event: KeyboardEvent<HTMLDivElement>, layer: TemplateLayer) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedLayerId(layer.id);
      return;
    }

    if (!selectedTemplate || layer.locked || !event.key.startsWith("Arrow")) return;

    const step = snapEnabled
      ? event.shiftKey
        ? selectedTemplate.canvas.gridSize * 4
        : selectedTemplate.canvas.gridSize
      : event.shiftKey
        ? 10
        : 1;
    const delta = {
      dx: event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0,
      dy: event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0,
    };

    event.preventDefault();
    setSelectedLayerId(layer.id);
    const movedBounds = moveBounds(layer.bounds, delta);
    const adjustedBounds = snapEnabled ? snapPositionBounds(movedBounds, selectedTemplate.canvas.gridSize) : movedBounds;

    commitLayerBounds(layer.id, adjustedBounds);
    setNotice("Camada movida pelo teclado.");
  };

  const startCanvasInteraction = (
    event: ReactPointerEvent<HTMLElement>,
    layer: TemplateLayer,
    mode: "move" | "resize",
    handle?: ResizeHandle,
  ) => {
    if (event.button !== 0 || layer.locked) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedLayerId(layer.id);
    setInteraction(
      mode === "move"
        ? {
            mode,
            layerId: layer.id,
            startBounds: layer.bounds,
            startClientX: event.clientX,
            startClientY: event.clientY,
          }
        : {
            mode,
            handle: handle ?? "se",
            layerId: layer.id,
            startBounds: layer.bounds,
            startClientX: event.clientX,
            startClientY: event.clientY,
          },
    );
  };

  const selectLayerFromClick = (event: ReactMouseEvent<HTMLDivElement>, layerId: string) => {
    event.stopPropagation();

    if (suppressLayerClickRef.current) {
      return;
    }

    setSelectedLayerId(layerId);
  };

  useEffect(() => {
    const handleShortcuts = (event: globalThis.KeyboardEvent) => {
      if (isEditableShortcutTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "d" && selectedLayer) {
        event.preventDefault();
        duplicateSelectedLayer();
        return;
      }

      if (!event.ctrlKey && !event.metaKey && key === "delete" && selectedLayer) {
        event.preventDefault();
        deleteSelectedLayer();
        return;
      }

      if (!event.ctrlKey && !event.metaKey && key === "s") {
        event.preventDefault();
        setSnapEnabled((current) => {
          setNotice(current ? "Snap na grade desativado." : "Snap na grade ativado.");
          return !current;
        });
        return;
      }

      if (!event.ctrlKey && !event.metaKey && key === "l" && selectedLayer) {
        event.preventDefault();
        toggleLayerLock(selectedLayer);
      }
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [selectedLayer, selectedTemplate, snapEnabled]);

  useEffect(() => {
    window.designModelAgent = {
      version: "0.2.0",
      getState: () => ({
        templates,
        selectedTemplate,
        selectedLayer,
        selectedLayerId,
        layers,
      }),
      selectTemplate: (templateId: string) => {
        const exists = templates.some((template) => template.metadata.id === templateId);
        if (!exists) return false;
        setSelectedTemplateId(templateId);
        setSelectedLayerId("");
        setNotice("Template selecionado pela API local.");
        return true;
      },
      selectLayer: (layerId: string) => {
        if (!selectedTemplate || !findLayer(selectedTemplate.layers, layerId)) return false;
        setSelectedLayerId(layerId);
        setNotice("Camada selecionada pela API local.");
        return true;
      },
      addLayer,
      updateLayer: updateLayerFromAgent,
      alignLayer: alignLayerFromAgent,
      updateCanvas: updateCanvasSettings,
      expandCanvas: () => {
        const sourceTemplate =
          listTemplates().find((template) => template.metadata.id === (selectedTemplate?.metadata.id ?? selectedTemplateId)) ??
          selectedTemplate;
        if (!sourceTemplate) return false;
        const canvas = createBlankTemplateCanvas({
          preset: "workspace",
          background: sourceTemplate.canvas.background,
          gridSize: sourceTemplate.canvas.gridSize,
        });
        const saved = updateTemplate(sourceTemplate.metadata.id, {
          ...sourceTemplate,
          canvas,
          layers: clampLayerTreeToCanvas(sourceTemplate.layers, canvas),
        });
        if (!saved) return false;
        setTemplates(listTemplates());
        setNotice("Canvas expandido pela API local.");
        return true;
      },
      exportCurrentTemplate: (kind: "json" | "css" = "json") => {
        const currentTemplate =
          listTemplates().find((template) => template.metadata.id === (selectedTemplate?.metadata.id ?? selectedTemplateId)) ??
          selectedTemplate;
        if (!currentTemplate) return "";
        return kind === "json" ? exportTemplateAsJson(currentTemplate).content : exportTemplateAsCss(currentTemplate).content;
      },
    };

    return () => {
      delete window.designModelAgent;
    };
  }, [templates, selectedTemplate, selectedLayer, selectedLayerId, layers, snapEnabled]);

  const renderLayer = (layer: TemplateLayer): JSX.Element | null => {
    if (!layer.visible) return null;
    const isSelected = layer.id === selectedLayerId;
    const effectiveBounds = previewBoundsByLayerId[layer.id] ?? layer.bounds;
    const layerClassName = ["canvas-layer", isSelected ? "canvas-layer--selected" : "", interaction?.layerId === layer.id ? "canvas-layer--dragging" : ""]
      .filter(Boolean)
      .join(" ");
    const baseStyle: CSSProperties = {
      position: "absolute",
      left: effectiveBounds.x,
      top: effectiveBounds.y,
      width: effectiveBounds.width,
      height: effectiveBounds.height,
      transform: effectiveBounds.rotation ? `rotate(${effectiveBounds.rotation}deg)` : undefined,
      opacity: layer.style?.opacity,
      mixBlendMode: layer.style?.blendMode,
      boxShadow: layer.style?.shadow,
      borderRadius: layer.style?.radius,
    };

    if (layer.type === "text") {
      return (
        <div
          aria-label={`Selecionar camada ${layer.name}`}
          aria-disabled={layer.locked ? true : undefined}
          className={`${layerClassName} canvas-layer--text`}
          key={layer.id}
          onClick={(event) => selectLayerFromClick(event, layer.id)}
          onKeyDown={(event) => handleLayerKeyboard(event, layer)}
          onPointerDown={(event) => startCanvasInteraction(event, layer, "move")}
          role="button"
          style={{
            ...baseStyle,
            color: layer.textStyle.color,
            fontFamily: layer.textStyle.fontFamily,
            fontSize: layer.textStyle.fontSize,
            fontWeight: layer.textStyle.fontWeight,
            lineHeight: layer.textStyle.lineHeight,
            letterSpacing: layer.textStyle.letterSpacing,
            textAlign: layer.textStyle.align,
          }}
          tabIndex={0}
        >
          {layer.content}
        </div>
      );
    }

    if (layer.type === "image") {
      return (
        <div
          aria-label={`Selecionar camada ${layer.name}`}
          aria-disabled={layer.locked ? true : undefined}
          className={`${layerClassName} canvas-layer--image`}
          key={layer.id}
          onClick={(event) => selectLayerFromClick(event, layer.id)}
          onKeyDown={(event) => handleLayerKeyboard(event, layer)}
          onPointerDown={(event) => startCanvasInteraction(event, layer, "move")}
          role="button"
          style={{
            ...baseStyle,
            background: layer.style?.fill,
            border: `${layer.style?.strokeWidth ?? 1}px solid ${layer.style?.stroke ?? "transparent"}`,
          }}
          tabIndex={0}
        >
          {layer.src ? <img alt={layer.alt} src={layer.src} style={{ objectFit: layer.fit ?? "cover" }} /> : <Image aria-hidden="true" size={32} />}
        </div>
      );
    }

    const layerStyle: CSSProperties = {
      ...baseStyle,
      background: layer.style?.fill,
      border: layer.style?.stroke ? `${layer.style.strokeWidth ?? 1}px solid ${layer.style.stroke}` : undefined,
      borderRadius: layer.type === "shape" && layer.shape === "ellipse" ? "999px" : layer.style?.radius,
    };

    return (
      <div
        aria-label={`Selecionar camada ${layer.name}`}
        aria-disabled={layer.locked ? true : undefined}
        className={layerClassName}
        key={layer.id}
        onClick={(event) => selectLayerFromClick(event, layer.id)}
        onKeyDown={(event) => handleLayerKeyboard(event, layer)}
        onPointerDown={(event) => startCanvasInteraction(event, layer, "move")}
        role="button"
        style={layerStyle}
        tabIndex={0}
      >
        {layer.children?.map(renderLayer)}
      </div>
    );
  };

  const renderSelectionOverlay = () => {
    if (!selectedLayer || selectedLayer.locked) return null;
    const bounds = previewBoundsByLayerId[selectedLayer.id] ?? selectedLayer.bounds;

    return (
      <div
        aria-hidden="true"
        className="selection-overlay"
        style={{
          left: bounds.x,
          top: bounds.y,
          width: bounds.width,
          height: bounds.height,
        }}
      >
        {RESIZE_HANDLES.map((handle) => (
          <span
            className={`resize-handle resize-handle--${handle}`}
            key={handle}
            onPointerDown={(event) => startCanvasInteraction(event, selectedLayer, "resize", handle)}
          />
        ))}
      </div>
    );
  };

  if (!selectedTemplate) {
    return (
      <main className="empty-app">
        <h1>Design Model</h1>
        <p>Nenhum template disponivel.</p>
        <button className="button button--primary" onClick={resetAllTemplates} type="button">
          Restaurar exemplos
        </button>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Design Model</p>
          <h1>Editor de templates visuais</h1>
        </div>

        <div className="topbar__actions" aria-label="Acoes do projeto">
          <input
            accept="application/json,.json"
            hidden
            onChange={importTemplateFromFile}
            ref={importFileInputRef}
            type="file"
          />
          <span className="agent-api-pill" title="Agentes podem usar window.designModelAgent no navegador">
            <Bot size={16} />
            API IA local
          </span>
          <button className="button" onClick={duplicateCurrentTemplate} type="button">
            <Copy size={16} />
            Duplicar
          </button>
          <button className="button" disabled={templates.length <= 1} onClick={removeCurrentTemplate} type="button">
            <Trash2 size={16} />
            Excluir
          </button>
          <button className="button" onClick={resetAllTemplates} type="button">
            <RefreshCcw size={16} />
            Reset
          </button>
          <button className="button" onClick={() => importFileInputRef.current?.click()} type="button">
            <Upload size={16} />
            Importar
          </button>
          <button className="button button--primary" onClick={() => downloadPayload("json")} type="button">
            <FileJson size={16} />
            JSON
          </button>
          <button className="button button--primary" onClick={() => downloadPayload("css")} type="button">
            <Download size={16} />
            CSS
          </button>
        </div>
      </header>

      <section className={`workspace ${leftSidebarCollapsed ? "workspace--left-collapsed" : ""}`} aria-label="Area de trabalho">
        <aside
          className={`sidebar sidebar--left ${leftSidebarCollapsed ? "sidebar--left-collapsed" : ""}`}
          id="left-sidebar"
          aria-label="Templates e ferramentas"
        >
          <button
            aria-label={leftSidebarCollapsed ? "Abrir sidebar de templates" : "Recolher sidebar de templates"}
            aria-controls="left-sidebar"
            aria-expanded={!leftSidebarCollapsed}
            className={`sidebar-collapse ${leftSidebarCollapsed ? "sidebar-collapse--rail" : ""}`}
            onClick={() => setLeftSidebarCollapsed((current) => !current)}
            type="button"
          >
            {leftSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span>{leftSidebarCollapsed ? "Abrir" : "Recolher"}</span>
          </button>

          {leftSidebarCollapsed ? null : (
            <>
              <Panel
            actions={
              <div className="new-template-controls">
                <label className="visually-hidden" htmlFor="blank-preset">
                  Preset do novo template
                </label>
                <select
                  className="compact-select"
                  id="blank-preset"
                  onChange={(event) => setBlankPreset(event.target.value as BlankTemplatePreset)}
                  value={blankPreset}
                >
                  {CANVAS_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <button className="button button--compact" onClick={createBlankTemplateFromScratch} type="button">
                  <Plus size={15} />
                  Novo em branco
                </button>
              </div>
            }
            title="Templates"
            description="Escolha uma base ou comece do zero."
          >
            <div className="template-list">
              {templates.map((template) => (
                <TemplateCard
                  description={template.metadata.description}
                  key={template.metadata.id}
                  meta={`${template.canvas.width}x${template.canvas.height}`}
                  onClick={() => {
                    setSelectedTemplateId(template.metadata.id);
                    setSelectedLayerId("");
                  }}
                  selected={template.metadata.id === selectedTemplate.metadata.id}
                  tags={template.metadata.tags.slice(0, 3)}
                  thumbnail={<LayoutDashboard size={22} />}
                  title={template.metadata.name}
                />
              ))}
            </div>
          </Panel>

              <Panel title="Adicionar" description="Blocos comuns para iniciar composicoes.">
            <div className="tool-grid" aria-label="Adicionar camada">
              <button className="tool-card" onClick={() => addLayer("text")} type="button">
                <Type size={18} />
                Texto
              </button>
              <button className="tool-card" onClick={() => addLayer("rectangle")} type="button">
                <Square size={18} />
                Retangulo
              </button>
              <button className="tool-card" onClick={() => addLayer("ellipse")} type="button">
                <Circle size={18} />
                Elipse
              </button>
              <button className="tool-card" onClick={() => addLayer("image")} type="button">
                <Image size={18} />
                Imagem
              </button>
            </div>
          </Panel>
            </>
          )}
        </aside>

        <section className="stage" aria-label="Canvas">
          <div className="stage__toolbar">
            <div>
              <p className="stage__label">{selectedTemplate.metadata.category}</p>
              <h2>{selectedTemplate.metadata.name}</h2>
            </div>
            <div className="zoom-control" role="group" aria-label="Controles do canvas">
              <label htmlFor="canvas-preset">Canvas</label>
              <select
                className="compact-select"
                id="canvas-preset"
                onChange={(event) => updateCanvasPreset(event.target.value as DevicePreset)}
                value={selectedTemplate.canvas.preset}
              >
                {CANVAS_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <label className="canvas-size-field" htmlFor="canvas-width">
                W
                <input
                  aria-label="Largura do canvas"
                  id="canvas-width"
                  max={CANVAS_MAX_SIZE}
                  min={CANVAS_MIN_SIZE}
                  onChange={(event) => updateCanvasSize("width", Number(event.target.value))}
                  type="number"
                  value={selectedTemplate.canvas.width}
                />
              </label>
              <label className="canvas-size-field" htmlFor="canvas-height">
                H
                <input
                  aria-label="Altura do canvas"
                  id="canvas-height"
                  max={CANVAS_MAX_SIZE}
                  min={CANVAS_MIN_SIZE}
                  onChange={(event) => updateCanvasSize("height", Number(event.target.value))}
                  type="number"
                  value={selectedTemplate.canvas.height}
                />
              </label>
              <button
                className="button button--compact"
                onClick={expandCurrentCanvasToWorkspace}
                type="button"
              >
                <Maximize2 size={14} />
                Área livre
              </button>
              <button
                className="button button--compact"
                onClick={fitCanvasToView}
                type="button"
              >
                <Maximize2 size={14} />
                Enquadrar
              </button>
              <button
                className="button button--compact"
                onClick={() => {
                  setZoom(1);
                  setNotice("Zoom em 100%.");
                }}
                type="button"
              >
                100%
              </button>
              <button
                aria-pressed={snapEnabled}
                className={`button button--compact button--toggle ${snapEnabled ? "button--toggle-active" : ""}`}
                onClick={() => {
                  setSnapEnabled((current) => !current);
                  setNotice(!snapEnabled ? "Snap na grade ativado." : "Snap na grade desativado.");
                }}
                title="Alternar snap (S)"
                type="button"
              >
                <Square size={14} />
                Snap
              </button>
              <MousePointer2 size={16} aria-hidden="true" />
              <label htmlFor="zoom">Zoom</label>
              <input
                id="zoom"
                max="1.25"
                min="0.08"
                onChange={(event) => setZoom(Number(event.target.value))}
                step="0.04"
                type="range"
                value={zoom}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="canvas-scroll" ref={canvasScrollRef}>
            <div
              className="pasteboard"
              style={{
                minWidth: Math.max(selectedTemplate.canvas.width * zoom + 960, 2200),
                minHeight: Math.max(selectedTemplate.canvas.height * zoom + 720, 1500),
              }}
            >
              <div
                className="canvas-frame"
                style={{
                  width: selectedTemplate.canvas.width * zoom,
                  height: selectedTemplate.canvas.height * zoom,
                }}
              >
              <div
                className="canvas"
                style={{
                  width: selectedTemplate.canvas.width,
                  height: selectedTemplate.canvas.height,
                  transform: `scale(${zoom})`,
                  backgroundColor: selectedTemplate.canvas.background,
                  backgroundImage: `linear-gradient(to right, rgba(15,23,42,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,.06) 1px, transparent 1px)`,
                  backgroundSize: `${selectedTemplate.canvas.gridSize * 4}px ${selectedTemplate.canvas.gridSize * 4}px`,
                }}
              >
                {selectedTemplate.layers.map(renderLayer)}
                {renderSelectionOverlay()}
              </div>
              </div>
            </div>
          </div>
          <p className="status-line" aria-live="polite" role="status">
            {notice}
          </p>
        </section>

        <aside className="sidebar sidebar--right" aria-label="Camadas e propriedades">
          <Panel title="Camadas" description={`${layers.length} itens no template.`}>
            <div className="layer-list">
              {layers.map((layer) => (
                <div
                  className={`layer-row ${selectedLayerId === layer.id ? "layer-row--selected" : ""}`}
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  onKeyDown={(event) => handleLayerKeyboard(event, layer)}
                  role="button"
                  tabIndex={0}
                >
                  <span aria-hidden="true">{layerIcon(layer)}</span>
                  <span>{layer.name}</span>
                  <IconButton
                    aria-label={layer.locked ? "Desbloquear camada" : "Bloquear camada"}
                    active={Boolean(layer.locked)}
                    icon={layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleLayerLock(layer);
                    }}
                    tooltip={layer.locked ? "Desbloquear" : "Bloquear"}
                  />
                  <IconButton
                    aria-label={layer.visible ? "Ocultar camada" : "Mostrar camada"}
                    active={!layer.visible}
                    icon={layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    onClick={(event) => {
                      event.stopPropagation();
                      patchLayer(layer.id, (item) => ({ ...item, visible: !item.visible }));
                    }}
                    tooltip={layer.visible ? "Ocultar" : "Mostrar"}
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Canvas" description="Ajustes globais da área de criação.">
            <div className="field-grid">
              <PropertyField htmlFor="canvas-background" label="Fundo">
                <input
                  id="canvas-background"
                  onChange={(event) => updateCanvasSettings({ background: event.target.value })}
                  type="color"
                  value={selectedTemplate.canvas.background}
                />
              </PropertyField>
              <PropertyField htmlFor="canvas-grid" label="Grade">
                <input
                  id="canvas-grid"
                  max="64"
                  min="2"
                  onChange={(event) => updateCanvasSettings({ gridSize: Number(event.target.value) })}
                  type="number"
                  value={selectedTemplate.canvas.gridSize}
                />
              </PropertyField>
            </div>
          </Panel>

          <Panel
            actions={
              <div className="inspector-actions">
                <IconButton
                  aria-label="Duplicar camada"
                  disabled={!selectedLayer}
                  icon={<Copy size={15} />}
                  onClick={duplicateSelectedLayer}
                  tooltip="Duplicar camada (Ctrl+D)"
                />
                <IconButton
                  aria-label={selectedLayer?.locked ? "Desbloquear camada" : "Bloquear camada"}
                  disabled={!selectedLayer}
                  icon={selectedLayer?.locked ? <Lock size={15} /> : <Unlock size={15} />}
                  onClick={() => {
                    if (selectedLayer) toggleLayerLock(selectedLayer);
                  }}
                  tooltip={selectedLayer?.locked ? "Desbloquear camada (L)" : "Bloquear camada (L)"}
                />
                <IconButton
                  aria-label="Excluir camada"
                  disabled={!selectedLayer || selectedLayer.locked}
                  icon={<Trash2 size={15} />}
                  onClick={deleteSelectedLayer}
                  tooltip="Excluir camada (Del)"
                />
              </div>
            }
            title="Inspector"
            description={selectedLayer ? "Ajuste camada selecionada." : "Selecione uma camada no canvas."}
          >
            {selectedLayer ? (
              <div className="inspector">
                {selectedLayer.locked ? (
                  <p className="inspector-note">Camada bloqueada para evitar alterações acidentais.</p>
                ) : null}

                <div className="quick-actions" aria-label="Ações rápidas da camada">
                  <IconButton
                    aria-label="Alinhar à esquerda"
                    disabled={selectedLayer.locked}
                    icon={<AlignStartHorizontal size={15} />}
                    onClick={() => alignSelectedLayer("left")}
                    tooltip="Alinhar à esquerda"
                  />
                  <IconButton
                    aria-label="Centralizar horizontalmente"
                    disabled={selectedLayer.locked}
                    icon={<AlignCenterHorizontal size={15} />}
                    onClick={() => alignSelectedLayer("center-horizontal")}
                    tooltip="Centralizar horizontalmente"
                  />
                  <IconButton
                    aria-label="Alinhar à direita"
                    disabled={selectedLayer.locked}
                    icon={<AlignEndHorizontal size={15} />}
                    onClick={() => alignSelectedLayer("right")}
                    tooltip="Alinhar à direita"
                  />
                  <IconButton
                    aria-label="Alinhar ao topo"
                    disabled={selectedLayer.locked}
                    icon={<AlignStartVertical size={15} />}
                    onClick={() => alignSelectedLayer("top")}
                    tooltip="Alinhar ao topo"
                  />
                  <IconButton
                    aria-label="Centralizar verticalmente"
                    disabled={selectedLayer.locked}
                    icon={<AlignCenterVertical size={15} />}
                    onClick={() => alignSelectedLayer("center-vertical")}
                    tooltip="Centralizar verticalmente"
                  />
                  <IconButton
                    aria-label="Alinhar à base"
                    disabled={selectedLayer.locked}
                    icon={<AlignEndVertical size={15} />}
                    onClick={() => alignSelectedLayer("bottom")}
                    tooltip="Alinhar à base"
                  />
                  <IconButton
                    aria-label="Trazer para frente"
                    disabled={selectedLayer.locked}
                    icon={<BringToFront size={15} />}
                    onClick={() => reorderSelectedLayer("front")}
                    tooltip="Trazer para frente"
                  />
                  <IconButton
                    aria-label="Avançar uma camada"
                    disabled={selectedLayer.locked}
                    icon={<ArrowUp size={15} />}
                    onClick={() => reorderSelectedLayer("forward")}
                    tooltip="Avançar uma camada"
                  />
                  <IconButton
                    aria-label="Recuar uma camada"
                    disabled={selectedLayer.locked}
                    icon={<ArrowDown size={15} />}
                    onClick={() => reorderSelectedLayer("backward")}
                    tooltip="Recuar uma camada"
                  />
                  <IconButton
                    aria-label="Enviar para trás"
                    disabled={selectedLayer.locked}
                    icon={<SendToBack size={15} />}
                    onClick={() => reorderSelectedLayer("back")}
                    tooltip="Enviar para trás"
                  />
                </div>

                <PropertyField htmlFor="layer-name" label="Nome">
                  <input
                    disabled={selectedLayer.locked}
                    id="layer-name"
                    onChange={(event) =>
                      patchLayer(selectedLayer.id, (layer) => updateLayerField(layer, { name: event.target.value }))
                    }
                    value={selectedLayer.name}
                  />
                </PropertyField>

                {"content" in selectedLayer ? (
                  <PropertyField htmlFor="layer-content" label="Texto">
                    <textarea
                      disabled={selectedLayer.locked}
                      id="layer-content"
                      onChange={(event) =>
                        patchLayer(selectedLayer.id, (layer) =>
                          layer.type === "text" ? { ...layer, content: event.target.value } : layer,
                        )
                      }
                      rows={3}
                      value={selectedLayer.content}
                    />
                  </PropertyField>
                ) : null}

                {selectedLayer.type === "image" ? (
                  <>
                    <PropertyField htmlFor="image-src" label="URL da imagem">
                      <input
                        disabled={selectedLayer.locked}
                        id="image-src"
                        onChange={(event) =>
                          patchLayer(selectedLayer.id, (layer) =>
                            layer.type === "image" ? { ...layer, src: event.target.value } : layer,
                          )
                        }
                        placeholder="https://..."
                        value={selectedLayer.src}
                      />
                    </PropertyField>
                    <div className="field-grid">
                      <PropertyField htmlFor="image-alt" label="Texto alternativo">
                        <input
                          disabled={selectedLayer.locked}
                          id="image-alt"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "image" ? { ...layer, alt: event.target.value } : layer,
                            )
                          }
                          value={selectedLayer.alt}
                        />
                      </PropertyField>
                      <PropertyField htmlFor="image-fit" label="Encaixe">
                        <select
                          disabled={selectedLayer.locked}
                          id="image-fit"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "image"
                                ? { ...layer, fit: event.target.value as "cover" | "contain" }
                                : layer,
                            )
                          }
                          value={selectedLayer.fit ?? "cover"}
                        >
                          <option value="cover">Cobrir</option>
                          <option value="contain">Conter</option>
                        </select>
                      </PropertyField>
                    </div>
                  </>
                ) : null}

                <div className="field-grid">
                  {(["x", "y", "width", "height"] as const).map((field) => (
                    <PropertyField htmlFor={`layer-${field}`} key={field} label={field.toUpperCase()}>
                      <input
                        disabled={selectedLayer.locked}
                        id={`layer-${field}`}
                        min={field === "width" || field === "height" ? 1 : undefined}
                        onChange={(event) => updateBounds(field, Number(event.target.value))}
                        type="number"
                        value={selectedLayer.bounds[field]}
                      />
                    </PropertyField>
                  ))}
                </div>

                {"textStyle" in selectedLayer ? (
                  <>
                    <div className="field-grid">
                      <PropertyField htmlFor="font-size" label="Fonte">
                        <input
                          disabled={selectedLayer.locked}
                          id="font-size"
                          min="8"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "text"
                                ? {
                                    ...layer,
                                    textStyle: { ...layer.textStyle, fontSize: Number(event.target.value) },
                                  }
                                : layer,
                            )
                          }
                          type="number"
                          value={selectedLayer.textStyle.fontSize}
                        />
                      </PropertyField>
                      <PropertyField htmlFor="font-weight" label="Peso">
                        <select
                          disabled={selectedLayer.locked}
                          id="font-weight"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "text"
                                ? {
                                    ...layer,
                                    textStyle: { ...layer.textStyle, fontWeight: Number(event.target.value) as FontWeight },
                                  }
                                : layer,
                            )
                          }
                          value={selectedLayer.textStyle.fontWeight}
                        >
                          {[300, 400, 500, 600, 700, 800].map((weight) => (
                            <option key={weight} value={weight}>
                              {weight}
                            </option>
                          ))}
                        </select>
                      </PropertyField>
                    </div>
                    <div className="field-grid">
                      <PropertyField htmlFor="text-color" label="Cor">
                        <input
                          disabled={selectedLayer.locked}
                          id="text-color"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "text"
                                ? { ...layer, textStyle: { ...layer.textStyle, color: event.target.value } }
                                : layer,
                            )
                          }
                          type="color"
                          value={selectedLayer.textStyle.color}
                        />
                      </PropertyField>
                      <PropertyField htmlFor="text-align" label="Alinhar">
                        <select
                          disabled={selectedLayer.locked}
                          id="text-align"
                          onChange={(event) =>
                            patchLayer(selectedLayer.id, (layer) =>
                              layer.type === "text"
                                ? {
                                    ...layer,
                                    textStyle: { ...layer.textStyle, align: event.target.value as TextAlign },
                                  }
                                : layer,
                            )
                          }
                          value={selectedLayer.textStyle.align ?? "left"}
                        >
                          <option value="left">Esquerda</option>
                          <option value="center">Centro</option>
                          <option value="right">Direita</option>
                        </select>
                      </PropertyField>
                    </div>
                  </>
                ) : (
                  <div className="field-grid">
                    <PropertyField htmlFor="fill-color" label="Preenchimento">
                      <input
                        disabled={selectedLayer.locked}
                        id="fill-color"
                        onChange={(event) =>
                          patchLayer(selectedLayer.id, (layer) => ({
                            ...layer,
                            style: { ...layer.style, fill: event.target.value },
                          }))
                        }
                        type="color"
                        value={selectedLayer.style?.fill ?? "#ffffff"}
                      />
                    </PropertyField>
                    <PropertyField htmlFor="radius" label="Raio">
                      <input
                        disabled={selectedLayer.locked}
                        id="radius"
                        min="0"
                        onChange={(event) =>
                          patchLayer(selectedLayer.id, (layer) => ({
                            ...layer,
                            style: { ...layer.style, radius: Number(event.target.value) },
                          }))
                        }
                        type="number"
                        value={selectedLayer.style?.radius ?? 0}
                      />
                    </PropertyField>
                  </div>
                )}

                <div className="field-grid">
                  <PropertyField htmlFor="layer-opacity" label="Opacidade">
                    <input
                      disabled={selectedLayer.locked}
                      id="layer-opacity"
                      max="1"
                      min="0"
                      onChange={(event) => updateSelectedLayerStyle({ opacity: Number(event.target.value) })}
                      step="0.05"
                      type="number"
                      value={selectedLayer.style?.opacity ?? 1}
                    />
                  </PropertyField>
                  <PropertyField htmlFor="stroke-width" label="Borda">
                    <input
                      disabled={selectedLayer.locked}
                      id="stroke-width"
                      min="0"
                      onChange={(event) => updateSelectedLayerStyle({ strokeWidth: Number(event.target.value) })}
                      type="number"
                      value={selectedLayer.style?.strokeWidth ?? 0}
                    />
                  </PropertyField>
                </div>
                <PropertyField htmlFor="stroke-color" label="Cor da borda">
                  <input
                    disabled={selectedLayer.locked}
                    id="stroke-color"
                    onChange={(event) => updateSelectedLayerStyle({ stroke: event.target.value })}
                    type="color"
                    value={selectedLayer.style?.stroke ?? "#111827"}
                  />
                </PropertyField>
              </div>
            ) : (
              <div className="empty-state">
                <Box size={28} aria-hidden="true" />
                <p>Selecione uma camada para editar tamanho, posicao, conteudo e estilo.</p>
              </div>
            )}
          </Panel>
        </aside>
      </section>
    </main>
  );
}

export default App;
