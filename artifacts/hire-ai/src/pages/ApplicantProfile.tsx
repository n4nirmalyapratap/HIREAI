import { useRoute } from "wouter";
import { useGetApplicant, useListInterviews, useUpdateApplicant, getGetApplicantQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, ExternalLink, FileText, CheckSquare, BrainCircuit } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ApplicantProfile() {
  const [, params] = useRoute("/applicants/:id");
  const id = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: applicant, isLoading: isLoadingApplicant } = useGetApplicant(id, {
    query: { enabled: !!id, queryKey: getGetApplicantQueryKey(id) }
  });

  const { data: interviews, isLoading: isLoadingInterviews } = useListInterviews({ applicantId: id }, {
    query: { enabled: !!id, queryKey: ['/api/interviews', { applicantId: id }] }
  });

  const updateApplicant = useUpdateApplicant();

  const handleStatusChange = (newStatus: any) => {
    updateApplicant.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetApplicantQueryKey(id), data);
          toast({
            title: "Status Updated",
            description: `Applicant status changed to ${newStatus}.`,
          });
        }
      }
    );
  };

  if (isLoadingApplicant) {
    return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  }

  if (!applicant) return <div>Applicant not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{applicant.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            Applied for Job #{applicant.jobId}
            <Badge variant="outline">{new Date(applicant.appliedAt).toLocaleDateString()}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={applicant.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${applicant.email}`} className="text-primary hover:underline">{applicant.email}</a>
              </div>
              {applicant.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{applicant.phone}</span>
                </div>
              )}
              {applicant.linkedinUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a href={applicant.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn Profile</a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Screening
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicant.aiScore ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">{applicant.aiScore.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 10</span></div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(applicant.aiScore / 10) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">AI Summary</h4>
                    <p className="text-sm text-muted-foreground">{applicant.aiSummary}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">AI screening pending or not completed.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interviews</CardTitle>
              <CardDescription>Scheduled and past interview sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInterviews ? (
                <Skeleton className="h-24 w-full" />
              ) : interviews?.length ? (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          Interview Session
                          <Badge variant="outline" className="capitalize">{interview.status}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : 'Unscheduled'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {interview.overallScore && (
                          <div className="font-bold text-primary">{interview.overallScore.toFixed(1)}</div>
                        )}
                        <Link href={`/interviews/${interview.id}`}>
                          <Button variant="secondary" size="sm">View Session</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No interviews scheduled yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resume Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {applicant.resumeText ? (
                <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                  {applicant.resumeText}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">No resume text provided.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
