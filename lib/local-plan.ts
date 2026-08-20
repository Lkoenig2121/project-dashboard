import { getCategory } from "./categories";
import { describeArchitecture } from "./local-studio";
import type { PlanPhase, PlanRequest, ProductPlan } from "./types";

type PlanKind = "simulation-game" | "marketplace" | "platform" | "enterprise" | "general";

type DraftPhase = Omit<PlanPhase, "id" | "done">;

function hay(request: PlanRequest) {
  return `${request.title} ${request.brief}`.toLowerCase();
}

function detectKind(request: PlanRequest): PlanKind {
  const text = hay(request);
  if (
    /(tycoon|roller.?coaster|rct|theme park|city builder|sim(?:ulation)?|clone|game engine|sandbox park|factorio|zoo tycoon|guest ai|ride)/.test(
      text,
    )
  ) {
    return "simulation-game";
  }
  if (/(marketplace|two-sided|buyers and sellers|gig platform)/.test(text)) {
    return "marketplace";
  }
  if (/(operating system|platform|multi-tenant os|app store|plugin)/.test(text)) {
    return "platform";
  }
  if (/(erp|hospital|bank|insurance|warehouse|supply chain|government)/.test(text)) {
    return "enterprise";
  }
  return "general";
}

function stackLine(request: PlanRequest) {
  const techs =
    request.technologies.length > 0
      ? request.technologies.join(", ")
      : "TypeScript and a small HTTP API";
  return `${techs}. ${describeArchitecture(request.technologies)}`;
}

function withIds(phases: DraftPhase[]): PlanPhase[] {
  return phases.map((phase, index) => ({
    ...phase,
    id: `phase-${index + 1}`,
    done: false,
  }));
}

