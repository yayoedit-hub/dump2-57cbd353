import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Download, 
  Lock, 
  Music, 
  FileArchive,
  FileAudio,
  Piano,
  Calendar,
  ArrowLeft,
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
  preview_path: string | null;
  dump_zip_path: string | null;
  project_zip_path: string | null;
  flp_path: string | null;
  stems_zip_path: string | null;
  midi_zip_path: string | null;
  created_at: string;
  creator_id: string;
}

interface Creator {
  id: string;
  handle: string;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

const PACK_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  flp_only: { label: "FLP Only", description: "Single FL Studio project file" },
  zipped_project: { label: "Zipped Project", description: "FL Studio project with all samples included" },
  compatible_pack: { label: "Compatible Pack", description: "Full project with optional stems and MIDI" },
};

export default function PackDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, creator: userCreator } = useAuth();
  const [pack, setPack] = useState<DumpPack | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (id) {
      fetchPackData();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [id, user]);

  const fetchPackData = async () => {
    setLoading(true);

    // Fetch pack
    const { data: packData, error: packError } = await supabase
      .from("dump_packs")
      .select("*")
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();

    if (packError || !packData) {
      console.error("Error fetching pack:", packError);
      setLoading(false);
      return;
    }

    setPack(packData as DumpPack);

    // Fetch creator
    const { data: creatorData } = await supabase
      .from("creators")
      .select(`
        id,
        handle,
        user_id,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq("id", packData.creator_id)
      .single();

    if (creatorData) {
      setCreator(creatorData as Creator);

      // Check access
      if (user) {
        // Check if user is the creator
        if (creatorData.user_id === user.id) {
          setHasAccess(true);
        } else {
          // Check subscription
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("subscriber_id", user.id)
            .eq("creator_id", creatorData.id)
            .eq("status", "active")
            .maybeSingle();

          setHasAccess(!!subData);
        }
      }
    }

    setLoading(false);
  };

  const handlePlayPause = () => {
    if (!pack || !pack.preview_path) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const { data } = supabase.storage.from("previews").getPublicUrl(pack.preview_path);
    
    if (!audioRef.current) {
      audioRef.current = new Audio(data.publicUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleDownload = async (fileType: "project" | "stems" | "midi") => {
    if (!pack || !user) return;

    setDownloadingFile(fileType);

    try {
      const { data, error } = await supabase.functions.invoke("get-download-url", {
        body: { dump_pack_id: pack.id, file_type: fileType }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Download started");
      } else {
        throw new Error("No download URL received");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download. Please try again.");
    } finally {
      setDownloadingFile(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-secondary rounded" />
            <div className="h-10 w-64 bg-secondary rounded" />
            <div className="h-24 bg-secondary rounded-xl" />
            <div className="h-48 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!pack || !creator) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Pack not found</h1>
          <p className="text-muted-foreground mb-6">
            This dump pack doesn't exist or has been deleted.
          </p>
          <Link to="/explore">
            <Button>Explore creators</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const displayName = creator.profiles?.display_name || creator.handle;
  // Check for project file using dump_zip_path (desktop app) or fallback to project_zip_path/flp_path
  const hasProject = pack.dump_zip_path || pack.project_zip_path || pack.flp_path;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Back Link */}
        <Link 
          to={`/creator/${creator.handle}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {displayName}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary">
              {PACK_TYPE_LABELS[pack.pack_type].label}
            </Badge>
            {pack.stems_zip_path && (
              <Badge variant="outline" className="gap-1">
                <FileAudio className="h-3 w-3" />
                Stems
              </Badge>
            )}
            {pack.midi_zip_path && (
              <Badge variant="outline" className="gap-1">
                <Piano className="h-3 w-3" />
                MIDI
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{pack.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Link 
              to={`/creator/${creator.handle}`}
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {displayName}
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(pack.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Preview Player */}
        <div className="p-6 rounded-xl border border-border bg-card mb-8">
          {pack.preview_path ? (
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <p className="font-medium">Preview</p>
                <p className="text-sm text-muted-foreground">
                  {isPlaying ? "Now playing..." : "Click to play preview"}
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {pack.bpm && <p>{pack.bpm} BPM</p>}
                {pack.key && <p>{pack.key}</p>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Music className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">No preview available</p>
                <p className="text-sm text-muted-foreground">
                  This pack doesn't have a preview audio file
                </p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {pack.bpm && <p>{pack.bpm} BPM</p>}
                {pack.key && <p>{pack.key}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {pack.description && (
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Notes</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {pack.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {pack.tags && pack.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {pack.tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Downloads */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="font-semibold mb-4">Downloads</h2>

          {!hasAccess ? (
            <div className="text-center py-8">
              <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Subscribe to download</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get access to this pack and all of {displayName}'s library.
              </p>
              <Link to={`/creator/${creator.handle}`}>
                <Button>Subscribe to {displayName}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {hasProject && (
                <button
                  onClick={() => handleDownload("project")}
                  disabled={!!downloadingFile}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <FileArchive className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {pack.pack_type === "flp_only" ? "Project FLP" : "Project ZIP"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {PACK_TYPE_LABELS[pack.pack_type].description}
                    </p>
                  </div>
                  {downloadingFile === "project" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </button>
              )}

              {pack.stems_zip_path && (
                <button
                  onClick={() => handleDownload("stems")}
                  disabled={!!downloadingFile}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <FileAudio className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Stems ZIP</p>
                    <p className="text-sm text-muted-foreground">
                      Individual track exports
                    </p>
                  </div>
                  {downloadingFile === "stems" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </button>
              )}

              {pack.midi_zip_path && (
                <button
                  onClick={() => handleDownload("midi")}
                  disabled={!!downloadingFile}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
                >
                  <Piano className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">MIDI ZIP</p>
                    <p className="text-sm text-muted-foreground">
                      MIDI files for melodies and drums
                    </p>
                  </div>
                  {downloadingFile === "midi" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
