import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jobsRouter from "./jobs";
import applicantsRouter from "./applicants";
import questionsRouter from "./questions";
import interviewsRouter from "./interviews";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jobsRouter);
router.use(applicantsRouter);
router.use(questionsRouter);
router.use(interviewsRouter);
router.use(dashboardRouter);

export default router;
