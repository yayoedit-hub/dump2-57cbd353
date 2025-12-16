import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Music, 
  Users, 
  Calendar, 
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  FileArchive,
  FileAudio,
  Piano
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DumpPack {
  id: string;
  title: string;
  bpm: number | null;
  key: string | null;
  pack_type: "flp_only" | "zipped_project" | "compatible_pack";
  created_at: string;
  stems_zip_path: string | null;
  midi_zip_path: string | null;
}

const PACK_TYPE_LABELS: Record<string, string> = {
  flp_only: "FLP",
  zipped_project: "Project",
  compatible_pack: "Full Pack",
};

export default function CreatorDashboard() {
  const { user, profile, creator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [packs, setPacks] = useState<DumpPack[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !creator) {
      toast.error("You need to be a creator to access the dashboard");
      navigate("/settings");
    } else if (creator) {
      fetchData();
    }
  }, [creator, authLoading]);

  const fetchData = async () => {
    if (!creator) return;
    setLoading(true);

    // Fetch packs
    const { data: packsData } = await supabase
      .from("dump_packs")
      .select("id, title, bpm, key, pack_type, created_at, stems_zip_path, midi_zip_path")
      .eq("creator_id", creator.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    setPacks((packsData || []) as DumpPack[]);

    // Fetch subscriber count
    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", creator.id)
      .eq("status", "active");

    setSubscriberCount(count || 0);
    setLoading(false);
  };

  const handleDelete = async (packId: string) => {
    setDeletingId(packId);
    
    const { error } = await supabase
      .from("dump_packs")
      .update({ is_deleted: true })
      .eq("id", packId);

    if (error) {
      toast.error("Failed to delete pack");
    } else {
      toast.success("Pack deleted");
      setPacks(packs.filter(p => p.id !== packId));
    }
    
    setDeletingId(null);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return null;
  }

  const lastUploadDate = packs[0]?.created_at 
    ? new Date(packs[0].created_at).toLocaleDateString() 
    : "Never";

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Creator Dashboard</h1>
            <p className="text-muted-foreground">@{creator.handle}</p>
          </div>
          <Link to="/creator/upload">
            <Button>
              <Plus className="h-4 w-4" />
              Upload Dump Pack
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Uploads
              </CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriberCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Upload
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastUploadDate}</div>
            </CardContent>
          </Card>
        </div>

        {/* Uploads List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Dump Packs</h2>

          {packs.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-border rounded-xl">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing your unfinished projects with subscribers.
              </p>
              <Link to="/creator/upload">
                <Button>
                  <Plus className="h-4 w-4" />
                  Upload your first Dump Pack
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        to={`/pack/${pack.id}`}
                        className="font-semibold hover:text-accent transition-colors truncate"
                      >
                        {pack.title}
                      </Link>
                      <Badge variant="secondary" className="shrink-0">
                        {PACK_TYPE_LABELS[pack.pack_type]}
                      </Badge>
                      {pack.stems_zip_path && (
                        <Badge variant="outline" className="shrink-0 gap-1">
                          <FileAudio className="h-3 w-3" />
                          Stems
                        </Badge>
                      )}
                      {pack.midi_zip_path && (
                        <Badge variant="outline" className="shrink-0 gap-1">
                          <Piano className="h-3 w-3" />
                          MIDI
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {pack.bpm && <span>{pack.bpm} BPM</span>}
                      {pack.key && <span>{pack.key}</span>}
                      <span>{new Date(pack.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/pack/${pack.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this dump pack?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the pack from your library. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(pack.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