function section(title: string, body: string) {
  return `## ${title}\n\n${body.trim()}`;
}

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function simulationPlan(request: PlanRequest): { markdown: string; phases: DraftPhase[] } {
  const name = request.title.trim() || "Park simulation";
  const brief =
    request.brief.trim() ||
    "A tycoon-style park builder inspired by classic isometric park games: terrain, rides, paths, guests, and a working economy — original art and audio only.";

  const phases: DraftPhase[] = [
    {
      name: "Phase 0 — Constraints and reference",
      goal: "Write down the loop you are cloning, and the legal/scope fences, before any engine work.",
      deliverables: [
        "One-page design: camera, grid, one ride, guests, money",
        "Non-goals: no 1:1 asset clone, no multiplayer, no scenario editor in v1",
        "Reference notes on tick rate, tile size, and what 'fun' means in week 8",
      ],
    },
    {
      name: "Phase 1 — Engine loop",
      goal: "A window that ticks, renders a grid, and pans/zooms. Nothing else.",
      deliverables: [
        "Fixed timestep (update) + interpolated render",
        "Camera pan/zoom and a debug overlay (FPS, tick, hovered tile)",
        "Empty map of N×N tiles you can paint with two terrain types",
      ],
    },
    {
      name: "Phase 2 — World representation",
      goal: "The map is data, not a drawing. Saves must round-trip.",
      deliverables: [
        "Tile struct: height, surface, path flag, occupancy",
        "New / save / load a park file (JSON or binary)",
        "Path tiles that guests will later walk",
      ],
    },
    {
      name: "Phase 3 — Vertical slice: one ride",
      goal: "One ride type that can be placed, opened, and occupied by a dummy guest.",
      deliverables: [
        "Place a ride from a build tool onto valid tiles",
        "Ride states: closed, testing, open, broken",
        "A guest spawns, walks a path, queues, rides, leaves",
      ],
    },
    {
      name: "Phase 4 — Economy stub",
      goal: "Money exists so later systems have something to optimize.",
      deliverables: [
        "Park cash, ride price, and a simple loan or starting grant",
        "Guest will not enter if they cannot pay",
        "End-of-month summary: guests, rides, cash",
      ],
    },
    {
      name: "Phase 5 — Building tools",
      goal: "The player can author the park, not just debug-spawn it.",
      deliverables: [
        "Brush for terrain and paths",
        "Demolish and rotate",
        "Invalid placement feedback (slope, overlap, no path)",
      ],
    },
    {
      name: "Phase 6 — Guests and thoughts",
      goal: "Guests are the sim. Happiness, hunger, bathroom, and nausea are enough.",
      deliverables: [
        "Needs that decay; shops or stalls as later stretch",
        "Thoughts as debug text, then a tiny bubble",
        "Spawn rate tied to park rating stub",
      ],
    },
    {
      name: "Phase 7 — Content and scenarios",
      goal: "A second ride family and a start park, not a CMS.",
      deliverables: [
        "Two ride archetypes (gentle + tracked or tracked + stall)",
        "One hand-authored starting park",
        "Win/lose or 'park value' so a session has an ending",
      ],
    },
  ];

  const markdown = [
    section(
      "Thesis",
      `${name} is a large product because the fun is a closed loop: build → guests arrive → rides make money → you build more. If any one of those is fake, it feels like a map editor.\n\n${brief}\n\nStack: ${stackLine(request)}`,
    ),
    section(
      "What this is not",
      list([
        "Not a 1:1 clone of RollerCoaster Tycoon 2 assets, names, or scenario packs. Inspired-by systems only.",
        "Not a 3D theme-park MMO. Isometric or 2.5D is enough.",
        "Not multiplayer, UGC workshops, or a full campaign in the first year.",
        "Not 'all ride types.' One working ride beats twenty sprites.",
      ]),
    ),
    section(
      "Core systems (build in this order)",
      numbered([
        "Game loop and camera — if this is wrong, everything downstream jitter-bugs.",
        "Tile world + persistence — the park is a save file, not a screenshot.",
        "Pathfinding on path tiles — guests are the product.",
        "Ride as a state machine with a queue and a vehicle/seat.",
        "Economy numbers that guests actually obey.",
        "Authoring tools so you stop using debug cheats.",
        "Needs/AI and a second content type.",
      ]),
    ),
    section(
      "Vertical slice (the only honest demo)",
      `A 32×32 park, a path from gate to one ride, one guest who pays, rides, and leaves, and a cash counter that moves. If that loop is not fun to watch, do not add shops, coaster track pieces, or a scenario editor.\n\nExit criteria: someone who has never seen the code can place the ride, open it, and watch a guest complete a cycle without you explaining.`,
    ),
    section(
      "Suggested modules",
      list([
        "`engine/` — clock, input, camera, renderer (Canvas 2D or WebGL/Pixi first)",
        "`world/` — tiles, park, save format",
        "`sim/` — guests, rides, money, monthly tick",
        "`tools/` — build, demolish, inspect",
        "`ui/` — HUD, build panel, park window (can be DOM/Next.js over the canvas)",
        "`content/` — ride definitions as data, not hardcoded sprites in the sim",
      ]),
    ),
    section(
      "Data to freeze early",
      list([
        "Tile: x, y, height, surface, flags",
        "Ride: id, type, origin, rotation, status, price, queue tiles",
        "Guest: id, tile, heading, cash, hunger, happiness, current goal",
        "Park: cash, name, date, map size, weather stub",
      ]),
    ),
    section(
      "Risks that kill clones",
      list([
        "Art-first: drawing 80 rides before pathfinding works.",
        "Engine-first forever: rewriting the renderer instead of shipping a guest.",
        "Pixel-perfect RCT2: you will lose years and still look like a fangame.",
        "Floating-point pathing: guests stuck on tile corners. Prefer grid A* on path tiles.",
        "Variable timestep physics: desyncs and 'game feels different on 144 Hz.' Fix the tick.",
      ]),
    ),
    section(
      "First ten days",
      numbered([
        "Day 1–2: empty canvas, camera, 16×16 grass grid.",
        "Day 3–4: paint path tiles; hover shows coordinates.",
        "Day 5–6: save/load that grid.",
        "Day 7–8: place a 2×2 'ride' rectangle that highlights invalid tiles.",
        "Day 9–10: spawn one agent that walks the path using A*.",
      ]),
    ),
    section(
      "Staffing",
      `Solo: you are the engine and the designer. Cap content at one ride until the slice is done.\n\nTwo people: one owns sim + save; one owns tools + HUD. Do not split 'art' until phase 3 exists.\n\nA year is realistic for a tiny park that feels like a game. Three months is realistic for the vertical slice if you do not open Photoshop in week one.`,
    ),
  ].join("\n\n");

  return { markdown, phases };
}

