import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Music, 
  Users, 
  Calendar, 
  Eye,
  FileAudio,
  Piano,
  Download,
  ExternalLink,
  Play,
  Pause,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DumpPack {
  id: string;
  title: string;
  description: string | null;
  bpm: number | null;
  key: string | null;
  tags: string[];
  pack_type: "flp_only" | "zipped_project" | "compatible_pack";
  created_at: string;
  preview_path: string | null;
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
  
  // Audio player state
  const [playingPackId, setPlayingPackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Edit dialog state
  const [editingPack, setEditingPack] = useState<DumpPack | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBpm, setEditBpm] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Delete dialog state
  const [deletingPack, setDeletingPack] = useState<DumpPack | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !creator) {
      toast.error("You need to be a creator to access the dashboard");
      navigate("/settings");
    } else if (creator) {
      fetchData();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [creator, authLoading]);

  const fetchData = async () => {
    if (!creator) return;
    setLoading(true);

    const { data: packsData } = await supabase
      .from("dump_packs")
      .select("id, title, description, bpm, key, tags, pack_type, created_at, preview_path, stems_zip_path, midi_zip_path")
      .eq("creator_id", creator.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    setPacks((packsData || []) as DumpPack[]);

    const { count } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", creator.id)
      .eq("status", "active");

    setSubscriberCount(count || 0);
    setLoading(false);
  };

  const handlePlayPause = (pack: DumpPack) => {
    if (!pack.preview_path) return;

    if (playingPackId === pack.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingPackId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const { data } = supabase.storage.from("previews").getPublicUrl(pack.preview_path);
    audioRef.current = new Audio(data.publicUrl);
    audioRef.current.onended = () => setPlayingPackId(null);
    audioRef.current.play();
    setPlayingPackId(pack.id);
  };

  const openEditDialog = (pack: DumpPack) => {
    setEditingPack(pack);
    setEditTitle(pack.title);
    setEditDescription(pack.description || "");
    setEditBpm(pack.bpm?.toString() || "");
    setEditKey(pack.key || "");
    setEditTags(pack.tags?.join(", ") || "");
  };

  const handleSaveEdit = async () => {
    if (!editingPack) return;
    setSaving(true);

    const { error } = await supabase
      .from("dump_packs")
      .update({
        title: editTitle,
        description: editDescription || null,
        bpm: editBpm ? parseInt(editBpm) : null,
        key: editKey || null,
        tags: editTags ? editTags.split(",").map(t => t.trim()).filter(Boolean) : [],
      })
      .eq("id", editingPack.id);

    if (error) {
      toast.error("Failed to save changes");
    } else {
      toast.success("Pack updated");
      fetchData();
    }

    setSaving(false);
    setEditingPack(null);
  };

  const handleDelete = async () => {
    if (!deletingPack) return;
    setDeleting(true);

    const { error } = await supabase
      .from("dump_packs")
      .update({ is_deleted: true })
      .eq("id", deletingPack.id);

    if (error) {
      toast.error("Failed to delete pack");
    } else {
      toast.success("Pack deleted");
      fetchData();
    }

    setDeleting(false);
    setDeletingPack(null);
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

  const hasAvatar = !!profile?.avatar_url;
  const hasBio = !!creator.bio && creator.bio.length > 0;
  const hasPriceSet = !!creator.price_usd && creator.price_usd > 0;
  const hasLinks = !!(creator.soundcloud_url || creator.spotify_url || creator.website_url || creator.instagram_url || creator.youtube_url);

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Creator Overview</h1>
            <p className="text-muted-foreground">@{creator.handle}</p>
          </div>
          <div className="flex gap-3">
            <Link to={`/creator/${creator.handle}`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4" />
                View Profile
              </Button>
            </Link>
            <Link to="/download">
              <Button>
                <Download className="h-4 w-4" />
                Get App to Upload
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
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
                    Download the Dump app to start uploading your projects.
                  </p>
                  <Link to="/download">
                    <Button>
                      <Download className="h-4 w-4" />
                      Get Dump App
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
                      {/* Preview Play Button */}
                      {pack.preview_path ? (
                        <button
                          onClick={() => handlePlayPause(pack)}
                          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                        >
                          {playingPackId === pack.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5" />
                          )}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

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

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(pack)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingPack(pack)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link to={`/pack/${pack.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProfileCompleteness
              hasAvatar={hasAvatar}
              hasBio={hasBio}
              hasPriceSet={hasPriceSet}
              hasLinks={hasLinks}
              dumpsCount={packs.length}
            />

            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3">How to Upload</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-4">
                <li>Download and install Dump App</li>
                <li>Sign in with your account</li>
                <li>Click "Create Dump folder"</li>
                <li>Export your FL project to that folder</li>
                <li>It auto-uploads to your profile</li>
              </ol>
              <Link to="/download">
                <Button variant="outline" className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Download Dump App
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingPack} onOpenChange={() => setEditingPack(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pack</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BPM</Label>
                  <Input
                    type="number"
                    value={editBpm}
                    onChange={(e) => setEditBpm(e.target.value)}
                    placeholder="e.g. 140"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Key</Label>
                  <Input
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    placeholder="e.g. C minor"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="trap, dark, melodic"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPack(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingPack} onOpenChange={() => setDeletingPack(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Pack?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove "{deletingPack?.title}" from your profile. Subscribers will no longer be able to access it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
