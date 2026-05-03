import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, interviewsTable, interviewResponsesTable, questionsTable, applicantsTable, jobsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateInterviewBody,
  GetInterviewParams,
  UpdateInterviewParams,
  UpdateInterviewBody,
  SubmitInterviewResponseParams,
  SubmitInterviewResponseBody,
  ScoreInterviewParams,
  ListInterviewsQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/interviews", async (req, res) => {
  try {
    const query = ListInterviewsQueryParams.safeParse(req.query);
    if (!query.success) return res.status(400).json({ error: "Invalid query" });

    const { applicantId, jobId, status, limit } = query.data;
    const interviews = await db
      .select({
        interview: interviewsTable,
        applicantName: applicantsTable.name,
        jobTitle: jobsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(applicantsTable, eq(interviewsTable.applicantId, applicantsTable.id))
      .leftJoin(jobsTable, eq(interviewsTable.jobId, jobsTable.id))
      .limit(limit);

    let result = interviews.map((r) => ({
      ...r.interview,
      applicantName: r.applicantName ?? null,
      jobTitle: r.jobTitle ?? null,
    }));

    if (applicantId) result = result.filter((i) => i.applicantId === applicantId);
    if (jobId) result = result.filter((i) => i.jobId === jobId);
    if (status) result = result.filter((i) => i.status === status);

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/interviews", async (req, res) => {
  try {
    const body = CreateInterviewBody.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: "Invalid body" });

    const [interview] = await db
      .insert(interviewsTable)
      .values({
        applicantId: body.data.applicantId,
        jobId: body.data.jobId,
        scheduledAt: body.data.scheduledAt ? new Date(body.data.scheduledAt) : null,
        notes: body.data.notes ?? null,
      })
      .returning();

    const [applicant] = await db.select().from(applicantsTable).where(eq(applicantsTable.id, interview.applicantId));
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, interview.jobId));

    return res.status(201).json({
      ...interview,
      applicantName: applicant?.name ?? null,
      jobTitle: job?.title ?? null,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/interviews/:id", async (req, res) => {
  try {
    const params = GetInterviewParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const [row] = await db
      .select({
        interview: interviewsTable,
        applicantName: applicantsTable.name,
        jobTitle: jobsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(applicantsTable, eq(interviewsTable.applicantId, applicantsTable.id))
      .leftJoin(jobsTable, eq(interviewsTable.jobId, jobsTable.id))
      .where(eq(interviewsTable.id, params.data.id));

    if (!row) return res.status(404).json({ error: "Not found" });

    const responses = await db
      .select()
      .from(interviewResponsesTable)
      .where(eq(interviewResponsesTable.interviewId, params.data.id));

    const questionIds = [...new Set(responses.map((r) => r.questionId))];
    const questions =
      questionIds.length > 0
        ? await db.select().from(questionsTable).where(inArray(questionsTable.id, questionIds))
        : [];

    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));

    return res.json({
      ...row.interview,
      applicantName: row.applicantName ?? null,
      jobTitle: row.jobTitle ?? null,
      responses: responses.map((r) => ({
        ...r,
        question: questionMap[r.questionId] ?? null,
      })),
      questions,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/interviews/:id", async (req, res) => {
  try {
    const params = UpdateInterviewParams.safeParse(req.params);
    const body = UpdateInterviewBody.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

    const updateData: Record<string, unknown> = {};
    if (body.data.status !== undefined) updateData.status = body.data.status;
    if (body.data.scheduledAt !== undefined)
      updateData.scheduledAt = body.data.scheduledAt ? new Date(body.data.scheduledAt) : null;
    if (body.data.notes !== undefined) updateData.notes = body.data.notes;
    if (body.data.aiVerdict !== undefined) updateData.aiVerdict = body.data.aiVerdict;
    if (body.data.status === "in_progress") updateData.startedAt = new Date();
    if (body.data.status === "completed") updateData.completedAt = new Date();

    const [interview] = await db
      .update(interviewsTable)
      .set(updateData)
      .where(eq(interviewsTable.id, params.data.id))
      .returning();
    if (!interview) return res.status(404).json({ error: "Not found" });

    const [applicant] = await db.select().from(applicantsTable).where(eq(applicantsTable.id, interview.applicantId));
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, interview.jobId));

    return res.json({
      ...interview,
      applicantName: applicant?.name ?? null,
      jobTitle: job?.title ?? null,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/interviews/:id/submit", async (req, res) => {
  try {
    const params = SubmitInterviewResponseParams.safeParse(req.params);
    const body = SubmitInterviewResponseBody.safeParse(req.body);
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid input" });

    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, body.data.questionId));

    if (!question) return res.status(404).json({ error: "Question not found" });

    let score: number | null = null;
    let aiFeedback: string | null = null;
    let scoreBreakdown: string | null = null;

    try {
      const scoringPrompt = `You are an expert technical interviewer evaluating a candidate's response.

Question: ${question.title}
Question Prompt: ${question.prompt}
Expected AI Usage: ${question.aiContext}
Evaluation Criteria: ${question.evaluationCriteria}

Candidate's Answer: ${body.data.answer}
AI Tools Used by Candidate: ${body.data.aiToolsUsed ?? "Not specified"}

Score this response from 0-10. The candidate is EXPECTED and ENCOURAGED to use AI tools. A high score means they used AI skillfully to produce a sophisticated, well-reasoned answer. A low score means they either didn't use AI when they should have, used it poorly, or produced a shallow/incorrect answer.

Respond in this exact JSON format:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence feedback>",
  "breakdown": {
    "ai_utilization": <0-10>,
    "depth_of_reasoning": <0-10>,
    "accuracy": <0-10>,
    "communication": <0-10>
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 500,
        messages: [{ role: "user", content: scoringPrompt }],
      });

      const content = response.choices[0]?.message?.content ?? "";
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
      score = parsed.score;
      aiFeedback = parsed.feedback;
      scoreBreakdown = JSON.stringify(parsed.breakdown);
    } catch {
      // scoring failed — save response without score
    }

    const [responseRow] = await db
      .insert(interviewResponsesTable)
      .values({
        interviewId: params.data.id,
        questionId: body.data.questionId,
        answer: body.data.answer,
        aiToolsUsed: body.data.aiToolsUsed ?? null,
        score,
        aiFeedback,
        scoreBreakdown,
      })
      .returning();

    return res.json({ ...responseRow, question });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/interviews/:id/score", async (req, res) => {
  try {
    const params = ScoreInterviewParams.safeParse(req.params);
    if (!params.success) return res.status(400).json({ error: "Invalid params" });

    const responses = await db
      .select()
      .from(interviewResponsesTable)
      .where(eq(interviewResponsesTable.interviewId, params.data.id));

    const questionIds = [...new Set(responses.map((r) => r.questionId))];
    const questions =
      questionIds.length > 0
        ? await db.select().from(questionsTable).where(inArray(questionsTable.id, questionIds))
        : [];
    const questionMap = Object.fromEntries(questions.map((q) => [q.id, q]));

    for (const response of responses) {
      const question = questionMap[response.questionId];
      if (!question) continue;

      try {
        const scoringPrompt = `You are an expert technical interviewer evaluating a candidate's response.

Question: ${question.title}
Question Prompt: ${question.prompt}
Expected AI Usage: ${question.aiContext}
Evaluation Criteria: ${question.evaluationCriteria}

Candidate's Answer: ${response.answer}
AI Tools Used by Candidate: ${response.aiToolsUsed ?? "Not specified"}

Score this response from 0-10. The candidate is EXPECTED and ENCOURAGED to use AI tools. A high score means they used AI skillfully to produce a sophisticated, well-reasoned answer. A low score means they either didn't use AI when they should have, used it poorly, or produced a shallow/incorrect answer.

Respond in this exact JSON format:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence feedback>",
  "breakdown": {
    "ai_utilization": <0-10>,
    "depth_of_reasoning": <0-10>,
    "accuracy": <0-10>,
    "communication": <0-10>
  }
}`;

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-5-mini",
          max_completion_tokens: 500,
          messages: [{ role: "user", content: scoringPrompt }],
        });

        const content = aiResponse.choices[0]?.message?.content ?? "";
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));

        await db
          .update(interviewResponsesTable)
          .set({
            score: parsed.score,
            aiFeedback: parsed.feedback,
            scoreBreakdown: JSON.stringify(parsed.breakdown),
          })
          .where(eq(interviewResponsesTable.id, response.id));
      } catch {
        // skip failed scoring
      }
    }

    const updatedResponses = await db
      .select()
      .from(interviewResponsesTable)
      .where(eq(interviewResponsesTable.interviewId, params.data.id));

    const scores = updatedResponses.map((r) => r.score).filter((s): s is number => s !== null);
    const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    let aiVerdict: string | null = null;
    if (overallScore !== null) {
      if (overallScore >= 8) aiVerdict = "Strong candidate — demonstrates excellent AI collaboration skills";
      else if (overallScore >= 6) aiVerdict = "Good candidate — solid AI utilization with room to improve";
      else if (overallScore >= 4) aiVerdict = "Average candidate — inconsistent use of AI tools";
      else aiVerdict = "Weak candidate — insufficient AI collaboration demonstrated";
    }

    await db
      .update(interviewsTable)
      .set({ overallScore, aiVerdict, status: "completed", completedAt: new Date() })
      .where(eq(interviewsTable.id, params.data.id));

    const [row] = await db
      .select({
        interview: interviewsTable,
        applicantName: applicantsTable.name,
        jobTitle: jobsTable.title,
      })
      .from(interviewsTable)
      .leftJoin(applicantsTable, eq(interviewsTable.applicantId, applicantsTable.id))
      .leftJoin(jobsTable, eq(interviewsTable.jobId, jobsTable.id))
      .where(eq(interviewsTable.id, params.data.id));

    return res.json({
      ...row?.interview,
      applicantName: row?.applicantName ?? null,
      jobTitle: row?.jobTitle ?? null,
      responses: updatedResponses.map((r) => ({ ...r, question: questionMap[r.questionId] ?? null })),
      questions,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
