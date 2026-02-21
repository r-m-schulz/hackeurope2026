import { Link } from "react-router-dom";
import { ShieldCheck, Target, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/LandingNav";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-4">About TrueBalance</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            TrueBalance was built because your bank balance alone doesn’t tell the full story. Tax
            reserves, recurring payments, and upcoming bills can make “available” cash misleading.
            We help you see the truth.
          </p>

          <div className="mt-12 space-y-10">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Our mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To give SMEs and individuals a clear, honest view of their cash position. We
                  combine balance, tax estimates, recurring payments, and forecasts so you can plan
                  with confidence and avoid surprises.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">What we do</h2>
                <p className="text-muted-foreground leading-relaxed">
                  TrueBalance shows true available cash (after tax and recurring commitments), a 30-day
                  cash forecast, expense breakdown by category, cash runway, and simple AI-driven
                  insights. We focus on clarity, not complexity.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Who it’s for</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Small and medium businesses that need to manage cash flow and tax, and individuals
                  who want to know exactly where they stand. Whether you’re a freelancer, startup, or
                  growing company, TrueBalance is built to keep things simple and actionable.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Built with care</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We built TrueBalance for HackEurope 2026 with a focus on real cash visibility and
                  usability. If you have feedback or ideas, we’d love to hear from you.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row items-center gap-4">
            <Link to="/">
              <Button variant="outline">Back to home</Button>
            </Link>
            <Link to="/login" state={{ tab: "signup" }}>
              <Button className="gap-2">Get started</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
