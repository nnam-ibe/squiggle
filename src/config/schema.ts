import { z } from "zod";

/** Hex color like #EF0107. */
const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "color must be a 6-digit hex like #EF0107");

/** Recognized tie-breaker criteria (see data/README.md vocabulary). */
export const TIE_BREAKER_CRITERIA = [
  "points",
  "goal_difference",
  "goals_scored",
  "away_goals_scored",
  "head_to_head_points",
  "head_to_head_goal_difference",
  "head_to_head_away_goals",
  "count_back",
  "playoff",
  "alphabetical",
] as const;

const tieBreaker = z.enum(TIE_BREAKER_CRITERIA);

const seasonStatus = z.enum(["complete", "in_progress", "rosterIncomplete"]);

/** A team/constructor entry with its display color. */
const entity = z.object({
  name: z.string().min(1),
  short: z.string().min(1),
  color: hexColor,
});

const soccerSeason = z.object({
  status: seasonStatus,
  rosterNote: z.string().optional(),
  teams: z.array(entity).min(1),
});

const f1Season = z.object({
  status: seasonStatus,
  rosterNote: z.string().optional(),
  constructors: z.array(entity).min(1),
});

const soccerFormat = z.object({
  teams: z.number().int().positive(),
  rounds: z.number().int().positive(),
  pointsForWin: z.number().int(),
  pointsForDraw: z.number().int(),
  pointsForLoss: z.number().int(),
  formatNote: z.string().optional(),
});

/** A points-rule period applying for seasons in [fromSeason, toSeason] (null = ongoing). */
const seasonRange = z.object({
  fromSeason: z.number().int(),
  toSeason: z.number().int().nullable(),
});

const f1PointsRules = z.object({
  note: z.string().optional(),
  race: z.array(seasonRange.extend({ points: z.array(z.number()).min(1) })),
  fastestLap: z
    .array(
      seasonRange.extend({
        points: z.number(),
        maxFinishPosition: z.number().int().positive(),
      }),
    )
    .default([]),
  sprint: z
    .array(seasonRange.extend({ points: z.array(z.number()).min(1) }))
    .default([]),
});

const soccerLeague = z.object({
  id: z.string().min(1),
  sport: z.literal("soccer"),
  name: z.string().min(1),
  country: z.string().optional(),
  format: soccerFormat,
  tieBreakers: z.array(tieBreaker).min(1),
  tieBreakerNotes: z.string().optional(),
  seasons: z.record(z.string(), soccerSeason),
});

const motorsportLeague = z.object({
  id: z.string().min(1),
  sport: z.literal("motorsport"),
  name: z.string().min(1),
  entities: z.array(z.enum(["drivers", "constructors"])).min(1),
  tieBreakers: z.array(tieBreaker).min(1),
  tieBreakerNotes: z.string().optional(),
  pointsRules: f1PointsRules,
  rosterNote: z.string().optional(),
  seasons: z.record(z.string(), f1Season),
});

export const leagueConfigSchema = z.discriminatedUnion("sport", [
  soccerLeague,
  motorsportLeague,
]);

export type LeagueConfig = z.infer<typeof leagueConfigSchema>;
export type SoccerLeagueConfig = z.infer<typeof soccerLeague>;
export type MotorsportLeagueConfig = z.infer<typeof motorsportLeague>;
export type EntityConfig = z.infer<typeof entity>;
export type TieBreaker = (typeof TIE_BREAKER_CRITERIA)[number];
export type F1PointsRules = z.infer<typeof f1PointsRules>;
