"use client";

import { GenerateTab } from "./generate-tab";
import { IndustriesTab } from "./industries-tab";
import { PlanningTab } from "./planning-tab";
import { QualitiesTab } from "./qualities-tab";
import { StudioProvider, useStudio, type TabId } from "./studio-context";
import { TrackerTab } from "./tracker-tab";

const TABS: { id: TabId; label: string; hint: string }[] = [
  { id: "industries", label: "Industries", hint: "100 verticals" },
  { id: "generate", label: "Generate", hint: "Stack + ideas" },
  { id: "qualities", label: "Qualities", hint: "Prompt a brief" },
  { id: "planning", label: "Planning", hint: "Large products" },
  { id: "tracker", label: "Tracker", hint: "Check off done" },
];

function StudioShell() {
  const { tab, setTab, projects, llmEnabled, llmModel, ready } = useStudio();
  const done = projects.filter((project) => project.status === "done").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            Project studio
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Ideas you can actually start
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Pick an industry, generate ideas, decode qualities, write a phased plan for huge products, then check work off when it ships.
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {ready ? `${projects.length} saved · ${done} done` : "Loading"}
          </p>
          <p className="text-xs text-muted">
            {llmEnabled
              ? `Live model · ${llmModel ?? "OpenAI"}`
              : "Built-in generator · add OPENAI_API_KEY for a live model"}
          </p>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Studio sections"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-line"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`tab-${item.id}`}
              aria-controls={`panel-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-left ${
                selected
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em]">
                {item.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="flex-1 py-8"
      >
        {tab === "industries" ? <IndustriesTab /> : null}
        {tab === "generate" ? <GenerateTab /> : null}
        {tab === "qualities" ? <QualitiesTab /> : null}
        {tab === "planning" ? <PlanningTab /> : null}
        {tab === "tracker" ? <TrackerTab /> : null}
      </div>
    </div>
  );
}

export function Studio() {
  return (
    <StudioProvider>
      <StudioShell />
    </StudioProvider>
  );
}
