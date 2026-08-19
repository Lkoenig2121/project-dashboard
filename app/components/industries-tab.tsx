"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_GROUPS, getCategory } from "@/lib/categories";
import { useStudio } from "./studio-context";

export function IndustriesTab() {
  const { categoryId, chooseIndustry, projects } = useStudio();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const project of projects) {
      if (!project.categoryId) continue;
      map.set(project.categoryId, (map.get(project.categoryId) ?? 0) + 1);
    }
    return map;
  }, [projects]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATEGORIES.filter((category) => {
      if (groupFilter !== "all" && category.group !== groupFilter) return false;
      if (!needle) return true;
      const hay = `${category.name} ${category.group} ${category.description} ${category.actors.join(" ")} ${category.objects.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [query, groupFilter]);

  const grouped = useMemo(() => {
    return CATEGORY_GROUPS.map((group) => ({
      group,
      items: visible.filter((category) => category.group === group),
    })).filter((entry) => entry.items.length > 0);
  }, [visible]);

  const selected = getCategory(categoryId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            {CATEGORIES.length} industries
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Pick a vertical. Ideas, qualities, and check-off tracking stay scoped to how that industry actually works — hospitals, ledgers, hangars, not a generic todo app.
          </p>
        </div>
        {selected ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Selected · {selected.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search industries</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search healthcare, logistics, IAM…"
            className="w-full border border-line bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Filter by group</span>
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="w-full border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="all">All groups</option>
            {CATEGORY_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      </div>

      {grouped.length === 0 ? (
        <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
          No industries match that search.
        </p>
      ) : (
        grouped.map((entry) => (
          <section key={entry.group}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {entry.group}
              <span className="ml-2 text-muted">{entry.items.length}</span>
            </h2>
            <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {entry.items.map((category) => {
                const on = category.id === categoryId;
                const saved = counts.get(category.id) ?? 0;
                return (
                  <li key={category.id}>
                    <button
                      type="button"
                      onClick={() => chooseIndustry(category.id)}
                      className={`flex h-full w-full flex-col items-start gap-2 border p-4 text-left ${
                        on
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-surface hover:border-muted"
                      }`}
                    >
                      <span className="flex w-full items-start justify-between gap-3">
                        <span className="font-medium leading-6">{category.name}</span>
                        {saved > 0 ? (
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                            {saved} saved
                          </span>
                        ) : null}
                      </span>
                      <span className="text-sm leading-6 text-muted">
                        {category.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
