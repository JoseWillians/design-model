import { seedTemplates } from "./templateSeed";
import type { DevicePreset, TemplateCanvas, TemplateCollection, TemplateDocument } from "./templateTypes";

const STORAGE_KEY = "design-model.templates.v1";
const COLLECTION_VERSION = 1;

type TemplateInput = Omit<TemplateDocument, "metadata"> & {
  metadata: Omit<TemplateDocument["metadata"], "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

const hasLocalStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const cloneTemplate = (template: TemplateDocument): TemplateDocument => JSON.parse(JSON.stringify(template));

const inferCanvasPreset = (canvas: Pick<TemplateCanvas, "width" | "height">): DevicePreset => {
  if (canvas.width === 390 && canvas.height === 844) return "mobile";
  if (canvas.width === 834 && canvas.height === 1112) return "tablet";
  if (canvas.width === 1080 && canvas.height === 1080) return "square";
  if (canvas.width === 1080 && canvas.height === 1920) return "story";
  return "desktop";
};

const normalizeTemplate = (template: TemplateDocument): TemplateDocument => {
  const cloned = cloneTemplate(template);

  return {
    ...cloned,
    canvas: {
      ...cloned.canvas,
      preset: cloned.canvas.preset ?? inferCanvasPreset(cloned.canvas),
      gridSize: cloned.canvas.gridSize || 8,
      background: cloned.canvas.background || "#f6f7fb",
    },
  };
};

const createId = (prefix = "template") => {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${randomPart}`;
};

const normalizeCollection = (collection: TemplateCollection): TemplateCollection => ({
  version: COLLECTION_VERSION,
  templates: collection.templates.map(normalizeTemplate),
});

export const createSeedCollection = (): TemplateCollection => ({
  version: COLLECTION_VERSION,
  templates: seedTemplates.map(cloneTemplate),
});

export const loadTemplateCollection = (): TemplateCollection => {
  if (!hasLocalStorage()) {
    return createSeedCollection();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const seeded = createSeedCollection();
    saveTemplateCollection(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as TemplateCollection;

    if (!Array.isArray(parsed.templates)) {
      throw new Error("Template collection is invalid.");
    }

    return normalizeCollection(parsed);
  } catch {
    const seeded = createSeedCollection();
    saveTemplateCollection(seeded);
    return seeded;
  }
};

export const saveTemplateCollection = (collection: TemplateCollection): TemplateCollection => {
  const normalized = normalizeCollection(collection);

  if (hasLocalStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  return normalized;
};

export const listTemplates = (): TemplateDocument[] => loadTemplateCollection().templates;

export const getTemplateById = (templateId: string): TemplateDocument | undefined =>
  loadTemplateCollection().templates.find((template) => template.metadata.id === templateId);

export const createTemplate = (input: TemplateInput): TemplateDocument => {
  const timestamp = new Date().toISOString();
  const template: TemplateDocument = {
    ...input,
    metadata: {
      ...input.metadata,
      id: input.metadata.id ?? createId(),
      createdAt: input.metadata.createdAt ?? timestamp,
      updatedAt: input.metadata.updatedAt ?? timestamp,
    },
  };
  const collection = loadTemplateCollection();

  saveTemplateCollection({
    ...collection,
    templates: [template, ...collection.templates],
  });

  return cloneTemplate(template);
};

export const updateTemplate = (
  templateId: string,
  updater: Partial<TemplateDocument> | ((template: TemplateDocument) => TemplateDocument),
): TemplateDocument | undefined => {
  const collection = loadTemplateCollection();
  let updatedTemplate: TemplateDocument | undefined;

  const templates = collection.templates.map((template) => {
    if (template.metadata.id !== templateId) {
      return template;
    }

    const nextTemplate = typeof updater === "function" ? updater(cloneTemplate(template)) : { ...template, ...updater };
    updatedTemplate = {
      ...nextTemplate,
      metadata: {
        ...nextTemplate.metadata,
        id: template.metadata.id,
        createdAt: template.metadata.createdAt,
        updatedAt: new Date().toISOString(),
      },
    };

    return updatedTemplate;
  });

  if (updatedTemplate) {
    saveTemplateCollection({ ...collection, templates });
  }

  return updatedTemplate ? cloneTemplate(updatedTemplate) : undefined;
};

export const duplicateTemplate = (templateId: string): TemplateDocument | undefined => {
  const source = getTemplateById(templateId);

  if (!source) {
    return undefined;
  }

  const timestamp = new Date().toISOString();
  const duplicate: TemplateDocument = {
    ...cloneTemplate(source),
    metadata: {
      ...source.metadata,
      id: createId(),
      name: `${source.metadata.name} copia`,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  };
  const collection = loadTemplateCollection();

  saveTemplateCollection({
    ...collection,
    templates: [duplicate, ...collection.templates],
  });

  return cloneTemplate(duplicate);
};

export const deleteTemplate = (templateId: string): boolean => {
  const collection = loadTemplateCollection();
  const templates = collection.templates.filter((template) => template.metadata.id !== templateId);

  if (templates.length === collection.templates.length) {
    return false;
  }

  saveTemplateCollection({ ...collection, templates });
  return true;
};

export const resetTemplates = (): TemplateCollection => saveTemplateCollection(createSeedCollection());

export const templateStorageKey = STORAGE_KEY;
