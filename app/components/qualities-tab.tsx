"use client";

import { useState } from "react";
import type { PromptImage } from "@/lib/images";
import { AnalysisView } from "./idea-card";
import { ChatComposer } from "./chat-composer";
import { useStudio } from "./studio-context";

const PRESETS = [
  {
    id: "full",
    label: "Full brief",
    prompt: "",
  },
  {
    id: "industry",
    label: "Industry depth",
    prompt:
      "Decode this idea against its industry: who the real users are, which records matter, what ops or compliance constraints apply, and what would make it a toy vs a real vertical product.",
  },
  {
    id: "arch",
    label: "Architecture",
    prompt:
      "Decode the architecture, folder structure, and how the frontend should talk to the backend in this project.",
  },
  {
    id: "mvp",
    label: "MVP vs stretch",
    prompt: "What is the true MVP versus stretch goals, in build order?",
  },
  {
    id: "learn",
    label: "What I will learn",
    prompt:
      "What specific skills will I actually practice, and what is just boilerplate?",
  },
  {
    id: "time",
    label: "Time and risk",
    prompt:
      "Estimate time, difficulty, and the risks that usually blow the schedule.",
  },
  {
    id: "data",
    label: "Data model",
    prompt: "Propose a data model and the first queries I need.",
  },
  {
    id: "auth",
    label: "Auth and edges",
    prompt: "What auth, permissions, and edge cases should I design for?",
  },
];

export function QualitiesTab() {
  const {
    projects,
    selected,
    selectProject,
    analyze,
    analyzing,
    error,
    setTab,
  } = useStudio();
  const [prompt, setPrompt] = useState("");
  const [presetId, setPresetId] = useState("full");
  const [images, setImages] = useState<PromptImage[]>([]);
  const active = selected ?? projects[0] ?? null;

  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="text-lg font-medium">Generate ideas first</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Qualities are decoded against a specific project. Create a list on the Generate tab, then come back.
        </p>
        <button
          type="button"
          onClick={() => setTab("generate")}
          className="mt-6 border border-line px-4 py-2 text-sm hover:border-accent"
        >
          Go to Generate
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border border-line bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
            Project
          </span>
          <select
            value={active?.id ?? ""}
            onChange={(event) => selectProject(event.target.value)}
            className="mt-2 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.status === "done" ? "Done · " : ""}
                {project.categoryName ? `${project.categoryName} · ` : ""}
                {project.title}
              </option>
            ))}
          </select>
        </label>

        {active ? (
          <div className="space-y-2 text-sm leading-6 text-muted">
            <p>
              <span className="text-foreground">{active.categoryName || active.domain}</span>
              {" · "}
              {active.difficulty}
              {" · "}
              {active.estimatedWeeks} weeks
            </p>
            {active.categoryDescription ? (
              <p>{active.categoryDescription}</p>
            ) : null}
            <p>{active.summary}</p>
          </div>
        ) : null}

        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
            Prompt presets
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setPresetId(preset.id);
                  setPrompt(preset.prompt);
                }}
                className={`border px-2.5 py-1 text-xs ${
                  presetId === preset.id
                    ? "border-accent bg-accent-soft"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </fieldset>

        <ChatComposer
          label="Custom prompt"
          value={prompt}
          onChange={(next) => {
            setPrompt(next);
            setPresetId("custom");
          }}
          images={images}
          onImagesChange={setImages}
          placeholder="Ask anything: folder structure, auth, what to skip… Paste or drop a screenshot."
          rows={7}
        />

        <button
          type="button"
          disabled={!active || analyzing}
          onClick={() => analyze(prompt, images)}
          className="bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {analyzing ? "Decoding…" : "Decode qualities"}
        </button>
        {error ? <p className="text-sm leading-6 text-accent">{error}</p> : null}
      </aside>

      <section className="min-w-0 border border-line bg-surface p-6 md:p-8">
        {active?.analysis ? (
          <AnalysisView text={active.analysis} />
        ) : (
          <div className="py-12 text-center">
            <p className="text-lg font-medium">No brief yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
              Pick a preset or write your own prompt, then decode. The answer is stored on this project so you can check it off later on Tracker.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
