import { pgTable, serial, text, integer, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { jobsTable } from "./jobs";

export const applicantStatusEnum = pgEnum("applicant_status", [
  "new", "screening", "interviewing", "offer", "rejected", "hired"
]);

export const applicantsTable = pgTable("applicants", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  resumeText: text("resume_text"),
  status: applicantStatusEnum("status").notNull().default("new"),
  aiScore: real("ai_score"),
  aiSummary: text("ai_summary"),
  source: text("source"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApplicantSchema = createInsertSchema(applicantsTable).omit({ id: true, appliedAt: true, updatedAt: true });
export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type Applicant = typeof applicantsTable.$inferSelect;
