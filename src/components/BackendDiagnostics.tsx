import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Loader2, Server, Database, HardDrive } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
}

export function BackendDiagnostics() {
  const { user, creator } = useAuth();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setRunning(true);
    const newResults: DiagnosticResult[] = [];

    // Test 1: Check creator access
    try {
      if (creator) {
        const { data, error } = await supabase
          .from("creators")
          .select("id")
          .eq("user_id", user?.id)
          .maybeSingle();

        if (error) throw error;
        
        newResults.push({
          name: "Creator Profile",
          status: data ? "success" : "error",
          message: data ? "Creator profile found" : "No creator profile found",
        });
      } else {
        newResults.push({
          name: "Creator Profile",
          status: "error",
          message: "Not logged in as creator",
        });
      }
    } catch (e) {
      newResults.push({
        name: "Creator Profile",
        status: "error",
        message: e instanceof Error ? e.message : "Failed to check",
      });
    }

    // Test 2: Check dump_packs table access
    try {
      const { data, error } = await supabase
        .from("dump_packs")
        .select("id")
        .limit(1);

      if (error) throw error;
      
      newResults.push({
        name: "Dump Packs Table",
        status: "success",
        message: `Table accessible (${data?.length || 0} sample rows)`,
      });
    } catch (e) {
      newResults.push({
        name: "Dump Packs Table",
        status: "error",
        message: e instanceof Error ? e.message : "Failed to query",
      });
    }

    // Test 3: Check storage buckets
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      const bucketNames = buckets?.map(b => b.name) || [];
      const hasPreviews = bucketNames.includes("previews");
      const hasDumps = bucketNames.includes("dumps");
      
      newResults.push({
        name: "Previews Bucket",
        status: hasPreviews ? "success" : "error",
        message: hasPreviews ? "Available (public)" : "Not found",
      });
      
      newResults.push({
        name: "Dumps Bucket",
        status: hasDumps ? "success" : "error",
        message: hasDumps ? "Available (private)" : "Not found",
      });
    } catch (e) {
      newResults.push({
        name: "Storage Buckets",
        status: "error",
        message: e instanceof Error ? e.message : "Failed to list buckets",
      });
    }

    // Test 4: Check session validity
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      newResults.push({
        name: "Auth Session",
        status: session ? "success" : "error",
        message: session 
          ? `Valid (expires ${new Date(session.expires_at! * 1000).toLocaleTimeString()})` 
          : "No active session",
      });
    } catch (e) {
      newResults.push({
        name: "Auth Session",
        status: "error",
        message: e instanceof Error ? e.message : "Failed to check session",
      });
    }

    setResults(newResults);
    setRunning(false);
  };

  const getIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (name: string) => {
    if (name.includes("Bucket") || name.includes("Storage")) {
      return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    }
    if (name.includes("Table") || name.includes("Profile")) {
      return <Database className="h-4 w-4 text-muted-foreground" />;
    }
    return <Server className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4" />
          Backend Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={running}
          variant="outline"
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running tests...
            </>
          ) : (
            "Test Backend Connection"
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 text-sm"
              >
                <div className="flex items-center gap-2">
                  {getCategoryIcon(result.name)}
                  <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{result.message}</span>
                  {getIcon(result.status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connection info */}
        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          <p>Project: {import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pigkjkuteodszjkarwvz'}</p>
        </div>
      </CardContent>
    </Card>
  );
}