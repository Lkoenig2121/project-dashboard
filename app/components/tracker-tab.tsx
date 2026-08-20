"use client";

import { useMemo, useState } from "react";
import { DifficultyBadge } from "./idea-card";
import { useStudio } from "./studio-context";

type FilterId = "all" | "open" | "done";

export function TrackerTab() {
  const {
    projects,
    selectedId,
    selectProject,
    toggleDone,
    removeProject,
    openQualities,
    openPlanning,
    setTab,
  } = useStudio();
  const [filter, setFilter] = useState<FilterId>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const doneCount = projects.filter((project) => project.status === "done").length;
  const openCount = projects.length - doneCount;
  const categoriesOnBoard = useMemo(() => {
    const names = new Set(
      projects
        .map((project) => project.categoryName)
        .filter((name): name is string => Boolean(name)),
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [projects]);
  const visible = useMemo(() => {
    return projects.filter((project) => {
      if (filter === "done" && project.status !== "done") return false;
      if (filter === "open" && project.status === "done") return false;
      if (categoryFilter !== "all" && project.categoryName !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [filter, categoryFilter, projects]);

  if (projects.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <p className="text-lg font-medium">Nothing to track yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Generated ideas land here automatically. Check a project off when you have shipped the MVP.
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

  const progress = projects.length === 0 ? 0 : doneCount / projects.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            On the board
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{projects.length}</p>
        </div>
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Still open
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{openCount}</p>
        </div>
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            Checked off
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-done">{doneCount}</p>
        </div>
      </div>

      <div>
        <div className="flex h-2 bg-surface-2">
          <div
            className="h-full bg-done"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {Math.round(progress * 100)}% of saved ideas marked done
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `All (${projects.length})`],
            ["open", `Open (${openCount})`],
            ["done", `Done (${doneCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`border px-3 py-1.5 text-sm ${
              filter === id
                ? "border-accent bg-accent-soft"
                : "border-line text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        {categoriesOnBoard.length > 1 ? (
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">All industries</option>
            {categoriesOnBoard.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <ol className="divide-y divide-line border border-line">
        {visible.map((project) => (
          <li key={project.id} className="bg-surface">
            <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start">
              <label className="flex cursor-pointer items-start gap-3 md:w-72 md:shrink-0">
                <input
                  type="checkbox"
                  checked={project.status === "done"}
                  onChange={() => toggleDone(project.id)}
                  className="mt-1 size-4 accent-accent"
                />
                <span>
                  <span
                    className={`block font-medium ${
                      project.status === "done"
                        ? "text-muted line-through decoration-muted"
                        : ""
                    }`}
                  >
                    {project.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <DifficultyBadge value={project.difficulty} />
                    {project.categoryName ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                        {project.categoryName}
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                      {project.estimatedWeeks} wk
                    </span>
                  </span>
                </span>
              </label>
              <p className="min-w-0 flex-1 text-sm leading-6 text-muted">
                {project.summary}
              </p>
              <div className="flex shrink-0 flex-wrap gap-3 md:justify-end">
                <button
                  type="button"
                  onClick={() => openQualities(project.id)}
                  className="text-sm text-accent underline-offset-4 hover:underline"
                >
                  Qualities
                </button>
                <button
                  type="button"
                  onClick={() => openPlanning(project.id)}
                  className="text-sm text-accent underline-offset-4 hover:underline"
                >
                  Plan
                </button>
                <button
                  type="button"
                  onClick={() => selectProject(project.id)}
                  className="text-sm text-muted hover:text-foreground"
                >
                  {selectedId === project.id ? "Selected" : "Select"}
                </button>
                <button
                  type="button"
                  onClick={() => removeProject(project.id)}
                  className="text-sm text-muted hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
