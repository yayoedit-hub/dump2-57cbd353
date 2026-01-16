import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Play, 
  Pause, 
  Music, 
  FileArchive, 
  Layers,
  Calendar,
  ArrowRight 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DumpPack {
  id: string;
  title: string;
  description: string | null;
  bpm: number | null;
  key: string | null;
  pack_type: "flp_only" | "zipped_project" | "compatible_pack";
  tags: string[] | null;
  preview_path: string | null;
  created_at: string;
  creator_id: string;
  creator: {
    id: string;
    handle: string;
    price_usd: number | null;
    user_id: string;
    profile: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

const PACK_TYPE_BADGES: Record<string, { label: string; icon: React.ReactNode }> = {
  flp_only: { label: "FLP", icon: <Music className="h-3 w-3" /> },
  zipped_project: { label: "Project", icon: <FileArchive className="h-3 w-3" /> },
  compatible_pack: { label: "Full Pack", icon: <Layers className="h-3 w-3" /> },
};

export default function Feed() {
  const { user } = useAuth();
  const [playingPackId, setPlayingPackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch all dump packs with creator info
  const { data: packs, isLoading: packsLoading } = useQuery({
    queryKey: ["feed-packs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dump_packs")
        .select(`
          id,
          title,
          description,
          bpm,
          key,
          pack_type,
          tags,
          preview_path,
          created_at,
          creator_id,
          creators!inner (
            id,
            handle,
            price_usd,
            user_id
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles for creators
      const creatorUserIds = [...new Set((data || []).map(p => p.creators.user_id))];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", creatorUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(pack => ({
        ...pack,
        creator: {
          ...pack.creators,
          profile: profileMap.get(pack.creators.user_id) || null,
        },
      })) as DumpPack[];
    },
  });

  // Fetch user's active subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("subscriptions")
        .select("creator_id")
        .eq("subscriber_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data.map(s => s.creator_id);
    },
    enabled: !!user,
  });

  const subscribedCreatorIds = new Set(subscriptions || []);

  const handlePlayPreview = (pack: DumpPack) => {
    if (!pack.preview_path) return;

    if (playingPackId === pack.id) {
      audioRef.current?.pause();
      setPlayingPackId(null);
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const previewUrl = supabase.storage
      .from("previews")
      .getPublicUrl(pack.preview_path).data.publicUrl;

    audioRef.current = new Audio(previewUrl);
    audioRef.current.play();
    audioRef.current.onended = () => setPlayingPackId(null);
    setPlayingPackId(pack.id);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const isSubscribed = (creatorId: string) => subscribedCreatorIds.has(creatorId);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Feed</h1>
          <p className="text-muted-foreground">
            Latest dumps from creators across the platform
          </p>
        </div>

        {/* Feed */}
        {packsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !packs || packs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No dumps yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to explore! Check out creators and subscribe to see their latest dumps here.
            </p>
            <Link to="/explore">
              <Button>
                Explore Creators
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {packs.map((pack) => {
              const packType = PACK_TYPE_BADGES[pack.pack_type];
              const subscribed = isSubscribed(pack.creator_id);
              const isPlaying = playingPackId === pack.id;
              const creatorName = pack.creator.profile?.display_name || pack.creator.handle;
              const avatarUrl = pack.creator.profile?.avatar_url;

              return (
                <article
                  key={pack.id}
                  className="p-4 md:p-5 rounded-xl border border-border bg-card hover:border-accent/50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Play Button */}
                    <button
                      onClick={() => handlePlayPreview(pack)}
                      disabled={!pack.preview_path}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                        pack.preview_path
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-muted-foreground cursor-not-allowed"
                      }`}
                      aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-0.5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link 
                          to={`/pack/${pack.id}`}
                          className="font-semibold text-lg hover:text-accent transition-colors truncate"
                        >
                          {pack.title}
                        </Link>
                        {packType && (
                          <Badge variant="secondary" className="flex-shrink-0 gap-1">
                            {packType.icon}
                            {packType.label}
                          </Badge>
                        )}
                      </div>

                      {/* Creator Info */}
                      <Link 
                        to={`/creator/${pack.creator.handle}`}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {creatorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>@{pack.creator.handle}</span>
                      </Link>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                        {pack.bpm && (
                          <span className="font-medium">{pack.bpm} BPM</span>
                        )}
                        {pack.key && (
                          <span className="font-medium">{pack.key}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(pack.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Tags */}
                      {pack.tags && pack.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pack.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {pack.tags.length > 4 && (
                            <span className="px-2 py-0.5 text-xs text-muted-foreground">
                              +{pack.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex items-center gap-3">
                        {subscribed ? (
                          <Link to={`/pack/${pack.id}`}>
                            <Button size="sm" variant="outline">
                              View Pack
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/creator/${pack.creator.handle}`}>
                            <Button size="sm">
                              {pack.creator.price_usd === 0 || pack.creator.price_usd === null
                                ? "Subscribe Free"
                                : `Subscribe $${pack.creator.price_usd}/mo`}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
