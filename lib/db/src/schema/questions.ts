import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobsTable } from "./jobs";

export const questionCategoryEnum = pgEnum("question_category", [
  "ai_collaboration", "technical", "behavioral", "problem_solving", "system_design"
]);
export const questionDifficultyEnum = pgEnum("question_difficulty", ["easy", "medium", "hard"]);

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobsTable.id, { onDelete: "set null" }),
  category: questionCategoryEnum("category").notNull().default("ai_collaboration"),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  aiContext: text("ai_context").notNull(),
  evaluationCriteria: text("evaluation_criteria").notNull(),
  difficulty: questionDifficultyEnum("difficulty").notNull().default("medium"),
  timeLimit: integer("time_limit").notNull().default(15),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
