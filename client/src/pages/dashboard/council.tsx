import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend 
} from "recharts";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Clock, TrendingUp, RefreshCw, Eye } from "lucide-react";

export default function Council() {
  const queryClient = useQueryClient();
  const [grantAmount, setGrantAmount] = useState<Record<string, number>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["council", "metrics"],
    queryFn: async () => {
      const res = await fetch("/api/council/metrics", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        }
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You must be an admin to view this page");
        }
        throw new Error("Failed to fetch council metrics");
      }
      return res.json();
    }
  });

  const { data: kpis } = useQuery({
    queryKey: ["council", "kpis"],
    queryFn: async () => {
      const res = await fetch("/api/council/kpis", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        }
      });
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      return res.json();
    }
  });

  // Calculate KPI values
  const ttfv = kpis?.avgTtfv ? `${(kpis.avgTtfv / 1000).toFixed(1)}s` : "N/A";
  const approvalMedian = kpis?.medianApprovalTime ? `${(kpis.medianApprovalTime / 3600).toFixed(1)}h` : "N/A";
  const reworkRate = kpis?.reworkRate ? `${(kpis.reworkRate * 100).toFixed(1)}%` : "N/A";
  const shareToView = kpis?.shareToViewRate ? `${(kpis.shareToViewRate * 100).toFixed(1)}%` : "N/A";

  const promoteMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "user" }) => {
      const res = await fetch(`/api/council/users/${id}/role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["council"] });
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const grantCoinsMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const res = await fetch(`/api/council/wallets/${id}/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error("Failed to grant coins");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["council"] });
      setGrantAmount({});
      toast({
        title: "Coins Granted",
        description: "Coins have been granted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to grant coins",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-gray-400">
        <div className="animate-pulse">Loading Council Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-500 bg-red-500/10">
          <div className="p-6 text-red-400">
            {(error as Error).message}
          </div>
        </Card>
      </div>
    );
  }

  const { totals, users, security, analytics, spend } = data || {};

  // Format chart data
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d");
    } catch {
      return dateStr;
    }
  };

  const securityData = (security || []).map((row: any) => ({
    ...row,
    day: formatDate(row.day),
    auth_failures: parseInt(row.auth_failures) || 0,
    rate_limited: parseInt(row.rate_limited) || 0,
  }));

  const analyticsData = (analytics || []).map((row: any) => ({
    ...row,
    day: formatDate(row.day),
    approvals: parseInt(row.approvals) || 0,
    uploads: parseInt(row.uploads) || 0,
    mockups: parseInt(row.mockups) || 0,
  }));

  const spendData = (spend || []).map((row: any) => ({
    ...row,
    day: formatDate(row.day),
    coins_spent: parseInt(row.coins_spent) || 0,
    coins_granted: parseInt(row.coins_granted) || 0,
  }));

  const kpiData = (kpis?.kpis || []).map((row: any) => ({
    ...row,
    day: formatDate(row.day),
    ttfv_hours: parseFloat(row.ttfv_hours) || 0,
    approval_median_hours: parseFloat(row.approval_median_hours) || 0,
    rework_rate: parseFloat(row.rework_rate) || 0,
  }));

  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-6">Council Dashboard</h1>
      
      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 mb-2">Total Users</p>
          <p className="text-3xl font-bold text-white">{totals?.users || 0}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 mb-2">Coins in Circulation</p>
          <p className="text-3xl font-bold text-yellow-400">{totals?.coins_in_circulation || 0}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 mb-2">Approvals (30d)</p>
          <p className="text-3xl font-bold text-green-400">{totals?.approvals_30d || 0}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 mb-2">Uploads (30d)</p>
          <p className="text-3xl font-bold text-blue-400">{totals?.uploads_30d || 0}</p>
        </GlassCard>
      </div>

      {/* UX KPIs */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">UX Performance (Last 30 Days)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard variant="gradient" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">TTFV</p>
            </div>
            <p className="text-2xl font-bold text-white">{ttfv}</p>
            <p className="text-xs text-gray-400 mt-1">Time to First View</p>
          </GlassCard>
          
          <GlassCard variant="gradient" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Approval Time</p>
            </div>
            <p className="text-2xl font-bold text-white">{approvalMedian}</p>
            <p className="text-xs text-gray-400 mt-1">Median (hours)</p>
          </GlassCard>
          
          <GlassCard variant="gradient" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Rework Rate</p>
            </div>
            <p className="text-2xl font-bold text-white">{reworkRate}</p>
            <p className="text-xs text-gray-400 mt-1">Changes requested</p>
          </GlassCard>
          
          <GlassCard variant="gradient" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-purple-500" />
              <p className="text-sm text-muted-foreground">Share→View</p>
            </div>
            <p className="text-2xl font-bold text-white">{shareToView}</p>
            <p className="text-xs text-gray-400 mt-1">Conversion rate</p>
          </GlassCard>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Security (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={securityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="day" 
                  stroke="#888"
                  style={{ fontSize: 12 }}
                />
                <YAxis stroke="#888" style={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "#1a1a1a", 
                    border: "1px solid #333",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="auth_failures" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Auth Failures"
                />
                <Line 
                  type="monotone" 
                  dataKey="rate_limited" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Rate Limited"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Activity Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="day" 
                  stroke="#888"
                  style={{ fontSize: 12 }}
                />
                <YAxis stroke="#888" style={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "#1a1a1a", 
                    border: "1px solid #333",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Bar dataKey="approvals" fill="#10b981" stackId="a" name="Approvals" />
                <Bar dataKey="uploads" fill="#3b82f6" stackId="a" name="Uploads" />
                <Bar dataKey="mockups" fill="#8b5cf6" stackId="a" name="Mockups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Coins Chart */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Coins (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="day" 
                  stroke="#888"
                  style={{ fontSize: 12 }}
                />
                <YAxis stroke="#888" style={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    background: "#1a1a1a", 
                    border: "1px solid #333",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="coins_spent" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Spent"
                />
                <Line 
                  type="monotone" 
                  dataKey="coins_granted" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Granted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* KPIs Chart */}
        {kpiData.length > 0 && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">UX KPIs (Last 30 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="day" 
                    stroke="#888"
                    style={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#888" style={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1a1a1a", 
                      border: "1px solid #333",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ttfv_hours" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Time to First Value (h)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approval_median_hours" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Approval Time (h)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Users Table */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Coins</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-2 text-white">{user.name}</td>
                  <td className="py-3 px-2 text-gray-300">{user.email}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.empress_role === "admin" 
                        ? "bg-purple-500/20 text-purple-300" 
                        : "bg-gray-500/20 text-gray-300"
                    }`}>
                      {user.empress_role || "user"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-yellow-400">{user.coins_balance ?? 0}</td>
                  <td className="py-3 px-2 text-gray-400">
                    {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "-"}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-2 items-center">
                      {user.empress_role === "admin" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => promoteMutation.mutate({ id: user.id, role: "user" })}
                          disabled={promoteMutation.isPending}
                          data-testid={`button-demote-${user.id}`}
                        >
                          Demote
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => promoteMutation.mutate({ id: user.id, role: "admin" })}
                          disabled={promoteMutation.isPending}
                          data-testid={`button-promote-${user.id}`}
                        >
                          Promote
                        </Button>
                      )}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="Amount"
                          className="w-20 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded"
                          value={grantAmount[user.id] || ""}
                          onChange={(e) => setGrantAmount({ 
                            ...grantAmount, 
                            [user.id]: parseInt(e.target.value) 
                          })}
                          data-testid={`input-grant-amount-${user.id}`}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => {
                            const amount = grantAmount[user.id];
                            if (amount > 0) {
                              grantCoinsMutation.mutate({ id: user.id, amount });
                            }
                          }}
                          disabled={
                            grantCoinsMutation.isPending || 
                            !grantAmount[user.id] || 
                            grantAmount[user.id] <= 0
                          }
                          data-testid={`button-grant-coins-${user.id}`}
                        >
                          Grant
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}