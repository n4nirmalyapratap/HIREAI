import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetJob, useCreateApplicant } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building, MapPin, Clock, ArrowLeft, CheckCircle2,
  BrainCircuit, Linkedin, Phone, Mail, User
} from "lucide-react";
import { Link } from "wouter";

export default function PublicJobApply() {
  const params = useParams<{ id: string }>();
  const jobId = Number(params.id);
  const [, setLocation] = useLocation();

  const { data: job, isLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId },
  });

  const createApplicant = useCreateApplicant();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    resumeText: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.resumeText.trim()) e.resumeText = "Please paste your resume or a brief background";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    createApplicant.mutate(
      {
        data: {
          jobId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          linkedinUrl: form.linkedinUrl.trim() || null,
          resumeText: form.resumeText.trim() || null,
          source: "public_board",
        },
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <Skeleton className="h-40 w-full rounded-xl mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </PublicLayout>
    );
  }

  if (!job) {
    return (
      <PublicLayout>
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">This job posting doesn't exist or has been closed.</p>
          <Link href="/apply">
            <Button variant="outline" className="mt-4">View all openings</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto text-center py-16 space-y-5">
          <div className="flex justify-center">
            <div className="bg-green-500/10 p-5 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Application Submitted!</h1>
          <p className="text-muted-foreground">
            Thanks for applying for <strong>{job.title}</strong>. We'll review your application
            and reach out if there's a match. Our interview process is AI-collaborative — you'll
            be encouraged to use AI tools throughout.
          </p>
          <Link href="/apply">
            <Button variant="outline">View other openings</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="space-y-8">
        <div>
          <Link href="/apply" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All openings
          </Link>

          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <Badge>Hiring</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {job.department}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
              <span className="flex items-center gap-1 capitalize"><Clock className="h-4 w-4" /> {job.type.replace("_", " ")}</span>
              {(job.salaryMin || job.salaryMax) && (
                <span className="font-semibold text-foreground">
                  ${job.salaryMin?.toLocaleString()} – ${job.salaryMax?.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <BrainCircuit className="h-4 w-4" />
                  AI-Collaborative Interview
                </div>
                <p className="text-sm text-muted-foreground">
                  Our interviews are designed so that candidates who use AI tools (ChatGPT, Claude,
                  Copilot, etc.) produce better answers — not worse ones. You're encouraged to use
                  any AI tool during the interview.
                </p>
              </CardContent>
            </Card>

            {job.description && (
              <div>
                <h3 className="font-semibold mb-2">About the Role</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {job.requirements && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-semibold">Apply for this role</h2>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="flex items-center gap-1.5">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                    <span className="text-muted-foreground text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="linkedin.com/in/jane"
                    value={form.linkedinUrl}
                    onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resume" className="flex items-center gap-1.5">
                  Resume / Background <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Paste your resume text, or summarise your background and relevant experience.
                </p>
                <Textarea
                  id="resume"
                  placeholder="Paste your resume or describe your background, skills, and relevant experience…"
                  rows={8}
                  value={form.resumeText}
                  onChange={(e) => setForm((f) => ({ ...f, resumeText: e.target.value }))}
                  className={errors.resumeText ? "border-destructive" : ""}
                />
                {errors.resumeText && <p className="text-xs text-destructive">{errors.resumeText}</p>}
              </div>

              {createApplicant.isError && (
                <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                  Something went wrong submitting your application. Please try again.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={createApplicant.isPending}
              >
                {createApplicant.isPending ? "Submitting…" : "Submit Application"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting you agree to be contacted about this role.
              </p>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
