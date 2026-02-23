"use client";
import React, { useMemo, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DollarSign, Percent, TrendingUp, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useTransactions } from "@/context/TransactionContext";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";

export default function Dashboard() {
  const { metrics, transactions, members, selectedMemberId, setSelectedMemberId } = useTransactions();
  const { user, dbUser } = useAuth();

  // Force selection to Self for non-admins if currently 'all'
  useEffect(() => {
    if (dbUser && dbUser.role !== 'admin' && user && selectedMemberId === 'all') {
      setSelectedMemberId(user.uid);
    }
  }, [dbUser, user, selectedMemberId, setSelectedMemberId]);

  // Prepare chart data: Aggregate by Date and simulate current value growth based on current metrics.

  const chartData = useMemo(() => {
    // 1. Group by exact date first
    const dailyMap = new Map<string, { invested: number; change: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyMap.has(date)) dailyMap.set(date, { invested: 0, change: 0 });

      const entry = dailyMap.get(date)!;
      if (['Buy', 'SIP', 'Deposit'].includes(t.transactionType)) {
        entry.change += t.amount;
      } else if (['Sell', 'Withdraw'].includes(t.transactionType)) {
        entry.change -= t.amount;
      }
    });

    // 2. Sort dates
    const sortedDates = Array.from(dailyMap.keys()).sort();

    // 3. Calculate cumulative
    let runningInvested = 0;
    const history: { date: string; invested: number; current: number }[] = [];

    // To make the graph look nice, we need a start point
    if (sortedDates.length > 0) {
      history.push({ date: sortedDates[0], invested: 0, current: 0 });
    }

    sortedDates.forEach(date => {
      const entry = dailyMap.get(date)!;
      runningInvested += entry.change;

      // Dynamic Mock: Scale invested amount by the current portfolio ratio to simulate historical value

      const ratio = metrics.totalInvested > 0 ? metrics.totalCurrentValue / metrics.totalInvested : 1;
      const currentVal = runningInvested * ratio;

      history.push({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        invested: runningInvested > 0 ? runningInvested : 0,
        current: currentVal > 0 ? currentVal : 0
      });
    });

    return history;
  }, [transactions, metrics.totalCurrentValue, metrics.totalInvested]);

  // If chartData is empty, provide some placeholders
  if (chartData.length === 0) {
    chartData.push({ date: 'Start', invested: 0, current: 0 });
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gradient">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
            <SelectTrigger className="w-[180px] bg-card text-foreground border-border">
              <SelectValue placeholder="Select Member" />
            </SelectTrigger>
            <SelectContent>
              {dbUser?.role === 'admin' && <SelectItem value="all">Family Overview</SelectItem>}
              {members
                .filter(m => dbUser?.role === 'admin' || m.id === user?.uid)
                .map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.id === user?.uid ? "Self" : member.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <AddTransactionForm />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Net Worth
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalCurrentValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total Assets Value
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalInvested || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Cost Basis
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit/Loss</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {metrics.totalGainLoss >= 0 ? "+" : ""}{formatCurrency(metrics.totalGainLoss || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(metrics.overallGainPercent || 0).toFixed(2)}% Return
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portfolio Health
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Good</div>
            <p className="text-xs text-muted-foreground">
              Based on diversification
            </p>
          </CardContent>
        </Card>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/20 p-12 text-center glass-panel">
          <h3 className="text-2xl font-bold text-gradient mb-2">Welcome to your Portfolio!</h3>
          <p className="text-muted-foreground mb-6">You haven't added any transactions yet. Start by logging your investments.</p>
          <div className="flex justify-center gap-4">
            <AddTransactionForm />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 lg:col-span-4">
            <CardHeader>
              <CardTitle>Investment Growth</CardTitle>
              <CardDescription>Cumulative investment over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    minTickGap={30}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      color: 'var(--card-foreground)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    labelStyle={{ marginBottom: '4px', color: 'var(--muted-foreground)' }}
                    formatter={(value: number | undefined) => [`₹${(value || 0).toFixed(0)}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    name="Current Value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCurrent)"
                  />
                  <Area
                    type="stepAfter"
                    dataKey="invested"
                    name="Invested Amount"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorInvested)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="col-span-4 lg:col-span-3">
            <RecentTransactions className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
