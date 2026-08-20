export type TechGroup = {
  label: string;
  items: string[];
};

export const TECH_GROUPS: TechGroup[] = [
  {
    label: "Frontend",
    items: [
      "Next.js",
      "React",
      "Vue",
      "Svelte",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
    ],
  },
  {
    label: "Backend",
    items: ["Node.js", "Express", "Fastify", "NestJS", "Python", "FastAPI"],
  },
  {
    label: "Data",
    items: ["PostgreSQL", "SQLite", "MongoDB", "Prisma", "Drizzle", "Redis"],
  },
  {
    label: "Product extras",
    items: ["Auth.js", "Stripe", "Docker", "tRPC", "WebSockets"],
  },
  {
    label: "Client runtime",
    items: ["Canvas 2D", "WebGL", "Three.js", "PixiJS", "Electron", "Tauri"],
  },
];

export const DEFAULT_TECHS = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "Express",
];

export const ALL_TECHS = TECH_GROUPS.flatMap((group) => group.items);
