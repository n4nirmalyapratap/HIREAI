import React from "react";
import { Link } from "wouter";
import { CheckSquare } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/apply" className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            <span className="bg-primary text-primary-foreground p-1 rounded-md">
              <CheckSquare size={18} />
            </span>
            HireAI
          </Link>
          <span className="text-sm text-muted-foreground">Open Positions</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-10">
        {children}
      </main>
      <footer className="border-t mt-16 py-6 text-center text-xs text-muted-foreground">
        Powered by HireAI — AI-powered hiring for modern teams
      </footer>
    </div>
  );
}
