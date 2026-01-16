import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialLinks } from "@/components/SocialLinks";
import { 
  Play, 
  Pause, 
  Download, 
  Lock, 
  Music, 
  FileArchive,
  FileAudio,
  Piano,
  Shuffle,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Creator {
  id: string;
  handle: string;
  bio: string | null;
  tags: string[];
  banner_url: string | null;
  price_usd: number;
  license_type: "personal_only" | "commercial_with_credit";
  back_catalog_access: boolean;
  user_id: string;
  // Note: stripe_price_id is NOT in creators_public view - we don't need it on client side
  // The edge function handles Stripe pricing server-side
  soundcloud_url: string | null;
  spotify_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface DumpPack {
  id: string;
  title: string;
  description: string | null;
  bpm: number | null;
  key: string | null;
  tags: string[];
  pack_type: "flp_only" | "zipped_project" | "compatible_pack";
  preview_path: string;
  project_zip_path: string | null;
  flp_path: string | null;
  stems_zip_path: string | null;
  midi_zip_path: string | null;
  created_at: string;
}

const PACK_TYPE_BADGES: Record<string, { label: string; icon: React.ReactNode }> = {
  flp_only: { label: "FLP", icon: <Music className="h-3 w-3" /> },
  zipped_project: { label: "Project", icon: <FileArchive className="h-3 w-3" /> },
  compatible_pack: { label: "Full Pack", icon: <FileAudio className="h-3 w-3" /> },
};

export default function CreatorProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { user, profile } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [packs, setPacks] = useState<DumpPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (handle) {
      fetchCreatorData();
    }
  }, [handle, user]);

  const fetchCreatorData = async () => {
    setLoading(true);

    // SECURITY: Use creators_public view which excludes sensitive data
    // (stripe_account_id, stripe_product_id, payout_email)
    // Note: stripe_price_id is NOT in the public view - we need to fetch it separately if needed for paid creators
    const { data: creatorData, error: creatorError } = await supabase
      .from("creators_public")
      .select(`
        id,
        handle,
        bio,
        tags,
        banner_url,
        price_usd,
        license_type,
        back_catalog_access,
        user_id,
        is_active,
        created_at,
        updated_at,
        soundcloud_url,
        spotify_url,
        website_url,
        instagram_url,
        youtube_url,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq("handle", handle)
      .eq("is_active", true)
      .maybeSingle();

    if (creatorError || !creatorData) {
      console.error("Error fetching creator:", creatorError);
      setLoading(false);
      return;
    }

    setCreator(creatorData as Creator);

    // Fetch packs
    const { data: packsData } = await supabase
      .from("dump_packs")
      .select("*")
      .eq("creator_id", creatorData.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    setPacks((packsData || []) as DumpPack[]);

    // Check subscription status
    if (user) {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("subscriber_id", user.id)
        .eq("creator_id", creatorData.id)
        .eq("status", "active")
        .maybeSingle();

      setIsSubscribed(!!subData);
    }

    setLoading(false);
  };

  const handlePlayPreview = async (pack: DumpPack) => {
    if (playingId === pack.id) {
      audioRef?.pause();
      setPlayingId(null);
      return;
    }

    // Get public URL for preview
    const { data } = supabase.storage.from("previews").getPublicUrl(pack.preview_path);
    
    if (audioRef) {
      audioRef.pause();
    }

    const audio = new Audio(data.publicUrl);
    audio.play();
    audio.onended = () => setPlayingId(null);
    setAudioRef(audio);
    setPlayingId(pack.id);
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      window.location.href = "/auth";
      return;
    }
    
    if (!creator) return;

    setSubscribing(true);

    try {
      // Handle free subscriptions directly
      if (creator.price_usd === 0) {
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert({
            subscriber_id: user.id,
            creator_id: creator.id,
            status: "active",
          });

        if (subError) {
          if (subError.code === "23505") {
            toast.error("You already have a subscription to this creator");
          } else {
            throw subError;
          }
        } else {
          toast.success(`Subscribed to ${creator.profiles?.display_name || creator.handle}!`);
          setIsSubscribed(true);
        }
        setSubscribing(false);
        return;
      }

      // Paid subscriptions go through Stripe - the edge function will verify pricing server-side
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { creator_id: creator.id }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
      setSubscribing(false);
    }
  };

  const handleRandomDump = () => {
    if (!isSubscribed || packs.length === 0) return;
    const randomPack = packs[Math.floor(Math.random() * packs.length)];
    window.location.href = `/pack/${randomPack.id}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-48 bg-secondary" />
          <div className="container py-8">
            <div className="flex items-end gap-6 -mt-16">
              <div className="w-32 h-32 rounded-full bg-secondary border-4 border-background" />
              <div className="flex-1 pb-4">
                <div className="h-8 w-48 bg-secondary rounded mb-2" />
                <div className="h-4 w-24 bg-secondary rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Creator not found</h1>
          <p className="text-muted-foreground mb-6">
            This creator doesn't exist or has been deactivated.
          </p>
          <Link to="/explore">
            <Button>Explore creators</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const displayName = creator.profiles?.display_name || creator.handle;
  const hasLinks = creator.soundcloud_url || creator.spotify_url || creator.website_url || creator.instagram_url || creator.youtube_url;

  return (
    <Layout>
      {/* Banner */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-br from-secondary to-secondary/50"
        style={creator.banner_url ? { 
          backgroundImage: `url(${creator.banner_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        } : undefined}
      />

      {/* Profile Header Section - Below Banner with dark background for readability */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar - Positioned to overlap banner */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-4xl font-bold overflow-hidden -mt-20 md:-mt-24 shrink-0">
              {creator.profiles?.avatar_url ? (
                <img
                  src={creator.profiles.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Name and Tags */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
              <p className="text-muted-foreground">@{creator.handle}</p>
              {creator.tags && creator.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {creator.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          
            {/* Price and Subscribe Actions */}
            <div className="flex flex-col items-start md:items-end gap-3 md:ml-auto">
              <div className="flex items-center gap-2">
                {creator.price_usd === 0 ? (
                  <Badge variant="free" className="px-4 py-1.5 text-sm">
                    Free to Subscribe
                  </Badge>
                ) : (
                  <div className="text-right">
                    <span className="text-2xl font-bold">${creator.price_usd}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {isSubscribed ? (
                  <Button variant="secondary" disabled>
                    Subscribed
                  </Button>
                ) : (
                  <Button size="lg" onClick={handleSubscribe} disabled={subscribing}>
                    {subscribing ? "Redirecting..." : "Subscribe"}
                  </Button>
                )}
                <Link to="/download">
                  <Button variant="outline" size="lg">
                    Get App to Upload
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Social Links */}
        {hasLinks && (
          <div className="my-6">
            <SocialLinks
              soundcloudUrl={creator.soundcloud_url}
              spotifyUrl={creator.spotify_url}
              websiteUrl={creator.website_url}
              instagramUrl={creator.instagram_url}
              youtubeUrl={creator.youtube_url}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="dumps" className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="dumps">Dumps ({packs.length})</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            {isSubscribed && packs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleRandomDump}>
                <Shuffle className="h-4 w-4" />
                Random Dump
              </Button>
            )}
          </div>

          <TabsContent value="dumps" className="mt-0">
            {packs.length === 0 ? (
              <div className="py-16 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No dumps yet</h3>
                <p className="text-muted-foreground">
                  This creator hasn't uploaded any dump packs yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {packs.map((pack) => (
                  <article
                    key={pack.id}
                    className="p-4 md:p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon / Play Button - Show play only if preview exists */}
                      {pack.preview_path ? (
                        <button
                          onClick={() => handlePlayPreview(pack)}
                          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
                        >
                          {playingId === pack.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                          )}
                        </button>
                      ) : (
                        <Link 
                          to={`/pack/${pack.id}`}
                          className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors shrink-0"
                        >
                          <FileArchive className="h-5 w-5" />
                        </Link>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Link 
                              to={`/pack/${pack.id}`}
                              className="font-semibold hover:text-accent transition-colors"
                            >
                              {pack.title}
                            </Link>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              {pack.bpm && <span>{pack.bpm} BPM</span>}
                              {pack.key && <span>{pack.key}</span>}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(pack.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Pack Type Badges */}
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="gap-1">
                              {PACK_TYPE_BADGES[pack.pack_type].icon}
                              {PACK_TYPE_BADGES[pack.pack_type].label}
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
                        </div>

                        {/* Tags */}
                        {pack.tags && pack.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {pack.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Download / Lock */}
                      <div className="shrink-0">
                        {isSubscribed ? (
                          <Link to={`/pack/${pack.id}`}>
                            <Button size="sm">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="secondary" disabled>
                            <Lock className="h-4 w-4" />
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-0">
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-muted-foreground">
                  {creator.bio || "No bio provided."}
                </p>
              </div>

              {creator.tags && creator.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {hasLinks && (
                <div>
                  <h3 className="font-semibold mb-2">Listen</h3>
                  <SocialLinks
                    soundcloudUrl={creator.soundcloud_url}
                    spotifyUrl={creator.spotify_url}
                    websiteUrl={creator.website_url}
                    instagramUrl={creator.instagram_url}
                    youtubeUrl={creator.youtube_url}
                  />
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">License</h3>
                <p className="text-muted-foreground">
                  {creator.license_type === "personal_only"
                    ? "Personal use only. Contact creator for commercial licensing."
                    : "Commercial use allowed with credit to the creator."}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Back Catalog Access</h3>
                <p className="text-muted-foreground">
                  {creator.back_catalog_access
                    ? "New subscribers get access to all previous dumps."
                    : "New subscribers only get access to dumps uploaded after subscribing."}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
