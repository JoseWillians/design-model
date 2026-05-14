import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  Box,
  Circle,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileJson,
  Image,
  LayoutDashboard,
  MousePointer2,
  Plus,
  RefreshCcw,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { IconButton } from "./components/IconButton";
import { Panel } from "./components/Panel";
import { PropertyField } from "./components/PropertyField";
import { TemplateCard } from "./components/TemplateCard";
import { exportTemplateAsCss, exportTemplateAsJson, createDownloadUrl } from "./lib/exporters";
import {
  clampBounds,
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
const RESIZE_HANDLES: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const CANVAS_PRESETS: Array<{ value: BlankTemplatePreset; label: string }> = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
  { value: "square", label: "Square" },
  { value: "story", label: "Story" },
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

const createId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;

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

function App() {
  const [templates, setTemplates] = useState<TemplateDocument[]>(() => listTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => templates[0]?.metadata.id ?? "");
  const [selectedLayerId, setSelectedLayerId] = useState("");
  const [zoom, setZoom] = useState(0.64);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [blankPreset, setBlankPreset] = useState<BlankTemplatePreset>("desktop");
  const [notice, setNotice] = useState("Sessao pronta para criar.");
  const [interaction, setInteraction] = useState<CanvasInteraction | null>(null);
  const [previewBoundsByLayerId, setPreviewBoundsByLayerId] = useState<Record<string, LayerBounds>>({});
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
    const nextTemplate = {
      ...selectedTemplate,
      layers: removeLayer(selectedTemplate.layers, selectedLayer.id),
    };
    syncTemplate(nextTemplate);
    setSelectedLayerId("");
    setNotice("Camada removida.");
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
    setNotice("Template em branco criado. Adicione camadas para comecar.");
  };

  const updateCanvasPreset = (preset: DevicePreset) => {
    if (!selectedTemplate) return;
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
          {layer.src ? <img alt={layer.alt} src={layer.src} /> : <Image aria-hidden="true" size={32} />}
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

      <section className="workspace" aria-label="Area de trabalho">
        <aside className="sidebar sidebar--left" aria-label="Templates e ferramentas">
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
        </aside>

        <section className="stage" aria-label="Canvas">
          <div className="stage__toolbar">
            <div>
              <p className="stage__label">{selectedTemplate.metadata.category}</p>
              <h2>{selectedTemplate.metadata.name}</h2>
            </div>
            <div className="zoom-control">
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
              <button
                aria-pressed={snapEnabled}
                className={`button button--compact button--toggle ${snapEnabled ? "button--toggle-active" : ""}`}
                onClick={() => {
                  setSnapEnabled((current) => !current);
                  setNotice(!snapEnabled ? "Snap na grade ativado." : "Snap na grade desativado.");
                }}
                type="button"
              >
                <Square size={14} />
                Snap
              </button>
              <MousePointer2 size={16} aria-hidden="true" />
              <label htmlFor="zoom">Zoom</label>
              <input
                id="zoom"
                max="1"
                min="0.28"
                onChange={(event) => setZoom(Number(event.target.value))}
                step="0.04"
                type="range"
                value={zoom}
              />
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          <div className="canvas-scroll">
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
          <p className="status-line" aria-live="polite">
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
                    aria-label={layer.visible ? "Ocultar camada" : "Mostrar camada"}
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

          <Panel
            actions={
              <div className="inspector-actions">
                <IconButton
                  aria-label="Duplicar camada"
                  disabled={!selectedLayer}
                  icon={<Copy size={15} />}
                  onClick={duplicateSelectedLayer}
                  tooltip="Duplicar camada"
                />
                <IconButton
                  aria-label="Excluir camada"
                  disabled={!selectedLayer}
                  icon={<Trash2 size={15} />}
                  onClick={deleteSelectedLayer}
                  tooltip="Excluir camada"
                />
              </div>
            }
            title="Inspector"
            description={selectedLayer ? "Ajuste camada selecionada." : "Selecione uma camada no canvas."}
          >
            {selectedLayer ? (
              <div className="inspector">
                <PropertyField htmlFor="layer-name" label="Nome">
                  <input
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

                <div className="field-grid">
                  {(["x", "y", "width", "height"] as const).map((field) => (
                    <PropertyField htmlFor={`layer-${field}`} key={field} label={field.toUpperCase()}>
                      <input
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