function marketplacePlan(request: PlanRequest): { markdown: string; phases: DraftPhase[] } {
  const name = request.title.trim() || "Marketplace";
  const phases: DraftPhase[] = [
    { name: "Phase 0 — Two-sided contract", goal: "Name supply, demand, and the unit of work.", deliverables: ["Who lists", "Who buys", "What 'complete' means"] },
    { name: "Phase 1 — Accounts and listing", goal: "One provider can publish one listing.", deliverables: ["Auth", "Listing CRUD", "Public detail page"] },
    { name: "Phase 2 — Request and accept", goal: "A customer can request; a provider can accept.", deliverables: ["Request flow", "Status machine", "Both dashboards"] },
    { name: "Phase 3 — Completion and trust", goal: "The job can finish and be rated.", deliverables: ["Complete state", "Review", "Dispute stub"] },
    { name: "Phase 4 — Money", goal: "Payouts exist, even if Stripe is test-mode.", deliverables: ["Price on listing", "Checkout or stub", "Provider balance"] },
    { name: "Phase 5 — Search and density", goal: "The catalog is usable when there are 50 listings.", deliverables: ["Filters", "Geo or category", "Empty states"] },
    { name: "Phase 6 — Ops", goal: "You can moderate without SQL.", deliverables: ["Admin flags", "Audit log", "Take-down"] },
  ];
  const markdown = [
    section("Thesis", `${name} only works when both sides get value in the same week. ${request.brief || "A two-sided product."}\n\nStack: ${stackLine(request)}`),
    section("What this is not", list(["Not a generic CRUD app with two user roles.", "Not ads or feeds until jobs complete.", "Not full KYC in phase 1."])),
    section("Vertical slice", "Provider lists, customer books, both see 'done'. Everything else waits."),
    section("Risks", list(["Chicken-egg: seed one city or one niche.", "Payments too early: fake money until the job state is real.", "Trust too late: a rating after complete is cheaper than messaging."])),
  ].join("\n\n");
  return { markdown, phases };
}

function platformPlan(request: PlanRequest): { markdown: string; phases: DraftPhase[] } {
  const name = request.title.trim() || "Platform";
  const phases: DraftPhase[] = [
    { name: "Phase 0 — Kernel", goal: "Identity, tenant, and an audit log.", deliverables: ["Tenant record", "Membership", "Audit events"] },
    { name: "Phase 1 — One app", goal: "A single workflow inside the shell.", deliverables: ["Navigation", "One resource", "Permissions"] },
    { name: "Phase 2 — Extensibility", goal: "A second module without forking the kernel.", deliverables: ["Module interface", "Feature flag", "Isolation"] },
    { name: "Phase 3 — Lifecycle", goal: "Invite, suspend, export.", deliverables: ["Invites", "Roles", "Data export"] },
    { name: "Phase 4 — Scale seams", goal: "You know what will break at 10×.", deliverables: ["Job queue", "Idempotency", "Rate limits"] },
  ];
  const markdown = [
    section("Thesis", `${name} is large because every later product sits on identity and tenancy. ${request.brief || ""}\n\nStack: ${stackLine(request)}`),
    section("Vertical slice", "One tenant, two users, one permissioned action, an audit row."),
    section("Non-goals", list(["Not a plugin marketplace in v1.", "Not custom theming.", "Not every enterprise SSO on day one."])),
  ].join("\n\n");
  return { markdown, phases };
}

function enterprisePlan(request: PlanRequest): { markdown: string; phases: DraftPhase[] } {
  const name = request.title.trim() || "Operations platform";
  const category = getCategory(request.categoryId);
  const phases: DraftPhase[] = [
    { name: "Phase 0 — Domain language", goal: "The nouns match the industry, not 'items'.", deliverables: ["Glossary", "Happy-path story", "Compliance fence"] },
    { name: "Phase 1 — System of record", goal: "Create, list, update the primary entity.", deliverables: ["Primary table", "Audit", "Search"] },
    { name: "Phase 2 — Workflow", goal: "Status changes are explicit and reversible where needed.", deliverables: ["State machine", "Inbox", "Assignment"] },
    { name: "Phase 3 — Roles", goal: "Staff vs customer vs admin are not the same screen.", deliverables: ["RBAC", "Gated writes", "Public vs private"] },
    { name: "Phase 4 — Reporting", goal: "One dashboard the operator would actually open.", deliverables: ["Date window", "One KPI", "Export"] },
    { name: "Phase 5 — Integrations", goal: "One inbound or outbound feed, not five.", deliverables: ["Idempotent ingest", "Failure queue"] },
  ];
  const markdown = [
    section(
      "Thesis",
      `${name} is large because ${category ? category.description : "the domain has real-world consequences."}\n\n${request.brief || ""}\n\nStack: ${stackLine(request)}`,
    ),
    section("Vertical slice", "One record type, one status change, two roles, an audit trail. Charts wait."),
    section("Risks", list(["Modeling the whole hospital/bank on week one.", "Permissions after features.", "Reports with no source-of-truth."])),
  ].join("\n\n");
  return { markdown, phases };
}

