"use client";

import { useMemo, useState } from "react";
import { getCategory } from "@/lib/categories";
import { TECH_GROUPS } from "@/lib/techs";
import type { Difficulty } from "@/lib/types";
import type { PromptImage } from "@/lib/images";
import { ChatComposer } from "./chat-composer";
import { IdeaCard } from "./idea-card";
import { useStudio } from "./studio-context";

const COUNTS = [6, 8, 12];
const DIFFICULTIES: { id: Difficulty | "mixed"; label: string }[] = [
  { id: "mixed", label: "Mixed" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function GenerateTab() {
  const {
    projects,
    selectedId,
    selectProject,
    technologies,
    toggleTech,
    generating,
    generate,
    toggleDone,
    removeProject,
    openQualities,
    openPlanning,
    error,
    categoryId,
    setTab,
  } = useStudio();
  const [count, setCount] = useState(8);
  const [difficulty, setDifficulty] = useState<Difficulty | "mixed">("mixed");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<PromptImage[]>([]);
  const [scope, setScope] = useState<"industry" | "all">("industry");

  const category = getCategory(categoryId);
  const visible = useMemo(() => {
    if (scope === "all" || !categoryId) return projects;
    return projects.filter((project) => project.categoryId === categoryId);
  }, [projects, categoryId, scope]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border border-line bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Industry
          </p>
          {category ? (
            <>
              <p className="mt-1 text-sm font-medium leading-6">
                {category.name}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {category.description}
              </p>
              <button
                type="button"
                onClick={() => setTab("industries")}
                className="mt-2 text-sm text-accent underline-offset-4 hover:underline"
              >
                Change industry
              </button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm leading-6 text-muted">
                Choose a vertical first so ideas go in-depth for that domain.
              </p>
              <button
                type="button"
                onClick={() => setTab("industries")}
                className="mt-3 bg-accent px-4 py-2.5 text-sm font-medium text-white"
              >
                Browse industries
              </button>
            </>
          )}
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Stack
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            Ideas are written for the technologies you turn on.
          </p>
        </div>

        {TECH_GROUPS.map((group) => (
          <fieldset key={group.label} className="space-y-2">
            <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
              {group.label}
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((tech) => {
                const on = technologies.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    aria-pressed={on}
                    className={`border px-2.5 py-1 font-mono text-[11px] tracking-[0.04em] ${
                      on
                        ? "border-accent bg-accent-soft text-foreground"
                        : "border-line text-muted hover:border-muted hover:text-foreground"
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
            Band
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDifficulty(item.id)}
                className={`border px-2.5 py-1 text-xs ${
                  difficulty === item.id
                    ? "border-accent bg-accent-soft"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
            Project ideas to create
          </legend>
          <div className="mt-2 flex gap-1.5">
            {COUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCount(value)}
                className={`border px-3 py-1 font-mono text-xs ${
                  count === value
                    ? "border-accent bg-accent-soft"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <ChatComposer
          label="Extra prompt"
          value={prompt}
          onChange={setPrompt}
          images={images}
          onImagesChange={setImages}
          placeholder="Multi-location, HIPAA-aware UX, no payments in v1… Paste or drop a screenshot."
          rows={4}
        />

        <button
          type="button"
          onClick={() => generate({ count, difficulty, prompt, images })}
          disabled={generating || technologies.length === 0 || !category}
          className="bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {generating
            ? "Generating…"
            : category
              ? `Generate ${category.name} ideas`
              : "Generate ideas"}
        </button>
        {technologies.length === 0 ? (
          <p className="text-xs leading-5 text-muted">
            Pick at least one technology.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm leading-6 text-accent">{error}</p>
        ) : null}
      </aside>

      <section className="min-w-0">
        {projects.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setScope("industry")}
              className={`border px-3 py-1.5 text-sm ${
                scope === "industry"
                  ? "border-accent bg-accent-soft"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              This industry
            </button>
            <button
              type="button"
              onClick={() => setScope("all")}
              className={`border px-3 py-1.5 text-sm ${
                scope === "all"
                  ? "border-accent bg-accent-soft"
                  : "border-line text-muted hover:text-foreground"
              }`}
            >
              All saved
            </button>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="border border-dashed border-line px-6 py-16 text-center">
            <p className="text-lg font-medium">
              {category ? `No ${category.name} ideas yet` : "Pick an industry"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              {category
                ? "Generate a set of in-depth application ideas for this vertical, then decode qualities or check them off on Tracker."
                : "Open Industries, choose a category, then come back here with your stack."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((project) => (
              <IdeaCard
                key={project.id}
                project={project}
                selected={project.id === selectedId}
                onSelect={() => selectProject(project.id)}
                onToggleDone={() => toggleDone(project.id)}
                onOpenQualities={() => openQualities(project.id)}
                onOpenPlan={() => openPlanning(project.id)}
                onRemove={() => removeProject(project.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
