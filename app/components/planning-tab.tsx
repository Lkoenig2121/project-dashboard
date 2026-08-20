"use client";

import { useMemo, useState } from "react";
import { getCategory } from "@/lib/categories";
import type { PromptImage } from "@/lib/images";
import { TECH_GROUPS } from "@/lib/techs";
import { ChatComposer } from "./chat-composer";
import { AnalysisView } from "./idea-card";
import { useStudio } from "./studio-context";

export function PlanningTab() {
  const {
    projects,
    selected,
    selectProject,
    technologies,
    toggleTech,
    categoryId,
    createPlan,
    planning,
    error,
    plans,
    selectedPlan,
    selectedPlanId,
    selectPlan,
    togglePlanPhase,
    removePlan,
    planSeed,
    consumePlanSeed,
  } = useStudio();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [images, setImages] = useState<PromptImage[]>([]);
  const category = getCategory(categoryId);

  if (planSeed) {
    setTitle(planSeed.title);
    setBrief(planSeed.brief);
    consumePlanSeed();
  }

  const phaseProgress = useMemo(() => {
    if (!selectedPlan || selectedPlan.phases.length === 0) return 0;
    const done = selectedPlan.phases.filter((phase) => phase.done).length;
    return done / selectedPlan.phases.length;
  }, [selectedPlan]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 border border-line bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Large-product plan
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            For clones, tycoons, ERPs, and anything that would otherwise send you to ChatGPT for a phased build. Name the product, describe the monster, then generate a plan you can check off.
          </p>
        </div>

        {projects.length > 0 ? (
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
              From a saved idea
            </span>
            <select
              value={selected?.id ?? ""}
              onChange={(event) => {
                const id = event.target.value;
                selectProject(id || null);
                const project = projects.find((item) => item.id === id);
                if (!project) return;
                setTitle(project.title);
                setBrief(
                  [project.summary, `MVP: ${project.mvpScope}`, project.architecture]
                    .filter(Boolean)
                    .join("\n\n"),
                );
              }}
              className="mt-2 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">Custom product</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.categoryName ? `${project.categoryName} · ` : ""}
                  {project.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground">
            Product name
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="RollerCoaster Tycoon 2 clone"
            className="mt-2 w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        {category ? (
          <p className="text-sm leading-6 text-muted">
            Industry context: <span className="text-foreground">{category.name}</span>
          </p>
        ) : (
          <p className="text-sm leading-6 text-muted">
            Optional: pick an industry first if this product lives in a vertical.
          </p>
        )}

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

        <ChatComposer
          label="Brief"
          value={brief}
          onChange={setBrief}
          images={images}
          onImagesChange={setImages}
          placeholder="Inspired by RCT2: isometric park, guests, rides, economy. Original art. Solo developer. What is the vertical slice and what do I refuse to build in year one?"
          rows={8}
        />

        <button
          type="button"
          onClick={() => createPlan({ title, brief, images })}
          disabled={planning || (!title.trim() && !brief.trim())}
          className="bg-accent px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {planning ? "Writing plan…" : "Generate plan"}
        </button>
        {error ? <p className="text-sm leading-6 text-accent">{error}</p> : null}
      </aside>

      <section className="min-w-0 space-y-6">
        {plans.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => selectPlan(plan.id)}
                className={`border px-3 py-1.5 text-sm ${
                  plan.id === selectedPlanId
                    ? "border-accent bg-accent-soft"
                    : "border-line text-muted hover:text-foreground"
                }`}
              >
                {plan.title}
              </button>
            ))}
          </div>
        ) : null}

        {!selectedPlan ? (
          <div className="border border-dashed border-line px-6 py-16 text-center">
            <p className="text-lg font-medium">No plan yet</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
              Example: name it “RollerCoaster Tycoon 2 clone”, describe the park loop you actually want, attach a reference screenshot if you have one, and generate. You will get phases, a vertical slice, module layout, and a checklist.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{selectedPlan.title}</h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  {selectedPlan.source === "llm" ? "Live model" : "Built-in planner"}
                  {selectedPlan.categoryName ? ` · ${selectedPlan.categoryName}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removePlan(selectedPlan.id)}
                className="text-sm text-muted hover:text-foreground"
              >
                Remove plan
              </button>
            </div>

            {selectedPlan.phases.length > 0 ? (
              <div className="border border-line bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                    Phases
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                    {selectedPlan.phases.filter((phase) => phase.done).length}/
                    {selectedPlan.phases.length} done
                  </p>
                </div>
                <div className="mt-3 h-2 bg-surface-2">
                  <div
                    className="h-full bg-done"
                    style={{ width: `${Math.round(phaseProgress * 100)}%` }}
                  />
                </div>
                <ol className="mt-4 divide-y divide-line border border-line">
                  {selectedPlan.phases.map((phase) => (
                    <li key={phase.id} className="bg-background">
                      <label className="flex cursor-pointer gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={phase.done}
                          onChange={() => togglePlanPhase(selectedPlan.id, phase.id)}
                          className="mt-1 size-4 accent-accent"
                        />
                        <span>
                          <span
                            className={`block text-sm font-medium ${
                              phase.done ? "text-muted line-through decoration-muted" : ""
                            }`}
                          >
                            {phase.name}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-muted">
                            {phase.goal}
                          </span>
                          {phase.deliverables.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-sm leading-6 text-foreground/90">
                              {phase.deliverables.map((item) => (
                                <li key={item} className="flex gap-2">
                                  <span className="mt-[9px] h-1 w-1 shrink-0 bg-accent" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="border border-line bg-surface p-6 md:p-8">
              <AnalysisView text={selectedPlan.markdown} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