function generalPlan(request: PlanRequest): { markdown: string; phases: DraftPhase[] } {
  const name = request.title.trim() || "Large product";
  const phases: DraftPhase[] = [
    { name: "Phase 0 — Problem and fences", goal: "Write the user, the job, and what you will not build.", deliverables: ["Problem statement", "Non-goals", "Success metric"] },
    { name: "Phase 1 — Walking skeleton", goal: "UI talks to an API and persists one record.", deliverables: ["Deployable app", "One entity", "Health check"] },
    { name: "Phase 2 — Core workflow", goal: "A user can complete the job without you at the keyboard.", deliverables: ["Happy path", "Empty states", "Basic auth"] },
    { name: "Phase 3 — Hard cases", goal: "The complexity drivers are real, not slides.", deliverables: ["Edge cases", "Permissions", "History"] },
    { name: "Phase 4 — Operability", goal: "You can see failures and ship again.", deliverables: ["Logs", "Backups", "A staging environment"] },
    { name: "Phase 5 — Expansion", goal: "A second surface only after the first is boringly solid.", deliverables: ["Next module", "Migration notes"] },
  ];
  const markdown = [
    section("Thesis", `${name} is too big to 'just start coding.' Treat it as a sequence of products that share a kernel.\n\n${request.brief || ""}\n\nStack: ${stackLine(request)}`),
    section("Rule", "Each phase has an exit criterion you can demo. If you cannot demo it, it is not done — it is a branch."),
    section("First ten days", numbered(["Write the non-goals.", "Ship a walking skeleton.", "Complete the happy path on fake data.", "Persist it.", "Show it to one other person."])),
  ].join("\n\n");
  return { markdown, phases };
}

const BUILDERS: Record<PlanKind, (request: PlanRequest) => { markdown: string; phases: DraftPhase[] }> = {
  "simulation-game": simulationPlan,
  marketplace: marketplacePlan,
  platform: platformPlan,
  enterprise: enterprisePlan,
  general: generalPlan,
};

export function planProductLocally(request: PlanRequest): Pick<ProductPlan, "title" | "brief" | "technologies" | "categoryId" | "categoryName" | "markdown" | "phases"> {
  const title = request.title.trim() || "Untitled large product";
  const kind = detectKind(request);
  const built = BUILDERS[kind](request);
  const category = getCategory(request.categoryId);
  const imageNote =
    request.images.length > 0
      ? `\n\n## Reference images\n\nThe builder attached: ${request.images.map((image) => image.name).join(", ")}. Treat those as the look, HUD, or reference product. Do not copy proprietary pixels — copy the information architecture.`
      : "";

  return {
    title,
    brief: request.brief.trim(),
    technologies: request.technologies,
    categoryId: request.categoryId,
    categoryName: category?.name ?? null,
    markdown: `${built.markdown}${imageNote}\n\n## Kind\n\nPlanned as a **${kind}** because of the title and brief. If that is wrong, say so in the prompt and regenerate.`,
    phases: withIds(built.phases),
  };
}

export function planFromLlmPayload(
  payload: Record<string, unknown>,
  request: PlanRequest,
): Pick<ProductPlan, "title" | "brief" | "technologies" | "categoryId" | "categoryName" | "markdown" | "phases"> | null {
  const markdown = typeof payload.markdown === "string" ? payload.markdown.trim() : "";
  if (!markdown) return null;
  const title =
    (typeof payload.title === "string" && payload.title.trim()) ||
    request.title.trim() ||
    "Untitled large product";
  const rawPhases = Array.isArray(payload.phases) ? payload.phases : [];
  const phases: DraftPhase[] = rawPhases
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const phase = item as Record<string, unknown>;
      const name = typeof phase.name === "string" ? phase.name.trim() : "";
      const goal = typeof phase.goal === "string" ? phase.goal.trim() : "";
      if (!name || !goal) return null;
      const deliverables = Array.isArray(phase.deliverables)
        ? phase.deliverables.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        : [];
      return { name, goal, deliverables };
    })
    .filter((item): item is DraftPhase => item !== null);

  const fallback = planProductLocally(request);
  const category = getCategory(request.categoryId);

  return {
    title,
    brief: request.brief.trim(),
    technologies: request.technologies,
    categoryId: request.categoryId,
    categoryName: category?.name ?? null,
    markdown,
    phases: withIds(phases.length > 0 ? phases : fallback.phases.map(({ name, goal, deliverables }) => ({ name, goal, deliverables }))),
  };
}
