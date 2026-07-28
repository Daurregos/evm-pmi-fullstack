import { date, integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cutoffDate: date("cutoff_date").notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bac: numeric("bac", { precision: 38, scale: 18 }).notNull(),
  plannedProgress: numeric("planned_progress", { precision: 38, scale: 18 }).notNull(),
  actualProgress: numeric("actual_progress", { precision: 38, scale: 18 }).notNull(),
  ac: numeric("ac", { precision: 38, scale: 18 }).notNull(),
});
