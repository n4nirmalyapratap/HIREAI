import { useRoute } from "wouter";
import { useGetJob, useGetJobApplicants, getGetJobQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building, MapPin, Users, Calendar, ArrowUpRight, BrainCircuit } from "lucide-react";
import { Link } from "wouter";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = parseInt(params?.id || "0", 10);

  const { data: job, isLoading: isLoadingJob } = useGetJob(jobId, { 
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) } 
  });
  
  const { data: applicants, isLoading: isLoadingApplicants } = useGetJobApplicants(jobId, {
    query: { enabled: !!jobId, queryKey: ['/api/jobs', jobId, 'applicants'] }
  });

  if (isLoadingJob) {
    return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  }

  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <Badge variant={job.status === "active" ? "default" : "secondary"}>
              {job.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" /> {job.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {job.location}
            </span>
            <span className="capitalize">{job.type.replace('_', ' ')}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Posted {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit Job</Button>
          <Button>View Public Page</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Ranked Applicants</CardTitle>
            <CardDescription>Candidates sorted by AI screening score</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingApplicants ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : applicants?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell className="font-medium">
                        <div>{applicant.name}</div>
                        <div className="text-xs text-muted-foreground">{applicant.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {applicant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {applicant.aiScore ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{applicant.aiScore.toFixed(1)}</span>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${(applicant.aiScore / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scored</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/applicants/${applicant.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            Review <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No applicants yet.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{job.applicantCount}</div>
                  <div className="text-sm text-muted-foreground">Total Applicants</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div>
                <h4 className="font-medium mb-1">About the Role</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Requirements</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
              </div>
              {(job.salaryMin || job.salaryMax) && (
                <div>
                  <h4 className="font-medium mb-1">Compensation</h4>
                  <p className="text-muted-foreground">
                    ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
