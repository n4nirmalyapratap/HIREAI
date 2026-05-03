import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, applicantsTable } from "@workspace/db";
import {
  CreateApplicantBody,
  GetApplicantParams,
  UpdateApplicantParams,
  UpdateApplicantBody,
  ListApplicantsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/applicants", async (req, res) => {
  try {
    const query = ListApplicantsQueryParams.safeParse(req.query);
    if (!query.success) return res.status(400).json({ error: "Invalid query" });

    const { jobId, status, limit, offset } = query.data;

    let applicants = await db.select().from(applicantsTable).limit(limit).offset(offset);

    if (jobId) applicants = applicants.filter((a) => a.jobId === jobId);
    if (status) applicants = applicants.filter((a) => a.status === status);

    return res.json(applicants);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/applicants", async (req, res) => {
  try {
    const body = CreateApplicantBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "Invalid body" });
    const [applicant] = await db.insert(applicantsTable).values(body.data).returning();
    return res.status(201).json(applicant);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/applicants/:id", async (req, res) => {
  try {
    const params = GetApplicantParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });
    const [applicant] = await db
      .select()
      .from(applicantsTable)
      .where(eq(applicantsTable.id, params.data.id));
    if (!applicant) return res.status(404).json({ error: "Not found" });
    return res.json(applicant);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/applicants/:id", async (req, res) => {
  try {
    const params = UpdateApplicantParams.safeParse(req.params);
    const body = UpdateApplicantBody.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

    const [applicant] = await db
      .update(applicantsTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(applicantsTable.id, params.data.id))
      .returning();
    if (!applicant) return res.status(404).json({ error: "Not found" });
    return res.json(applicant);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
