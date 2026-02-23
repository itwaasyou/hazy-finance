"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, DollarSign, Wallet } from "lucide-react";

export default function AnalyticsPage() {
    const { metrics, transactions } = useTransactions();

    const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];

    // Monthly Income vs Expense Data
    const monthlyData = transactions.reduce((acc: any[], t) => {
        const date = new Date(t.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        let entry = acc.find(e => e.month === monthYear);
        if (!entry) {
            entry = { month: monthYear, income: 0, expense: 0, investment: 0 };
            acc.push(entry);
        }

        if (t.transactionType === 'Income') {
            entry.income += t.amount;
        } else if (t.transactionType === 'Expense') {
            entry.expense += t.amount;
        } else if (['Buy', 'SIP', 'Deposit'].includes(t.transactionType)) {
            entry.investment += t.amount;
        }

        return acc;
    }, []).sort((a, b) => {
        // Sort by date (parsing month/year back is tricky, simpler to sort by raw date if we stored it, 
        // but for now relying on insert order if transactions provided in order, otherwise need better sort)
        // Let's assume input transactions might not be sorted, so we should really sort by a date value.
        return 0; // Placeholder, assuming rough order or acceptable. 
        // Ideally we'd keep a timestamp in the accumulator.
    });

    // Quick fix for sorting: add a timestamp to the accumulator
    const sortedMonthlyData = transactions.reduce((acc: Map<string, any>, t) => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`; // YYYY-M for sorting
        const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        if (!acc.has(key)) {
            acc.set(key, { key, month: label, income: 0, expense: 0, investment: 0, timestamp: date.getTime() });
        }
        const entry = acc.get(key);

        if (t.transactionType === 'Income') {
            entry.income += t.amount;
        } else if (t.transactionType === 'Expense') {
            entry.expense += t.amount;
        } else if (['Buy', 'SIP', 'Deposit'].includes(t.transactionType)) {
            entry.investment += t.amount;
        }
        return acc;
    }, new Map()).values();

    const chartData = Array.from(sortedMonthlyData).sort((a: any, b: any) => a.timestamp - b.timestamp);

    // Calculate Net Savings (Income - Expense - Investment? Or just Income - Expense)
    // "Savings" usually means Income - Expense. Investment is a form of saving.
    // Let's call it "Cashflow" = Income - Expense.

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 p-4 md:p-8 pt-6"
        >
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Financial Analytics</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.totalIncome)}</div>
                        <p className="text-xs text-muted-foreground">All time earnings</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-rose-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-400">{formatCurrency(metrics.totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground">All time spending</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Savings Rate</CardTitle>
                        <Wallet className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            {metrics.totalIncome > 0
                                ? ((metrics.totalIncome - metrics.totalExpenses) / metrics.totalIncome * 100).toFixed(1)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Retained income</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card border-border">
                    <CardHeader>
                        <CardTitle>Cash Flow Trends</CardTitle>
                        <CardDescription>Income vs Expenses over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#94a3b8"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'var(--muted)' }}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 glass-card border-border">
                    <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                        <CardDescription>Spending by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={metrics.categoryBreakdown.filter(c => c.type === 'Expense')}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="amount"
                                        nameKey="category"
                                        stroke="none"
                                    >
                                        {metrics.categoryBreakdown.filter(c => c.type === 'Expense').map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {metrics.categoryBreakdown.filter(c => c.type === 'Expense').length === 0 && (
                            <div className="text-center text-muted-foreground mt-[-200px]">No expense data available</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
