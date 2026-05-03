import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { interviewsTable } from "./interviews";
import { questionsTable } from "./questions";

export const interviewResponsesTable = pgTable("interview_responses", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviewsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  aiToolsUsed: text("ai_tools_used"),
  score: real("score"),
  scoreBreakdown: text("score_breakdown"),
  aiFeedback: text("ai_feedback"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertInterviewResponseSchema = createInsertSchema(interviewResponsesTable).omit({ id: true, submittedAt: true });
export type InsertInterviewResponse = z.infer<typeof insertInterviewResponseSchema>;
export type InterviewResponse = typeof interviewResponsesTable.$inferSelect;
