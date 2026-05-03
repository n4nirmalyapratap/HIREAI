import { Link } from "wouter";
import { 
  useGetDashboardSummary, 
  useGetRecentActivity, 
  useGetPipelineStats 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, CheckSquare, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 5 });
  const { data: pipeline, isLoading: isLoadingPipeline } = useGetPipelineStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Pipeline health and key statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : summary ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeJobs}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalJobs} total postings
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalApplicants}</div>
                <p className="text-xs text-muted-foreground">
                  +{summary.newApplicantsThisWeek} this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                <CheckSquare className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.interviewsCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.interviewsThisWeek} scheduled this week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {summary.avgInterviewScore ? summary.avgInterviewScore.toFixed(1) : "-"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all completed interviews
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Pipeline Health</CardTitle>
            <CardDescription>Applicant stages across all active jobs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPipeline ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : pipeline ? (
              <div className="space-y-4">
                {pipeline.stages.map((stage) => (
                  <div key={stage.stage} className="flex items-center">
                    <div className="w-32 text-sm font-medium capitalize truncate">
                      {stage.stage.replace('_', ' ')}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-4 bg-primary/20 rounded-full overflow-hidden flex-1">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${Math.max(stage.percentage, 2)}%` }} 
                        />
                      </div>
                      <div className="w-12 text-right text-sm text-muted-foreground">
                        {stage.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No pipeline data available.</div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isLoadingActivity ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : activity?.length ? (
                activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
