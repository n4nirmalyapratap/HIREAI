import { useListInterviews } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowUpRight } from "lucide-react";

export default function InterviewsList() {
  const { data: interviews, isLoading } = useListInterviews();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-muted-foreground">All interview sessions across your candidates.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : interviews?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.applicantName || `Applicant #${interview.applicantId}`}</TableCell>
                    <TableCell>{interview.jobTitle || `Job #${interview.jobId}`}</TableCell>
                    <TableCell>
                      <Badge variant={interview.status === "completed" ? "default" : "secondary"} className="capitalize">
                        {interview.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {interview.scheduledAt ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(interview.scheduledAt).toLocaleString()}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {interview.overallScore ? (
                        <span className="font-bold text-primary">{interview.overallScore.toFixed(1)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/interviews/${interview.id}`}>
                        <Button variant="ghost" size="sm">
                          Review <ArrowUpRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No interviews found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
