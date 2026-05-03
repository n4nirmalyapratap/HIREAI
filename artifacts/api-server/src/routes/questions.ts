import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, questionsTable } from "@workspace/db";
import {
  CreateQuestionBody,
  GetQuestionParams,
  UpdateQuestionParams,
  UpdateQuestionBody,
  DeleteQuestionParams,
  ListQuestionsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/questions", async (req, res) => {
  try {
    const query = ListQuestionsQueryParams.safeParse(req.query);
    if (!query.success) return res.status(400).json({ error: "Invalid query" });

    const { jobId, category, limit } = query.data;
    let questions = await db.select().from(questionsTable).limit(limit);

    if (jobId) questions = questions.filter((q) => q.jobId === jobId || q.jobId === null);
    if (category) questions = questions.filter((q) => q.category === category);

    return res.json(questions.sort((a, b) => a.order - b.order));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const body = CreateQuestionBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "Invalid body", issues: body.error.issues });
    const [question] = await db.insert(questionsTable).values(body.data).returning();
    return res.status(201).json(question);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/questions/:id", async (req, res) => {
  try {
    const params = GetQuestionParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });
    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, params.data.id));
    if (!question) return res.status(404).json({ error: "Not found" });
    return res.json(question);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/questions/:id", async (req, res) => {
  try {
    const params = UpdateQuestionParams.safeParse(req.params);
    const body = UpdateQuestionBody.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

    const [question] = await db
      .update(questionsTable)
      .set(body.data)
      .where(eq(questionsTable.id, params.data.id))
      .returning();
    if (!question) return res.status(404).json({ error: "Not found" });
    return res.json(question);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/questions/:id", async (req, res) => {
  try {
    const params = DeleteQuestionParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });
    await db.delete(questionsTable).where(eq(questionsTable.id, params.data.id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
