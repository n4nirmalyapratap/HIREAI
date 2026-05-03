import { useListQuestions, useGenerateQuestions } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus, BrainCircuit, Clock, Sparkles, CheckCircle2,
  Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowRight
} from "lucide-react";
import { useState } from "react";
import type { GeneratedQuestion } from "@workspace/api-client-react";

const NONE = "__none__";
const PAGE_SIZE = 6;

export default function QuestionsBank() {
  const { data: questions, isLoading } = useListQuestions();
  const queryClient = useQueryClient();
  const generateMutation = useGenerateQuestions();

  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [category, setCategory] = useState(NONE);
  const [difficulty, setDifficulty] = useState(NONE);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [saveToBank, setSaveToBank] = useState(false);
  const [preview, setPreview] = useState<GeneratedQuestion[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const totalPages = Math.max(1, Math.ceil((questions?.length ?? 0) / PAGE_SIZE));
  const paginated = questions?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "hard": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleGenerate = () => {
    setPreview([]);
    setSavedIds(new Set());
    generateMutation.mutate(
      {
        data: {
          count,
          category: category !== NONE ? (category as "ai_collaboration" | "technical" | "behavioral" | "problem_solving" | "system_design") : null,
          difficulty: difficulty !== NONE ? (difficulty as "easy" | "medium" | "hard") : null,
          jobTitle: jobTitle || null,
          jobDescription: jobDescription || null,
          saveToBank,
        },
      },
      {
        onSuccess: (data) => {
          setPreview(data.questions);
          if (saveToBank) {
            const ids = new Set(
              data.questions.filter((q) => q.savedId != null).map((q) => q.savedId as number)
            );
            setSavedIds(ids);
            queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
          }
        },
      }
    );
  };

  const handleSaveOne = (q: GeneratedQuestion, idx: number) => {
    generateMutation.mutate(
      {
        data: {
          count: 1,
          category: q.category as "ai_collaboration" | "technical" | "behavioral" | "problem_solving" | "system_design",
          difficulty: q.difficulty as "easy" | "medium" | "hard",
          jobTitle: jobTitle || null,
          jobDescription: jobDescription || null,
          saveToBank: true,
        },
      },
      {
        onSuccess: (data) => {
          const saved = data.questions[0];
          if (saved?.savedId != null) {
            setSavedIds((prev) => new Set([...prev, saved.savedId as number]));
            setPreview((prev) =>
              prev.map((pq, i) => (i === idx ? { ...pq, savedId: saved.savedId } : pq))
            );
            queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
          }
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground">
            {questions ? `${questions.length} question${questions.length !== 1 ? "s" : ""}` : "Loading…"} — click any card to view full details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setPreview([]); setOpen(true); }}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" /> Generate with AI
          </Button>
          <Link href="/questions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(PAGE_SIZE).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : paginated.length ? (
          paginated.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`}>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
                  q.category === "ai_collaboration" ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={q.category === "ai_collaboration" ? "default" : "secondary"} className="capitalize">
                          {q.category === "ai_collaboration" && <BrainCircuit className="w-3 h-3 mr-1" />}
                          {q.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="outline" className={`capitalize ${getDifficultyColor(q.difficulty)}`}>
                          {q.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {q.timeLimit}m
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 ml-3" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground line-clamp-2">{q.prompt}</p>
                  <div className="bg-muted/50 p-3 rounded-md border border-dashed border-muted-foreground/30">
                    <span className="text-xs font-semibold text-primary block mb-1">AI Context / Expected Approach</span>
                    <p className="text-xs text-muted-foreground line-clamp-2">{q.aiContext}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No questions yet. Generate some with AI or add manually.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} &middot; {questions?.length} questions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI-Collaborative Questions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Number of questions</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Any category</SelectItem>
                    <SelectItem value="ai_collaboration">AI Collaboration</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="problem_solving">Problem Solving</SelectItem>
                    <SelectItem value="system_design">System Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Any difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
              <p className="text-sm font-medium">Job context (optional — improves relevance)</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Job title</Label>
                <Input
                  placeholder="e.g. Senior Full-Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Job description / requirements</Label>
                <Textarea
                  placeholder="Paste key requirements or the full job description…"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch id="save" checked={saveToBank} onCheckedChange={setSaveToBank} />
              <Label htmlFor="save" className="cursor-pointer">
                Save generated questions directly to bank
              </Label>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Generate {count} Question{count !== 1 ? "s" : ""}</>
              )}
            </Button>

            {preview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Generated questions</p>
                  {saveToBank && (
                    <span className="text-xs text-muted-foreground">{savedIds.size} saved to bank</span>
                  )}
                </div>
                {preview.map((q, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-2 bg-background">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {q.category.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className={`capitalize text-xs ${getDifficultyColor(q.difficulty)}`}>
                            {q.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.timeLimit}m
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {q.savedId != null ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSaveOne(q, idx)}
                            disabled={generateMutation.isPending}
                          >
                            Save
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                        >
                          {expandedIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {expandedIdx === idx && (
                      <div className="space-y-2 pt-2 border-t">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Prompt shown to candidate</p>
                          <p className="text-sm">{q.prompt}</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
                          <p className="text-xs font-semibold text-primary mb-1">AI Context / Expected Approach</p>
                          <p className="text-xs text-muted-foreground">{q.aiContext}</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Evaluation Criteria</p>
                          <p className="text-xs text-muted-foreground whitespace-pre-line">{q.evaluationCriteria}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
