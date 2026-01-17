import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  ArrowUpRight,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Earning {
  id: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at: string;
  subscriber_id: string;
}

interface Payout {
  id: string;
  amount: number;
  payout_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  notes: string | null;
}

interface Subscriber {
  id: string;
  subscriber_id: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

const PLATFORM_FEE_PERCENT = 25;
const MINIMUM_PAYOUT = 50;

export default function Earnings() {
  const { user, creator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Payout dialog state
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<string>("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingPayouts: 0,
    totalPaidOut: 0,
    totalPlatformFees: 0,
    activeSubscribers: 0,
  });

  useEffect(() => {
    if (!authLoading && !creator) {
      toast.error("You need to be a creator to access earnings");
      navigate("/settings");
    } else if (creator) {
      fetchData();
    }
  }, [creator, authLoading]);

  const fetchData = async () => {
    if (!creator) return;
    setLoading(true);

    try {
      // Fetch earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from("creator_earnings")
        .select("id, gross_amount, platform_fee, net_amount, status, created_at, subscriber_id")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });

      if (earningsError) throw earningsError;

      // Fetch payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from("creator_payouts")
        .select("*")
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });

      if (payoutsError) throw payoutsError;

      // Fetch subscribers
      const { data: subscribersData, error: subscribersError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          subscriber_id,
          status,
          created_at,
          current_period_end,
          profiles:subscriber_id(display_name, email)
        `)
        .eq("creator_id", creator.id)
        .order("created_at", { ascending: false });

      if (subscribersError) throw subscribersError;

      setEarnings((earningsData || []) as Earning[]);
      setPayouts((payoutsData || []) as Payout[]);
      setSubscribers((subscribersData || []) as Subscriber[]);

      // Calculate stats
      const totalEarnings = earningsData?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;
      const availableBalance = earningsData?.filter(e => e.status === "available").reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;
      const pendingPayouts = payoutsData?.filter(p => p.status === "pending" || p.status === "processing").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPaidOut = payoutsData?.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPlatformFees = earningsData?.reduce((sum, e) => sum + Number(e.platform_fee), 0) || 0;
      const activeSubscribers = subscribersData?.filter(s => s.status === "active").length || 0;

      setStats({
        totalEarnings,
        availableBalance,
        pendingPayouts,
        totalPaidOut,
        totalPlatformFees,
        activeSubscribers,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    
    if (!amount || amount < MINIMUM_PAYOUT) {
      toast.error(`Minimum payout amount is $${MINIMUM_PAYOUT}`);
      return;
    }

    if (amount > stats.availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    if (!payoutMethod) {
      toast.error("Please select a payout method");
      return;
    }

    if ((payoutMethod === "paypal" || payoutMethod === "bank_transfer") && !payoutEmail) {
      toast.error("Please enter your payout email/account");
      return;
    }

    setRequesting(true);

    try {
      const { data, error } = await supabase.functions.invoke("request-payout", {
        body: {
          amount,
          payout_method: payoutMethod,
          payout_details: { email: payoutEmail },
        },
      });

      if (error) throw error;

      toast.success(data.message || "Payout request submitted!");
      setShowPayoutDialog(false);
      setPayoutAmount("");
      setPayoutMethod("");
      setPayoutEmail("");
      fetchData();
    } catch (error) {
      console.error("Payout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">Available</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Processing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "paid_out":
        return <Badge variant="outline">Paid Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Earnings</h1>
            <p className="text-muted-foreground">Track your revenue and request payouts</p>
          </div>
          <Button 
            onClick={() => setShowPayoutDialog(true)}
            disabled={stats.availableBalance < MINIMUM_PAYOUT}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${stats.availableBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earned
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">After platform fees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscribers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscribers}</div>
              <p className="text-xs text-muted-foreground mt-1">Paying monthly</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.pendingPayouts.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Being processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Fee Info */}
        <Card className="mb-8 border-accent/50 bg-accent/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Platform Fee: {PLATFORM_FEE_PERCENT}%</p>
              <p className="text-sm text-muted-foreground">
                Dump takes a {PLATFORM_FEE_PERCENT}% fee from each subscription payment to cover hosting, payment processing, and platform development. 
                Your total platform fees to date: <span className="font-medium">${stats.totalPlatformFees.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="payouts">Payout History</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All payments received from subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Earnings will appear here when subscribers pay</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Subscriber</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Fee ({PLATFORM_FEE_PERCENT}%)</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {earnings.map((earning) => (
                        <TableRow key={earning.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(earning.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            Subscriber
                          </TableCell>
                          <TableCell className="text-right">${Number(earning.gross_amount).toFixed(2)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">-${Number(earning.platform_fee).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${Number(earning.net_amount).toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(earning.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>Your Subscribers</CardTitle>
                <CardDescription>People subscribed to your content</CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No subscribers yet</p>
                    <p className="text-sm">Share your profile to get subscribers</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subscriber</TableHead>
                        <TableHead>Subscribed On</TableHead>
                        <TableHead>Next Renewal</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            {sub.profiles?.display_name || sub.profiles?.email || "Unknown"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.current_period_end 
                              ? new Date(sub.current_period_end).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {sub.status === "active" ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                            ) : sub.status === "past_due" ? (
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Past Due</Badge>
                            ) : (
                              <Badge variant="outline">Canceled</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your withdrawal requests and status</CardDescription>
              </CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No payouts yet</p>
                    <p className="text-sm">Request a payout when you have ${MINIMUM_PAYOUT}+ available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell className="text-muted-foreground">
                            {new Date(payout.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">${Number(payout.amount).toFixed(2)}</TableCell>
                          <TableCell className="capitalize">{payout.payout_method.replace("_", " ")}</TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {payout.processed_at 
                              ? new Date(payout.processed_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payout Dialog */}
        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Withdraw your available balance. Minimum payout is ${MINIMUM_PAYOUT}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-green-500">${stats.availableBalance.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label>Amount to Withdraw</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder={MINIMUM_PAYOUT.toString()}
                    className="pl-7"
                    min={MINIMUM_PAYOUT}
                    max={stats.availableBalance}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPayoutAmount(Math.min(50, stats.availableBalance).toString())}
                  >
                    $50
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPayoutAmount(Math.min(100, stats.availableBalance).toString())}
                  >
                    $100
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPayoutAmount(stats.availableBalance.toString())}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="stripe_connect" disabled>Stripe Connect (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(payoutMethod === "paypal" || payoutMethod === "bank_transfer") && (
                <div className="space-y-2">
                  <Label>
                    {payoutMethod === "paypal" ? "PayPal Email" : "Bank Account Email"}
                  </Label>
                  <Input
                    type="email"
                    value={payoutEmail}
                    onChange={(e) => setPayoutEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleRequestPayout} disabled={requesting}>
                {requesting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                )}
                Request ${payoutAmount || "0"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}