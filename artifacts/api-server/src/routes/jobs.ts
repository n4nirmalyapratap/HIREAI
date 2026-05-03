import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, jobsTable, applicantsTable } from "@workspace/db";
import {
  CreateJobBody,
  GetJobParams,
  UpdateJobBody,
  UpdateJobParams,
  DeleteJobParams,
  GetJobApplicantsParams,
  ListJobsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const query = ListJobsQueryParams.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: "Invalid query params" });
    }
    const { status, limit, offset } = query.data;
    const jobs = await db.select().from(jobsTable).limit(limit).offset(offset);
    const filtered = status ? jobs.filter((j) => j.status === status) : jobs;

    const applicantCounts = await db
      .select({ jobId: applicantsTable.jobId, count: count() })
      .from(applicantsTable)
      .groupBy(applicantsTable.jobId);

    const countMap = Object.fromEntries(applicantCounts.map((a) => [a.jobId, Number(a.count)]));

    return res.json(
      filtered.map((j) => ({
        ...j,
        salaryMin: j.salaryMin ?? null,
        salaryMax: j.salaryMax ?? null,
        applicantCount: countMap[j.id] ?? 0,
      }))
    );
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/jobs", async (req, res) => {
  try {
    const body = CreateJobBody.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: "Invalid body" });
    }
    const [job] = await db.insert(jobsTable).values(body.data).returning();
    return res.status(201).json({ ...job, applicantCount: 0 });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const params = GetJobParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
    if (!job) return res.status(404).json({ error: "Not found" });

    const [countRow] = await db
      .select({ count: count() })
      .from(applicantsTable)
      .where(eq(applicantsTable.jobId, job.id));

    return res.json({ ...job, applicantCount: Number(countRow?.count ?? 0) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/jobs/:id", async (req, res) => {
  try {
    const params = UpdateJobParams.safeParse(req.params);
    const body = UpdateJobBody.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

    const [job] = await db
      .update(jobsTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(jobsTable.id, params.data.id))
      .returning();
    if (!job) return res.status(404).json({ error: "Not found" });

    const [countRow] = await db
      .select({ count: count() })
      .from(applicantsTable)
      .where(eq(applicantsTable.jobId, job.id));

    return res.json({ ...job, applicantCount: Number(countRow?.count ?? 0) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/jobs/:id", async (req, res) => {
  try {
    const params = DeleteJobParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });
    await db.delete(jobsTable).where(eq(jobsTable.id, params.data.id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id/applicants", async (req, res) => {
  try {
    const params = GetJobApplicantsParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const applicants = await db
      .select()
      .from(applicantsTable)
      .where(eq(applicantsTable.jobId, params.data.id));

    return res.json(
      applicants
        .map((a) => ({
          ...a,
          interviewScore: a.aiScore ?? null,
          interviewsCompleted: 0,
        }))
        .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))
    );
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
