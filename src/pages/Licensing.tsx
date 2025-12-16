import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";

export default function Licensing() {
  return (
    <Layout>
      <div className="container py-16 md:py-24 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">Licensing</h1>
        <p className="text-muted-foreground mb-12">
          Understanding how you can use dump packs from creators.
        </p>
        
        <div className="space-y-12">
          <section className="p-6 rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary" className="text-sm">Default</Badge>
              <h2 className="text-2xl font-semibold">Personal Use Only</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Most dump packs are licensed for personal use only. This means you can:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Download and study the project files
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Learn production techniques and sound design
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Use as reference or practice material
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Create derivative works for personal projects
              </li>
            </ul>
            <p className="text-muted-foreground">
              <strong>You cannot:</strong> Release commercially, distribute publicly, or claim as your own original work without the creator's explicit permission.
            </p>
          </section>
          
          <section className="p-6 rounded-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="text-sm">Commercial</Badge>
              <h2 className="text-2xl font-semibold">Commercial with Credit</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Some creators allow commercial use with proper credit. This means you can:
            </p>
            <ul className="space-y-2 text-muted-foreground mb-4">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Everything in Personal Use, plus:
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Release finished tracks commercially
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Upload to streaming platforms
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                Monetize on YouTube, etc.
              </li>
            </ul>
            <p className="text-muted-foreground">
              <strong>Required:</strong> Credit the original creator in your release (e.g., "Contains production elements from @creatorhandle via Dump")
            </p>
          </section>
          
          <section className="p-6 rounded-xl bg-secondary/50">
            <h2 className="text-xl font-semibold mb-4">Important Notes</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <strong>Check each creator's profile:</strong> License type is displayed on every creator's page.
              </li>
              <li>
                <strong>When in doubt, ask:</strong> Contact the creator directly for clarification or custom licensing.
              </li>
              <li>
                <strong>Keep records:</strong> Save your subscription history as proof of legitimate access.
              </li>
              <li>
                <strong>Respect the community:</strong> Proper licensing protects both creators and subscribers.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Layout>
  );
}
