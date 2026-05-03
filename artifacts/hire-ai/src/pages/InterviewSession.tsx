import { useRoute } from "wouter";
import { useGetInterview, useScoreInterview, getGetInterviewQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, CheckSquare, Sparkles } from "lucide-react";
import { useState } from "react";

export default function InterviewSession() {
  const [, params] = useRoute("/interviews/:id");
  const id = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isScoring, setIsScoring] = useState(false);

  const { data: interview, isLoading } = useGetInterview(id, {
    query: { enabled: !!id, queryKey: getGetInterviewQueryKey(id) }
  });

  const scoreInterview = useScoreInterview();

  const handleScoreAll = () => {
    setIsScoring(true);
    scoreInterview.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInterviewQueryKey(id) });
          toast({
            title: "Scoring Complete",
            description: "All responses have been scored by AI.",
          });
          setIsScoring(false);
        },
        onError: () => {
          toast({
            title: "Scoring Failed",
            description: "An error occurred while scoring.",
            variant: "destructive"
          });
          setIsScoring(false);
        }
      }
    );
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-96" /></div>;
  }

  if (!interview) return <div>Interview not found</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Session Review</h1>
            <Badge variant="outline" className="capitalize">{interview.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            {interview.applicantName || `Applicant #${interview.applicantId}`} • {interview.jobTitle || `Job #${interview.jobId}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {interview.overallScore !== null && interview.overallScore !== undefined && (
            <div className="flex items-center gap-2 text-xl font-bold bg-primary/10 text-primary px-4 py-2 rounded-lg">
              <BrainCircuit className="h-5 w-5" />
              {interview.overallScore.toFixed(1)} / 10
            </div>
          )}
          <Button onClick={handleScoreAll} disabled={isScoring} className="gap-2">
            {isScoring ? <Sparkles className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Score All Responses
          </Button>
        </div>
      </div>

      {interview.aiVerdict && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <BrainCircuit className="h-5 w-5" /> Overall AI Verdict
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{interview.aiVerdict}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <CheckSquare className="h-5 w-5" /> Candidate Responses
        </h3>
        
        {interview.responses && interview.responses.length > 0 ? (
          interview.responses.map((response) => (
            <Card key={response.id} className="overflow-hidden">
              <div className="bg-muted/50 p-4 border-b">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-lg">{response.question?.title}</div>
                  {response.question?.category && (
                    <Badge variant="secondary" className="capitalize">
                      {response.question.category.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-4">{response.question?.prompt}</div>
                
                {response.question?.aiContext && (
                  <div className="bg-background/80 p-3 rounded border text-sm border-dashed">
                    <span className="font-semibold text-primary block mb-1">AI Approach Expected:</span>
                    {response.question.aiContext}
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Candidate's Answer</h4>
                  <div className="bg-muted/20 p-4 rounded-md text-sm whitespace-pre-wrap border border-transparent">
                    {response.answer}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">AI Tools Used:</span> 
                  {response.aiToolsUsed || "None mentioned"}
                </div>
              </div>

              {response.score !== null && response.score !== undefined && (
                <div className="bg-primary/5 p-4 border-t border-primary/10">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold flex items-center gap-2 text-primary">
                      <BrainCircuit className="h-4 w-4" /> AI Evaluation
                    </h4>
                    <div className="text-xl font-bold text-primary">{response.score}/10</div>
                  </div>
                  
                  <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-primary" style={{ width: `${(response.score / 10) * 100}%` }} />
                  </div>

                  {response.aiFeedback && (
                    <div className="text-sm space-y-1">
                      <span className="font-medium text-foreground">Feedback:</span>
                      <p className="text-muted-foreground leading-relaxed">{response.aiFeedback}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 border rounded-xl text-muted-foreground">
            No responses recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
