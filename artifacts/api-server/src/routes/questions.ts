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
  GenerateQuestionsBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

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

router.post("/questions/generate", async (req, res) => {
  try {
    const body = GenerateQuestionsBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "Invalid body", issues: body.error.issues });

    const { count, category, difficulty, jobTitle, jobDescription, jobRequirements, saveToBank } = body.data;

    const existingQuestions = await db.select({ title: questionsTable.title }).from(questionsTable);
    const existingTitles = existingQuestions.map((q) => `- ${q.title}`).join("\n");

    const categoryInstruction = category
      ? `All questions must be category: "${category}".`
      : `Mix categories freely from: ai_collaboration, technical, behavioral, problem_solving, system_design. Prefer ai_collaboration.`;

    const difficultyInstruction = difficulty
      ? `All questions must be difficulty: "${difficulty}".`
      : `Vary difficulty (easy/medium/hard) across questions.`;

    const jobContext = jobTitle
      ? `
Job context:
- Title: ${jobTitle}
${jobDescription ? `- Description: ${jobDescription}` : ""}
${jobRequirements ? `- Requirements: ${jobRequirements}` : ""}

Tailor questions to this specific role.`
      : "Questions should be general-purpose for engineering/product roles at a small tech company.";

    const prompt = `You are an expert technical interviewer designing AI-collaborative interview questions for a startup hiring platform. Your philosophy: the best candidates in 2025 are those who USE AI tools expertly — not those who avoid them.

CORE PRINCIPLE: Every question must be intentionally designed so that candidates who leverage AI (Claude, ChatGPT, Gemini, etc.) produce dramatically better answers than those who don't. Questions should be:
1. Too broad/complex to answer well from memory alone
2. Rewarding iterative AI-aided research
3. Testing *how* they use AI, not just what they know
4. Checking they can evaluate and sanity-check AI output

${jobContext}

${categoryInstruction}
${difficultyInstruction}

EXISTING QUESTIONS (do NOT duplicate these titles or concepts):
${existingTitles || "(none yet)"}

Generate EXACTLY ${count} new, unique interview questions. Return ONLY valid JSON — no markdown, no commentary.

Return this exact structure:
{
  "questions": [
    {
      "category": "ai_collaboration" | "technical" | "behavioral" | "problem_solving" | "system_design",
      "title": "Short descriptive title (5-10 words)",
      "prompt": "The full question text shown to the candidate (2-5 sentences). Be specific and include constraints or scenarios that force research and judgment.",
      "aiContext": "Explain which AI tools/approaches top candidates should use, and what a great AI-assisted answer looks like (1-3 sentences).",
      "evaluationCriteria": "Bullet points of what to assess: did they use AI? did they verify outputs? did they show judgment beyond copy-paste? (2-4 bullets separated by \\n)",
      "difficulty": "easy" | "medium" | "hard",
      "timeLimit": 15 | 20 | 25 | 30 | 45,
      "order": 1
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.85,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: { questions: Array<{
      category: string;
      title: string;
      prompt: string;
      aiContext: string;
      evaluationCriteria: string;
      difficulty: string;
      timeLimit: number;
      order: number;
    }> };

    try {
      parsed = JSON.parse(raw);
    } catch {
      req.log.error({ raw }, "Failed to parse AI response");
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    const questions = parsed.questions ?? [];
    let savedCount = 0;
    const result = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      q.order = i + 1;

      if (saveToBank) {
        const [saved] = await db.insert(questionsTable).values({
          category: q.category as "ai_collaboration" | "technical" | "behavioral" | "problem_solving" | "system_design",
          title: q.title,
          prompt: q.prompt,
          aiContext: q.aiContext,
          evaluationCriteria: q.evaluationCriteria,
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          timeLimit: q.timeLimit,
          order: q.order,
        }).returning();
        savedCount++;
        result.push({ ...q, savedId: saved.id });
      } else {
        result.push({ ...q, savedId: null });
      }
    }

    return res.json({ questions: result, savedCount });
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
