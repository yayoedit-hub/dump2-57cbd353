import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Calendar,
  ExternalLink,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Subscription {
  id: string;
  status: "active" | "canceled" | "past_due";
  current_period_end: string | null;
  created_at: string;
  creators: {
    id: string;
    handle: string;
    price_usd: number;
    profiles: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

export default function Subscriptions() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      fetchSubscriptions();
    }
  }, [user, authLoading]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        current_period_end,
        created_at,
        creators (
          id,
          handle,
          price_usd,
          profiles:user_id (
            display_name,
            avatar_url
          )
        )
      `)
      .eq("subscriber_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error);
    } else {
      setSubscriptions((data || []) as unknown as Subscription[]);
    }

    setLoading(false);
  };

  const handleCancel = async (subscriptionId: string) => {
    setCancelingId(subscriptionId);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { subscription_id: subscriptionId }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(data.message || "Subscription canceled");
      fetchSubscriptions(); // Refresh list
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel subscription");
    } finally {
      setCancelingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-secondary rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === "active");
  const inactiveSubscriptions = subscriptions.filter(s => s.status !== "active");

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-muted-foreground mb-8">
          Manage your creator subscriptions
        </p>

        {subscriptions.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-xl">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to creators to access their dump packs.
            </p>
            <Link to="/explore">
              <Button>Explore Creators</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4">Active ({activeSubscriptions.length})</h2>
                <div className="space-y-3">
                  {activeSubscriptions.map(sub => {
                    const displayName = sub.creators.profiles?.display_name || sub.creators.handle;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                      >
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/creator/${sub.creators.handle}`}
                              className="font-semibold hover:text-accent transition-colors"
                            >
                              {displayName}
                            </Link>
                            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${sub.creators.price_usd}/month
                            {sub.current_period_end && (
                              <> • Renews {new Date(sub.current_period_end).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/creator/${sub.creators.handle}`}>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCancel(sub.id)}
                            disabled={cancelingId === sub.id}
                          >
                            {cancelingId === sub.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Cancel"
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inactive Subscriptions */}
            {inactiveSubscriptions.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4 text-muted-foreground">
                  Past Subscriptions ({inactiveSubscriptions.length})
                </h2>
                <div className="space-y-3">
                  {inactiveSubscriptions.map(sub => {
                    const displayName = sub.creators.profiles?.display_name || sub.creators.handle;
                    return (
                      <div
                        key={sub.id}
                        className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card opacity-60"
                      >
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{displayName}</span>
                            <Badge variant="secondary">
                              {sub.status === "canceled" ? "Canceled" : "Past Due"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ended {sub.current_period_end 
                              ? new Date(sub.current_period_end).toLocaleDateString()
                              : "recently"}
                          </p>
                        </div>
                        <Link to={`/creator/${sub.creators.handle}`}>
                          <Button variant="outline" size="sm">
                            Resubscribe
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
