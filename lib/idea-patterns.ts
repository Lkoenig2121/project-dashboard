import { pick, shortName, type Category } from "./categories";
import type { Difficulty } from "./types";

export type IdeaPattern = {
  id: string;
  difficulty: Difficulty;
  weeks: [number, number];
  learning: string[];
  complexity: string[];
  build: (category: Category) => {
    title: string;
    pitch: string;
    features: string[];
    audience: string;
    mvp: string;
    dataModel: string;
  };
};

function join(items: string[], max = 3) {
  return items.slice(0, max).join(", ");
}

function cap(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const IDEA_PATTERNS: IdeaPattern[] = [
  {
    id: "customer-portal",
    difficulty: "beginner",
    weeks: [2, 4],
    learning: [
      "Role-aware views",
      "Account-scoped lists",
      "Form-to-record flows",
      "Status communication",
    ],
    complexity: [
      "One identity seeing only their records",
      "Empty states for first login",
      "Status that matches staff-side truth",
    ],
    build: (category) => {
      const name = shortName(category);
      const record = pick(category.objects, 0);
      const secondary = pick(category.objects, 1);
      const who =
        category.customer.split(" ").length > 3 ? "Member" : cap(category.customer);
      return {
        title: `${name} ${who} Portal`,
        pitch: `A signed-in home for ${category.customer} to see ${record} and ${secondary}, request changes, and follow status — scoped to this ${name.toLowerCase()} domain instead of a generic account page.`,
        features: [
          `Profile and ${record} list for ${category.customer}`,
          `Request or update ${secondary}`,
          "Status timeline the person can actually understand",
          "Message or note back to staff",
        ],
        audience: `${cap(category.customer)} who should not need a staff login`,
        mvp: `Sign in as ${category.customer}, see your ${record}, submit one request, watch it change status.`,
        dataModel: `${category.customer} accounts, ${record}, ${secondary}, statusEvents, messages`,
      };
    },
  },
  {
    id: "public-catalog",
    difficulty: "beginner",
    weeks: [1, 3],
    learning: [
      "Search and filters",
      "Detail pages",
      "Editorial vs user content",
      "Empty and sparse catalogs",
    ],
    complexity: [
      "Useful filters for this industry, not generic tags",
      "Stale listings",
      "Public vs gated detail",
    ],
    build: (category) => {
      const name = shortName(category);
      const listing = pick(category.objects, 0);
      return {
        title: `${name} Discovery Catalog`,
        pitch: `A public browse-and-search surface for ${listing} and related ${pick(category.objects, 1)} in ${name.toLowerCase()}, so ${category.customer} can find something real before any account is required.`,
        features: [
          `Searchable ${listing} directory`,
          "Filters that match how this industry actually shops",
          "Detail page with hours, status, or availability",
          "Save or share a listing",
        ],
        audience: `${cap(category.customer)} exploring before they commit`,
        mvp: `List ${listing}, filter them, open a detail page, save one.`,
        dataModel: `${listing}, locations-or-owners, tags, savedItems`,
      };
    },
  },
  {
    id: "ops-console",
    difficulty: "intermediate",
    weeks: [3, 6],
    learning: [
      "Operational queues",
      "Staff assignment",
      "Day-of dashboards",
      "Exception handling",
    ],
    complexity: [
      "Work piling up in the wrong queue",
      "Who owns an item right now",
      "End-of-day leftover work",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Operations Console`,
        pitch: `A staff board for ${category.staff} to run ${join(category.objects)} without a shared spreadsheet — queues, owners, and today's exceptions for ${name.toLowerCase()} work.`,
        features: [
          `Inbox of ${pick(category.objects, 1)} needing action`,
          `Assign work to ${category.staff}`,
          "Today vs overdue split",
          `Notes against ${pick(category.objects, 0)}`,
        ],
        audience: category.staff,
        mvp: `A queue of ${pick(category.objects, 1)}, claim one, change status, leave a note.`,
        dataModel: `staff, ${join(category.objects, 4)}, assignments, notes`,
      };
    },
  },
  {
    id: "scheduler",
    difficulty: "intermediate",
    weeks: [3, 6],
    learning: [
      "Availability rules",
      "Conflict detection",
      "Public vs staff booking",
      "Time-zone-safe slots",
    ],
    complexity: [
      "Double-booking",
      "Cancellations that free capacity",
      "Resources that are not just people",
    ],
    build: (category) => {
      const name = shortName(category);
      const bookable = pick(category.objects, 1);
      return {
        title: `${name} Scheduling Desk`,
        pitch: `Book ${bookable} against real availability for ${category.actors[0]} and ${category.customer}, with conflict checks instead of calendar guesswork.`,
        features: [
          `Weekly availability for ${category.staff}`,
          `Book ${bookable} without overlaps`,
          "Cancel / reschedule that frees the slot",
          "Day sheet for who is coming",
        ],
        audience: `${category.staff} and ${category.customer}`,
        mvp: `Set hours, show open slots, create a booking for ${bookable}, block the time.`,
        dataModel: `resources, weeklyRules, bookings (${bookable}), customers, cancellations`,
      };
    },
  },
  {
    id: "records",
    difficulty: "intermediate",
    weeks: [3, 6],
    learning: [
      "Document-adjacent records",
      "Audit-friendly updates",
      "Search across files and fields",
      "Least-privilege reads",
    ],
    complexity: [
      "Who may see which record",
      "Partial updates vs full replace",
      "History that is actually useful",
    ],
    build: (category) => {
      const name = shortName(category);
      const record = pick(category.objects, 0);
      return {
        title: `${name} Records System`,
        pitch: `A system of record for ${record} and ${pick(category.objects, 2)} used by ${category.staff}, with search, history, and access that matches ${name.toLowerCase()} reality — not a generic CMS.`,
        features: [
          `Create and version ${record}`,
          "Full-text search across records",
          "Change history per record",
          `Link related ${pick(category.objects, 1)}`,
        ],
        audience: category.staff,
        mvp: `Create ${record}, edit it, see history, find it by search.`,
        dataModel: `${record}, related ${pick(category.objects, 1)}, versions, accessGrants`,
      };
    },
  },
  {
    id: "intake",
    difficulty: "intermediate",
    weeks: [2, 5],
    learning: [
      "Multi-step workflows",
      "Validation that matches policy",
      "Staff review queues",
      "Applicant status",
    ],
    complexity: [
      "Incomplete applications",
      "Duplicate submissions",
      "Reviewer SLAs",
    ],
    build: (category) => {
      const name = shortName(category);
      const application = pick(category.objects, 1);
      return {
        title: `${name} Intake Workflow`,
        pitch: `A guided application for ${category.customer} to submit ${application}, then a review lane for ${category.staff} to accept, request info, or close it.`,
        features: [
          `Multi-step ${application} form`,
          "Save draft and resume",
          "Staff review with request-more-info",
          "Applicant status page",
        ],
        audience: `${cap(category.customer)} applying; ${category.staff} reviewing`,
        mvp: `Submit ${application}, staff changes status, applicant sees the new state.`,
        dataModel: `applicants, ${application}, formSteps, reviewActions, messages`,
      };
    },
  },
  {
    id: "billing",
    difficulty: "intermediate",
    weeks: [3, 6],
    learning: [
      "Money math",
      "Status of invoices or claims",
      "Printable documents",
      "Partial payments",
    ],
    complexity: [
      "Rounding and taxes optional",
      "What paid means in this industry",
      "Corrections after send",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Billing Ledger`,
        pitch: `Invoices, claims, or dues for ${name.toLowerCase()} — line items tied to ${pick(category.objects, 0)}, status, and a printable record ${category.customer} can keep.`,
        features: [
          `Line items against ${pick(category.objects, 0)}`,
          "Draft / sent / paid states",
          "Printable statement",
          "Record a payment",
        ],
        audience: `${category.staff} collecting; ${category.customer} paying`,
        mvp: `Create a statement, mark it sent, record a payment, print it.`,
        dataModel: `parties, statements, lineItems, payments, ${pick(category.objects, 0)}`,
      };
    },
  },
  {
    id: "field-app",
    difficulty: "intermediate",
    weeks: [3, 6],
    learning: [
      "Mobile-first task lists",
      "Offline-tolerant checklists",
      "Photo or note capture",
      "Handoff back to HQ",
    ],
    complexity: [
      "Bad connectivity",
      "Work completed out of order",
      "What HQ sees vs what the field sees",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Field Companion`,
        pitch: `A day-of list for ${category.staff} in the field — today's ${pick(category.objects, 1)}, checklists, a note or photo, and a handoff back to the ${name.toLowerCase()} desk.`,
        features: [
          "Today's assigned work",
          "On-site checklist",
          "Note or photo capture",
          "Mark complete so the desk updates",
        ],
        audience: category.staff,
        mvp: `See today's jobs, complete a checklist, send a note back to the desk.`,
        dataModel: `staff, jobs (${pick(category.objects, 1)}), checklistItems, attachments, completions`,
      };
    },
  },
  {
    id: "live-status",
    difficulty: "advanced",
    weeks: [4, 8],
    learning: [
      "Live updates",
      "Presence or unit state",
      "Event logs",
      "Degraded connection UX",
    ],
    complexity: [
      "Stale positions",
      "Burst of events",
      "Who is allowed to see live data",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Live Status Board`,
        pitch: `A live wall for ${join(category.actors, 2)} showing where ${pick(category.objects, 0)} stand right now — useful in ${name.toLowerCase()} when waiting on a spreadsheet is too slow.`,
        features: [
          `Live list of ${pick(category.objects, 0)} by status`,
          "Event log as things move",
          "Filter to a site, unit, or person",
          "Alert when something sits too long",
        ],
        audience: category.staff,
        mvp: `Two sessions share status; an update on one appears on the other without refresh.`,
        dataModel: `${pick(category.objects, 0)}, statusSnapshots, events, watchers`,
      };
    },
  },
  {
    id: "analytics",
    difficulty: "advanced",
    weeks: [4, 7],
    learning: [
      "Event ingest",
      "Saved queries",
      "Dashboard tiles",
      "Date windows that match the domain",
    ],
    complexity: [
      "High-cardinality dimensions",
      "What success means in this industry",
      "Slow aggregations",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Performance Analytics`,
        pitch: `Ingest ${name.toLowerCase()} events around ${join(category.objects, 2)} and let ${category.staff} pin the metrics they actually run the operation on.`,
        features: [
          `Ingest events for ${pick(category.objects, 0)}`,
          "Date-windowed dashboard",
          "One saved query per core metric",
          "Export a weekly snapshot",
        ],
        audience: `${category.staff} who currently live in spreadsheets`,
        mvp: `Post events, show counts by type, pin one tile, change the date range.`,
        dataModel: `events, dimensions, savedQueries, dashboards, tiles`,
      };
    },
  },
  {
    id: "marketplace",
    difficulty: "advanced",
    weeks: [5, 9],
    learning: [
      "Two-sided accounts",
      "Listing and demand",
      "Matching or booking",
      "Trust (reviews, disputes)",
    ],
    complexity: [
      "Both sides must get value in the MVP",
      "Payments as a stub vs real",
      "Disputes after the fact",
    ],
    build: (category) => {
      const name = shortName(category);
      const supply = category.staff;
      const demand = category.customer;
      return {
        title: `${name} Two-Sided Marketplace`,
        pitch: `Match ${demand} with ${supply} around ${pick(category.objects, 0)} — listings, a request or booking, and a completion state built for ${name.toLowerCase()} instead of a generic gig app.`,
        features: [
          `Supply profiles for ${supply}`,
          `Demand requests from ${demand}`,
          "Accept / complete a job",
          "Rating after completion",
        ],
        audience: `${demand} and ${supply}`,
        mvp: `A provider lists availability, a customer requests ${pick(category.objects, 0)}, both see the job complete.`,
        dataModel: `providers, customers, listings, jobs, reviews`,
      };
    },
  },
  {
    id: "knowledge",
    difficulty: "advanced",
    weeks: [4, 8],
    learning: [
      "Document ingest",
      "Retrieval UX",
      "Citations",
      "Stale knowledge",
    ],
    complexity: [
      "Answers without sources",
      "Conflicting documents",
      "Who may query what",
    ],
    build: (category) => {
      const name = shortName(category);
      return {
        title: `${name} Knowledge Desk`,
        pitch: `Ingest the policies, playbooks, and ${pick(category.objects, 0)} notes ${category.staff} already have, then answer ${category.customer} or staff questions with citations — a ${name.toLowerCase()} knowledge base, not a chatbot toy.`,
        features: [
          "Upload or paste source documents",
          "Ask a question in this domain's language",
          "Answers with citations",
          "Flag a stale source",
        ],
        audience: `${category.staff} and ${category.customer} looking something up`,
        mvp: `Add three sources, ask a question, get an answer that points at a source.`,
        dataModel: `sources, chunks, queries, answers, citations`,
      };
    },
  },
];

export function patternsForDifficulty(difficulty: Difficulty | "mixed") {
  if (difficulty === "mixed") return IDEA_PATTERNS;
  const exact = IDEA_PATTERNS.filter((pattern) => pattern.difficulty === difficulty);
  if (exact.length >= 4) return exact;
  return IDEA_PATTERNS;
}
