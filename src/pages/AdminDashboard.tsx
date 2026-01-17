import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  DollarSign, 
  Users,
  Music,
  TrendingUp,
  Clock,
  CreditCard,
  ArrowRight,
  RefreshCw,
  UserCheck,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlatformStats {
  totalRevenue: number;
  platformFees: number;
  activeSubscriptions: number;
  totalCreators: number;
  totalPacks: number;
  totalSubscribers: number;
  pendingPayouts: number;
  pendingPayoutAmount: number;
}

interface RecentActivity {
  id: string;
  type: "subscription" | "payout" | "pack";
  description: string;
  amount?: number;
  created_at: string;
}

export default function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<PlatformStats>({
    totalRevenue: 0,
    platformFees: 0,
    activeSubscriptions: 0,
    totalCreators: 0,
    totalPacks: 0,
    totalSubscribers: 0,
    pendingPayouts: 0,
    pendingPayoutAmount: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!profile?.is_admin) {
        toast.error("Admin access required");
        navigate("/");
      } else {
        fetchStats();
      }
    }
  }, [profile, authLoading]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        earningsResult,
        subscriptionsResult,
        creatorsResult,
        packsResult,
        subscribersResult,
        payoutsResult,
        recentSubsResult,
        recentPayoutsResult,
      ] = await Promise.all([
        // Total earnings
        supabase.from("creator_earnings").select("gross_amount, platform_fee, net_amount"),
        // Active subscriptions count
        supabase.from("subscriptions").select("id", { count: "exact" }).eq("status", "active"),
        // Total creators count
        supabase.from("creators").select("id", { count: "exact" }).eq("is_active", true),
        // Total packs count
        supabase.from("dump_packs").select("id", { count: "exact" }).eq("is_deleted", false),
        // Unique subscribers
        supabase.from("subscriptions").select("subscriber_id"),
        // Pending payouts
        supabase.from("creator_payouts").select("amount").eq("status", "pending"),
        // Recent subscriptions
        supabase
          .from("subscriptions")
          .select(`
            id, created_at, status,
            creators:creator_id(handle),
            profiles:subscriber_id(display_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5),
        // Recent payouts
        supabase
          .from("creator_payouts")
          .select(`
            id, amount, status, created_at,
            creators:creator_id(handle)
          `)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Calculate earnings stats
      const earnings = earningsResult.data || [];
      const totalRevenue = earnings.reduce((sum, e) => sum + Number(e.gross_amount), 0);
      const platformFees = earnings.reduce((sum, e) => sum + Number(e.platform_fee), 0);

      // Get unique subscribers
      const uniqueSubscribers = new Set(
        (subscribersResult.data || []).map(s => s.subscriber_id)
      ).size;

      // Pending payouts
      const pendingPayouts = payoutsResult.data || [];
      const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalRevenue,
        platformFees,
        activeSubscriptions: subscriptionsResult.count || 0,
        totalCreators: creatorsResult.count || 0,
        totalPacks: packsResult.count || 0,
        totalSubscribers: uniqueSubscribers,
        pendingPayouts: pendingPayouts.length,
        pendingPayoutAmount: pendingAmount,
      });

      // Build recent activity
      const activity: RecentActivity[] = [];
      
      (recentSubsResult.data || []).forEach((sub: { 
        id: string; 
        created_at: string; 
        status: string;
        creators: { handle: string } | null;
        profiles: { display_name: string | null } | null;
      }) => {
        activity.push({
          id: sub.id,
          type: "subscription",
          description: `${sub.profiles?.display_name || "Someone"} subscribed to @${sub.creators?.handle || "Unknown"}`,
          created_at: sub.created_at,
        });
      });

      (recentPayoutsResult.data || []).forEach((payout: {
        id: string;
        amount: number;
        status: string;
        created_at: string;
        creators: { handle: string } | null;
      }) => {
        activity.push({
          id: payout.id,
          type: "payout",
          description: `@${payout.creators?.handle || "Creator"} requested payout`,
          amount: Number(payout.amount),
          created_at: payout.created_at,
        });
      });

      // Sort by date
      activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(activity.slice(0, 10));

    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Platform overview and statistics</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">All time gross</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Fees (25%)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${stats.platformFees.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
              <p className="text-sm text-muted-foreground">
                ${stats.pendingPayoutAmount.toFixed(2)} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Creators
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreators}</div>
              <p className="text-sm text-muted-foreground">Active creators</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
              <p className="text-sm text-muted-foreground">Unique subscribers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Content Packs
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPacks}</div>
              <p className="text-sm text-muted-foreground">Published packs</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to="/admin/payouts">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Process Payouts
                  </span>
                  <Badge variant="secondary">{stats.pendingPayouts}</Badge>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to="/explore">
                  <Music className="h-4 w-4 mr-2" />
                  Browse Creators
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={`${activity.type}-${activity.id}`}>
                        <TableCell className="max-w-[200px] truncate">
                          {activity.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={activity.type === "subscription" ? "default" : "secondary"}>
                            {activity.type === "subscription" ? (
                              <CreditCard className="h-3 w-3 mr-1" />
                            ) : (
                              <DollarSign className="h-3 w-3 mr-1" />
                            )}
                            {activity.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {activity.amount ? `$${activity.amount.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
