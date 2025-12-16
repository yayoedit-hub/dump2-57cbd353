import { Check, X, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProfileCompletenessProps {
  hasAvatar: boolean;
  hasBio: boolean;
  hasPriceSet: boolean;
  hasLinks: boolean;
  dumpsCount: number;
}

export function ProfileCompleteness({
  hasAvatar,
  hasBio,
  hasPriceSet,
  hasLinks,
  dumpsCount
}: ProfileCompletenessProps) {
  const items = [
    { label: "Avatar uploaded", complete: hasAvatar },
    { label: "Bio written", complete: hasBio },
    { label: "Price set", complete: hasPriceSet },
    { label: "At least one link (Spotify/SoundCloud recommended)", complete: hasLinks },
    { label: `First dump uploaded (${dumpsCount} total)`, complete: dumpsCount > 0 }
  ];
  
  const completedCount = items.filter(i => i.complete).length;
  const isComplete = completedCount === items.length;
  
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Profile Completeness</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{items.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.complete ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      
      {dumpsCount === 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Ready to upload your first dump? Get the desktop app.
          </p>
          <Link to="/download">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download Dump App
            </Button>
          </Link>
        </div>
      )}
      
      {isComplete && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-primary">
            ✓ Your profile is complete! You're ready to grow your subscriber base.
          </p>
        </div>
      )}
    </div>
  );
}
