"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DEFAULT_TECHS } from "@/lib/techs";
import type { PromptImage } from "@/lib/images";
import type { Difficulty, ProjectIdea } from "@/lib/types";

export type TabId = "industries" | "generate" | "qualities" | "tracker";

type StudioSnapshot = {
  projects: ProjectIdea[];
  selectedId: string | null;
  technologies: string[];
  categoryId: string | null;
};

const STORAGE_KEY = "project-studio:v2";
const LEGACY_KEY = "project-studio:v1";

const EMPTY_SNAPSHOT: StudioSnapshot = {
  projects: [],
  selectedId: null,
  technologies: DEFAULT_TECHS,
  categoryId: null,
};

const listeners = new Set<() => void>();

type StudioContextValue = {
  ready: boolean;
  tab: TabId;
  setTab: (tab: TabId) => void;
  projects: ProjectIdea[];
  selectedId: string | null;
  selected: ProjectIdea | null;
  selectProject: (id: string | null) => void;
  technologies: string[];
  setTechnologies: (techs: string[]) => void;
  toggleTech: (tech: string) => void;
  categoryId: string | null;
  setCategoryId: (id: string | null) => void;
  chooseIndustry: (id: string) => void;
  llmEnabled: boolean;
  llmModel: string | null;
  generating: boolean;
  analyzing: boolean;
  error: string | null;
  generate: (input: {
    count: number;
    difficulty: Difficulty | "mixed";
    prompt: string;
    images: PromptImage[];
  }) => Promise<void>;
  analyze: (prompt: string, images: PromptImage[]) => Promise<void>;
  toggleDone: (id: string) => void;
  removeProject: (id: string) => void;
  openQualities: (id: string) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

function normalizeProject(raw: unknown): ProjectIdea | null {
  if (!raw || typeof raw !== "object") return null;
  const project = raw as Partial<ProjectIdea>;
  if (typeof project.id !== "string" || typeof project.title !== "string") {
    return null;
  }
  return {
    ...(project as ProjectIdea),
    categoryId: project.categoryId ?? "",
    categoryName: project.categoryName ?? project.domain ?? "",
    categoryDescription: project.categoryDescription ?? "",
  };
}

function parseSnapshot(raw: string | null): StudioSnapshot {
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as Partial<StudioSnapshot>;
    return {
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
            .map(normalizeProject)
            .filter((item): item is ProjectIdea => item !== null)
        : [],
      selectedId: typeof parsed.selectedId === "string" ? parsed.selectedId : null,
      technologies:
        Array.isArray(parsed.technologies) && parsed.technologies.length > 0
          ? parsed.technologies.filter((item): item is string => typeof item === "string")
          : DEFAULT_TECHS,
      categoryId: typeof parsed.categoryId === "string" ? parsed.categoryId : null,
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function getStoredRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeSnapshot(snapshot: StudioSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  for (const listener of listeners) listener();
}

function patchSnapshot(patch: Partial<StudioSnapshot>) {
  writeSnapshot({ ...parseSnapshot(getStoredRaw()), ...patch });
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getStoredRaw, () => "");
  const snapshot = useMemo(() => parseSnapshot(raw), [raw]);
  const { projects, selectedId, technologies, categoryId } = snapshot;

  const [tab, setTabState] = useState<TabId>("industries");
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmModel, setLlmModel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((data: { llm?: boolean; model?: string | null }) => {
        setLlmEnabled(Boolean(data.llm));
        setLlmModel(data.model ?? null);
      })
      .catch(() => {
        setLlmEnabled(false);
      });
  }, []);

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );

  const setTab = useCallback((next: TabId) => {
    setError(null);
    setTabState(next);
  }, []);

  const setTechnologies = useCallback((techs: string[]) => {
    patchSnapshot({ technologies: techs });
  }, []);

  const setCategoryId = useCallback((id: string | null) => {
    patchSnapshot({ categoryId: id });
  }, []);

  const selectProject = useCallback((id: string | null) => {
    patchSnapshot({ selectedId: id });
  }, []);

  const toggleTech = useCallback((tech: string) => {
    const current = parseSnapshot(getStoredRaw());
    patchSnapshot({
      technologies: current.technologies.includes(tech)
        ? current.technologies.filter((item) => item !== tech)
        : [...current.technologies, tech],
    });
  }, []);

  const chooseIndustry = useCallback((id: string) => {
    patchSnapshot({ categoryId: id });
    setError(null);
    setTabState("generate");
  }, []);

  const generate = useCallback(
    async (input: {
      count: number;
      difficulty: Difficulty | "mixed";
      prompt: string;
      images: PromptImage[];
    }) => {
      if (!categoryId) {
        setError("Pick an industry on the Industries tab first.");
        return;
      }
      setGenerating(true);
      setError(null);
      try {
        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            technologies,
            count: input.count,
            difficulty: input.difficulty,
            prompt: input.prompt,
            images: input.images,
            categoryId,
          }),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const data = (await response.json()) as { ideas?: ProjectIdea[] };
        const incoming = Array.isArray(data.ideas) ? data.ideas : [];
        const current = parseSnapshot(getStoredRaw());
        const seen = new Set(
          current.projects.map(
            (project) => `${project.categoryId}:${project.title.toLowerCase()}`,
          ),
        );
        const next = incoming.filter(
          (idea) => !seen.has(`${idea.categoryId}:${idea.title.toLowerCase()}`),
        );
        if (next.length === 0) {
          setError(
            "Those ideas are already on your board for this industry. Tweak the extra prompt or remove a few, then generate again.",
          );
          return;
        }
        writeSnapshot({
          ...current,
          projects: [...next, ...current.projects],
          selectedId: next[0].id,
        });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not generate ideas");
      } finally {
        setGenerating(false);
      }
    },
    [technologies, categoryId],
  );

  const analyze = useCallback(async (prompt: string, images: PromptImage[] = []) => {
    const current = parseSnapshot(getStoredRaw());
    const target =
      current.projects.find((project) => project.id === current.selectedId) ??
      current.projects[0];
    if (!target) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch("/api/qualities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: target, prompt, images }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = (await response.json()) as { analysis?: string };
      const analysis = data.analysis ?? "";
      const latest = parseSnapshot(getStoredRaw());
      writeSnapshot({
        ...latest,
        selectedId: target.id,
        projects: latest.projects.map((project) =>
          project.id === target.id ? { ...project, analysis } : project,
        ),
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not decode qualities");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const toggleDone = useCallback((id: string) => {
    const current = parseSnapshot(getStoredRaw());
    writeSnapshot({
      ...current,
      projects: current.projects.map((project) =>
        project.id === id
          ? { ...project, status: project.status === "done" ? "idea" : "done" }
          : project,
      ),
    });
  }, []);

  const removeProject = useCallback((id: string) => {
    const current = parseSnapshot(getStoredRaw());
    writeSnapshot({
      ...current,
      projects: current.projects.filter((project) => project.id !== id),
      selectedId: current.selectedId === id ? null : current.selectedId,
    });
  }, []);

  const openQualities = useCallback(
    (id: string) => {
      patchSnapshot({ selectedId: id });
      setTab("qualities");
    },
    [setTab],
  );

  const value = useMemo(
    () => ({
      ready: true,
      tab,
      setTab,
      projects,
      selectedId,
      selected,
      selectProject,
      technologies,
      setTechnologies,
      toggleTech,
      categoryId,
      setCategoryId,
      chooseIndustry,
      llmEnabled,
      llmModel,
      generating,
      analyzing,
      error,
      generate,
      analyze,
      toggleDone,
      removeProject,
      openQualities,
    }),
    [
      tab,
      setTab,
      projects,
      selectedId,
      selected,
      selectProject,
      technologies,
      setTechnologies,
      toggleTech,
      categoryId,
      setCategoryId,
      chooseIndustry,
      llmEnabled,
      llmModel,
      generating,
      analyzing,
      error,
      generate,
      analyze,
      toggleDone,
      removeProject,
      openQualities,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const value = useContext(StudioContext);
  if (!value) {
    throw new Error("useStudio must be used inside StudioProvider");
  }
  return value;
}
