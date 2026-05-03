import { useListQuestions } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BrainCircuit, Clock } from "lucide-react";

export default function QuestionsBank() {
  const { data: questions, isLoading } = useListQuestions();

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'easy': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground">Manage your library of AI-collaborative interview questions.</p>
        </div>
        <Link href="/questions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : questions?.length ? (
          questions.map((q) => (
            <Card key={q.id} className={q.category === 'ai_collaboration' ? 'border-primary/50 bg-primary/5' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{q.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={q.category === 'ai_collaboration' ? 'default' : 'secondary'} className="capitalize">
                        {q.category === 'ai_collaboration' && <BrainCircuit className="w-3 h-3 mr-1" />}
                        {q.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className={`capitalize ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {q.timeLimit}m
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground line-clamp-2">{q.prompt}</p>
                <div className="bg-muted/50 p-3 rounded-md border border-dashed border-muted-foreground/30">
                  <span className="text-xs font-semibold text-primary block mb-1">AI Context / Expected Approach</span>
                  <p className="text-xs text-muted-foreground">{q.aiContext}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No questions found. Add your first AI-collaborative question.
          </div>
        )}
      </div>
    </div>
  );
}
