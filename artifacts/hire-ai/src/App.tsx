import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import JobsList from "@/pages/JobsList";
import JobDetail from "@/pages/JobDetail";
import ApplicantsList from "@/pages/ApplicantsList";
import ApplicantProfile from "@/pages/ApplicantProfile";
import InterviewsList from "@/pages/InterviewsList";
import InterviewSession from "@/pages/InterviewSession";
import QuestionsBank from "@/pages/QuestionsBank";
import QuestionDetail from "@/pages/QuestionDetail";
import CreateQuestion from "@/pages/CreateQuestion";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jobs" component={JobsList} />
        <Route path="/jobs/:id" component={JobDetail} />
        <Route path="/applicants" component={ApplicantsList} />
        <Route path="/applicants/:id" component={ApplicantProfile} />
        <Route path="/interviews" component={InterviewsList} />
        <Route path="/interviews/:id" component={InterviewSession} />
        <Route path="/questions" component={QuestionsBank} />
        <Route path="/questions/new" component={CreateQuestion} />
        <Route path="/questions/:id" component={QuestionDetail} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
