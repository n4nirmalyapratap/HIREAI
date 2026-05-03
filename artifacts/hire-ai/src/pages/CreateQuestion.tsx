import { useCreateQuestion } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const questionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["ai_collaboration", "technical", "behavioral", "problem_solving", "system_design"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimit: z.coerce.number().min(1, "Time limit must be at least 1 minute"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  aiContext: z.string().min(10, "AI context must be at least 10 characters"),
  evaluationCriteria: z.string().min(10, "Evaluation criteria must be at least 10 characters"),
  order: z.coerce.number().default(0),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export default function CreateQuestion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createQuestion = useCreateQuestion();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: "",
      category: "ai_collaboration",
      difficulty: "medium",
      timeLimit: 15,
      prompt: "",
      aiContext: "",
      evaluationCriteria: "",
      order: 0,
    }
  });

  const onSubmit = (data: QuestionFormValues) => {
    createQuestion.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
          toast({
            title: "Question created",
            description: "Successfully added question to the bank.",
          });
          setLocation("/questions");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to create question.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Question</h1>
        <p className="text-muted-foreground">Design a new AI-collaborative interview question.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. System Design with ChatGPT" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ai_collaboration">AI Collaboration</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="behavioral">Behavioral</SelectItem>
                          <SelectItem value="problem_solving">Problem Solving</SelectItem>
                          <SelectItem value="system_design">System Design</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Prompt</FormLabel>
                    <FormDescription>The exact question the candidate will see.</FormDescription>
                    <FormControl>
                      <Textarea className="min-h-[100px]" placeholder="Ask the candidate to solve a problem using AI..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aiContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Context & Expected Approach</FormLabel>
                    <FormDescription>Explain how a great candidate should use AI tools to solve this.</FormDescription>
                    <FormControl>
                      <Textarea className="min-h-[100px]" placeholder="Expected to use Claude to generate boilerplate, then manually verify edge cases..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evaluationCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evaluation Criteria</FormLabel>
                    <FormDescription>What the AI scorer should look for to give a 10/10.</FormDescription>
                    <FormControl>
                      <Textarea className="min-h-[100px]" placeholder="High score for effective prompt engineering and verifying AI hallucinations..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => setLocation("/questions")}>Cancel</Button>
                <Button type="submit" disabled={createQuestion.isPending}>
                  {createQuestion.isPending ? "Creating..." : "Create Question"}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
