"use client";

import type { ProjectIdea } from "@/lib/types";

const DIFFICULTY_CLASS: Record<ProjectIdea["difficulty"], string> = {
  beginner: "text-done",
  intermediate: "text-accent",
  advanced: "text-foreground",
};

export function DifficultyBadge({ value }: { value: ProjectIdea["difficulty"] }) {
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-[0.14em] ${DIFFICULTY_CLASS[value]}`}
    >
      {value}
    </span>
  );
}

export function IdeaCard({
  project,
  selected,
  onSelect,
  onToggleDone,
  onOpenQualities,
  onRemove,
}: {
  project: ProjectIdea;
  selected?: boolean;
  onSelect?: () => void;
  onToggleDone: () => void;
  onOpenQualities: () => void;
  onRemove: () => void;
}) {
  const done = project.status === "done";

  return (
    <article
      className={`flex flex-col gap-4 border p-5 ${
        selected ? "border-accent bg-accent-soft" : "border-line bg-surface"
      } ${done ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <DifficultyBadge value={project.difficulty} />
            {project.categoryName ? (
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
                {project.categoryName}
              </span>
            ) : null}
          </div>
          <h3
            className={`mt-1 text-lg font-semibold tracking-tight ${
              done ? "line-through decoration-muted" : ""
            }`}
          >
            {project.title}
          </h3>
        </div>
        <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          {project.estimatedWeeks} wk
        </p>
      </div>

      <p className="text-sm leading-6 text-muted">{project.summary}</p>

      <ul className="flex flex-wrap gap-1.5">
        {project.technologies.slice(0, 5).map((tech) => (
          <li
            key={tech}
            className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>

      <ul className="space-y-1 text-sm leading-6 text-foreground/90">
        {project.features.slice(0, 3).map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-[9px] h-1 w-1 shrink-0 bg-accent" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={done}
            onChange={onToggleDone}
            className="size-4 accent-accent"
          />
          Done
        </label>
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Select
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenQualities}
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          Decode qualities
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-sm text-muted hover:text-foreground"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

export function AnalysisView({ text }: { text: string }) {
  const blocks = text.split(/^## /m).filter((block) => block.trim().length > 0);

  if (blocks.length === 0) {
    return <p className="whitespace-pre-wrap text-sm leading-7 text-muted">{text}</p>;
  }

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        const [titleLine, ...rest] = block.split("\n");
        const body = rest.join("\n").trim();
        return (
          <section key={titleLine}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {titleLine.trim()}
            </h3>
            <div className="mt-3 space-y-3 text-sm leading-7 text-foreground/90">
              {body.split(/\n\n+/).map((paragraph, index) => (
                <p key={`${titleLine}-${index}`} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
