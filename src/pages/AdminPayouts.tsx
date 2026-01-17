import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Payout {
  id: string;
  amount: number;
  payout_method: string;
  payout_details: { email?: string } | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  notes: string | null;
  creator_id: string;
  creators?: {
    handle: string;
    user_id: string;
    profiles?: {
      display_name: string | null;
      email: string;
    } | null;
  } | null;
}

export default function AdminPayouts() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  
  // Process dialog state
  const [processingPayout, setProcessingPayout] = useState<Payout | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    pendingAmount: 0,
    processingCount: 0,
    completedThisMonth: 0,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!profile?.is_admin) {
        toast.error("Admin access required");
        navigate("/");
      } else {
        fetchPayouts();
      }
    }
  }, [profile, authLoading]);

  const fetchPayouts = async () => {
    setLoading(true);

    try {
      // Build query based on filter
      let query = supabase
        .from("creator_payouts")
        .select(`
          *,
          creators:creator_id(
            handle,
            user_id,
            profiles:user_id(display_name, email)
          )
        `)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPayouts((data || []) as Payout[]);

      // Calculate stats
      const allPayouts = data || [];
      const pending = allPayouts.filter(p => p.status === "pending");
      const processing = allPayouts.filter(p => p.status === "processing");
      
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedThisMonth = allPayouts.filter(p => 
        p.status === "completed" && 
        p.processed_at && 
        new Date(p.processed_at) >= monthStart
      );

      setStats({
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + Number(p.amount), 0),
        processingCount: processing.length,
        completedThisMonth: completedThisMonth.reduce((sum, p) => sum + Number(p.amount), 0),
      });

    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const openProcessDialog = (payout: Payout) => {
    setProcessingPayout(payout);
    setNewStatus(payout.status === "pending" ? "processing" : "completed");
    setNotes(payout.notes || "");
  };

  const handleUpdatePayout = async () => {
    if (!processingPayout) return;
    setSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        notes: notes || null,
      };

      if (newStatus === "completed" || newStatus === "failed") {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("creator_payouts")
        .update(updateData)
        .eq("id", processingPayout.id);

      if (error) throw error;

      toast.success(`Payout marked as ${newStatus}`);
      setProcessingPayout(null);
      fetchPayouts();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Failed to update payout");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Processing</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
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
              <h1 className="text-3xl font-bold">Payout Management</h1>
              <p className="text-muted-foreground">Process creator withdrawal requests</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchPayouts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
              <p className="text-sm text-muted-foreground">${stats.pendingAmount.toFixed(2)} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing
              </CardTitle>
              <Loader2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processingCount}</div>
              <p className="text-sm text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid This Month
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${stats.completedThisMonth.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Completed payouts</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Fee (25%)
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25%</div>
              <p className="text-sm text-muted-foreground">Current rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-4">
          <Label>Filter:</Label>
          <Select value={filter} onValueChange={(v) => { setFilter(v); }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={fetchPayouts}>
            Apply
          </Button>
        </div>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Review and process creator withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No {filter !== "all" ? filter : ""} payouts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Payout To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">@{payout.creators?.handle || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {payout.creators?.profiles?.display_name || payout.creators?.profiles?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Number(payout.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payout.payout_method.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payout.payout_details?.email || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openProcessDialog(payout)}
                          disabled={payout.status === "completed" || payout.status === "failed"}
                        >
                          Process
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Process Dialog */}
        <Dialog open={!!processingPayout} onOpenChange={() => setProcessingPayout(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payout</DialogTitle>
              <DialogDescription>
                Update the status of this payout request
              </DialogDescription>
            </DialogHeader>
            
            {processingPayout && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator:</span>
                    <span className="font-medium">@{processingPayout.creators?.handle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-lg">${Number(processingPayout.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="capitalize">{processingPayout.payout_method.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pay to:</span>
                    <span>{processingPayout.payout_details?.email || "-"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Transaction ID, reason for failure, etc."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setProcessingPayout(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePayout} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : newStatus === "completed" ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : newStatus === "failed" ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : null}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}