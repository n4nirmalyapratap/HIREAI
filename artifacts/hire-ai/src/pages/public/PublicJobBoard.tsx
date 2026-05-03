import { useListJobs } from "@workspace/api-client-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Clock, ArrowRight, BrainCircuit } from "lucide-react";

export default function PublicJobBoard() {
  const { data: jobs, isLoading } = useListJobs();
  const activeJobs = jobs?.filter((j) => j.status === "active") ?? [];

  return (
    <PublicLayout>
      <div className="space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">We're Hiring</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We're looking for people who work <em>with</em> AI, not against it. Our interviews
            are designed to celebrate your ability to use AI tools well.
          </p>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full border border-primary/20">
            <BrainCircuit className="h-4 w-4" />
            AI-collaborative interviews — use your tools freely
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {isLoading ? "Loading…" : `${activeJobs.length} open position${activeJobs.length !== 1 ? "s" : ""}`}
          </p>

          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))
          ) : activeJobs.length ? (
            activeJobs.map((job) => (
              <Link
                key={job.id}
                href={`/apply/${job.id}`}
                className="block group"
              >
                <div className="border rounded-xl p-6 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {job.title}
                        </h2>
                        <Badge variant="default" className="text-xs">Hiring</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5" /> {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Clock className="h-3.5 w-3.5" /> {job.type.replace("_", " ")}
                        </span>
                        {(job.salaryMin || job.salaryMax) && (
                          <span className="font-medium text-foreground">
                            ${job.salaryMin?.toLocaleString()}
                            {job.salaryMax ? ` – $${job.salaryMax?.toLocaleString()}` : "+"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors pt-1">
                      Apply <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
              No open positions right now. Check back soon.
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
