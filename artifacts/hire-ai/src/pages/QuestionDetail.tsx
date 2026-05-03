import { useGetQuestion } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BrainCircuit, Clock, Target, Lightbulb, CheckCircle } from "lucide-react";

export default function QuestionDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: question, isLoading } = useGetQuestion(id, {
    query: { enabled: !!id },
  });

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "hard": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">Question not found.</p>
        <Link href="/questions">
          <Button variant="outline" className="mt-4">Back to Question Bank</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/questions">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Question Bank
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{question.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={question.category === "ai_collaboration" ? "default" : "secondary"}
              className="capitalize"
            >
              {question.category === "ai_collaboration" && <BrainCircuit className="w-3 h-3 mr-1" />}
              {question.category.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className={`capitalize ${getDifficultyColor(question.difficulty)}`}>
              {question.difficulty}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" /> {question.timeLimit} minutes
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Question Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">{question.prompt}</p>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Lightbulb className="h-4 w-4" />
            AI Context &amp; Expected Approach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{question.aiContext}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Evaluation Criteria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {question.evaluationCriteria
              .split(/\n|•|·/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((criterion, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {criterion}
                </li>
              ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Link href="/questions/new">
          <Button variant="outline">Edit Question</Button>
        </Link>
        <Link href="/questions">
          <Button variant="ghost">Back to Bank</Button>
        </Link>
      </div>
    </div>
  );
}
