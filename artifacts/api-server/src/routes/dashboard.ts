import { Router } from "express";
import { eq, count, gte, avg, sql } from "drizzle-orm";
import { db, jobsTable, applicantsTable, interviewsTable } from "@workspace/db";
import { GetRecentActivityQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalJobs] = await db.select({ count: count() }).from(jobsTable);
    const [activeJobs] = await db
      .select({ count: count() })
      .from(jobsTable)
      .where(eq(jobsTable.status, "active"));
    const [totalApplicants] = await db.select({ count: count() }).from(applicantsTable);
    const [newApplicants] = await db
      .select({ count: count() })
      .from(applicantsTable)
      .where(gte(applicantsTable.appliedAt, oneWeekAgo));
    const [interviewsWeek] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .where(gte(interviewsTable.createdAt, oneWeekAgo));
    const [completedInterviews] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .where(eq(interviewsTable.status, "completed"));
    const [avgScore] = await db
      .select({ avg: avg(interviewsTable.overallScore) })
      .from(interviewsTable)
      .where(eq(interviewsTable.status, "completed"));
    const [hires] = await db
      .select({ count: count() })
      .from(applicantsTable)
      .where(eq(applicantsTable.status, "hired"));

    return res.json({
      totalJobs: Number(totalJobs?.count ?? 0),
      activeJobs: Number(activeJobs?.count ?? 0),
      totalApplicants: Number(totalApplicants?.count ?? 0),
      newApplicantsThisWeek: Number(newApplicants?.count ?? 0),
      interviewsThisWeek: Number(interviewsWeek?.count ?? 0),
      interviewsCompleted: Number(completedInterviews?.count ?? 0),
      avgInterviewScore: avgScore?.avg !== null ? parseFloat(String(avgScore?.avg)) : null,
      hiresThisMonth: Number(hires?.count ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-activity", async (req, res) => {
  try {
    const query = GetRecentActivityQueryParams.safeParse(req.query);
    const limit = query.success ? query.data.limit : 10;

    const recentApplicants = await db
      .select({
        id: applicantsTable.id,
        name: applicantsTable.name,
        status: applicantsTable.status,
        appliedAt: applicantsTable.appliedAt,
      })
      .from(applicantsTable)
      .orderBy(sql`${applicantsTable.appliedAt} desc`)
      .limit(limit);

    const recentInterviews = await db
      .select({
        id: interviewsTable.id,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        applicantId: interviewsTable.applicantId,
      })
      .from(interviewsTable)
      .orderBy(sql`${interviewsTable.createdAt} desc`)
      .limit(limit);

    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      metadata: Record<string, unknown> | null;
    }> = [];

    for (const a of recentApplicants) {
      activities.push({
        id: `applicant-${a.id}`,
        type: a.status === "hired" ? "applicant_hired" : a.status === "rejected" ? "applicant_rejected" : "new_applicant",
        title: a.status === "hired" ? "Candidate Hired" : a.status === "rejected" ? "Applicant Rejected" : "New Application",
        description: `${a.name} ${a.status === "hired" ? "has been hired" : a.status === "rejected" ? "was rejected" : "applied"}`,
        timestamp: a.appliedAt,
        metadata: { applicantId: a.id },
      });
    }

    for (const i of recentInterviews) {
      activities.push({
        id: `interview-${i.id}`,
        type: i.status === "completed" ? "interview_completed" : "interview_scheduled",
        title: i.status === "completed" ? "Interview Completed" : "Interview Scheduled",
        description: `Interview session ${i.status === "completed" ? "completed" : "scheduled"}`,
        timestamp: i.createdAt,
        metadata: { interviewId: i.id },
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json(activities.slice(0, limit));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/pipeline", async (req, res) => {
  try {
    const stageCounts = await db
      .select({ status: applicantsTable.status, count: count() })
      .from(applicantsTable)
      .groupBy(applicantsTable.status);

    const total = stageCounts.reduce((sum, s) => sum + Number(s.count), 0);

    const stages = stageCounts.map((s) => ({
      stage: s.status,
      count: Number(s.count),
      percentage: total > 0 ? Math.round((Number(s.count) / total) * 100) : 0,
    }));

    const jobCounts = await db
      .select({ jobId: applicantsTable.jobId, count: count() })
      .from(applicantsTable)
      .groupBy(applicantsTable.jobId);

    const jobIds = jobCounts.map((j) => j.jobId);
    const jobs = jobIds.length > 0
      ? await db.select().from(jobsTable)
      : [];

    const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

    const byJob = jobCounts.map((j) => ({
      jobId: j.jobId,
      jobTitle: jobMap[j.jobId] ?? "Unknown",
      count: Number(j.count),
    }));

    return res.json({ stages, byJob });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
