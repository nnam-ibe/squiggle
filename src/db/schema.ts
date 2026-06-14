import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/** One current dataset per (league, season). Re-upload replaces it. */
export const datasets = pgTable(
  "datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sport: text("sport").notNull(), // 'soccer' | 'motorsport'
    leagueId: text("league_id").notNull(), // matches data/leagues/<id>.json
    season: text("season").notNull(), // '2024-25' | '2025'
    sourceFilename: text("source_filename"),
    rowCount: integer("row_count").notNull(),
    roundsPresent: integer("rounds_present").notNull(),
    isComplete: boolean("is_complete").notNull().default(false),
    uploaderIpHash: text("uploader_ip_hash"), // sha256(ip + salt); never raw IP
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("datasets_league_season_uq").on(t.leagueId, t.season)],
);

/** Raw results = source of truth; sport-specific fields live in `payload`. */
export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    playedOn: date("played_on").notNull(),
    payload: jsonb("payload").notNull(),
  },
  (t) => [index("matches_dataset_idx").on(t.datasetId, t.round)],
);

/** IP-based rate limiting (e.g. 10 uploads/hour). */
export const rateLimit = pgTable(
  "rate_limit",
  {
    ipHash: text("ip_hash").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.ipHash, t.windowStart] })],
);

export type Dataset = typeof datasets.$inferSelect;
export type NewDataset = typeof datasets.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
