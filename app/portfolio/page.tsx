"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { motion } from "framer-motion";

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b'];

import { UpdatePriceDialog } from "@/components/UpdatePriceDialog";

import { FundDetailsDialog } from "@/components/FundDetailsDialog";

export default function PortfolioPage() {
    const { holdings, metrics } = useTransactions();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 p-4 md:p-8 pt-6"
        >
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Portfolio Holdings</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Asset Allocation Chart */}
                <Card className="col-span-1 overflow-hidden">
                    <CardHeader>
                        <CardTitle>Asset Allocation</CardTitle>
                        <CardDescription>Distribution by asset class</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.assetAllocation}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {metrics.assetAllocation.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-lg" />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    formatter={(value: any) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        color: '#f8fafc',
                                        borderRadius: '12px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Portfolio Summary Card */}
                <Card className="col-span-1 flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle>Performance Summary</CardTitle>
                        <CardDescription>Overview of your investment returns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Total Invested</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight text-white">{formatCurrency(metrics.totalInvested)}</div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Current Value</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight text-indigo-400 drop-shadow-md">{formatCurrency(metrics.totalCurrentValue)}</div>
                        </div>

                        <div className={`p-4 rounded-xl border ${metrics.totalGainLoss >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
                            <div className="flex justify-between items-center mb-1">
                                <span className={`${metrics.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"} text-sm uppercase tracking-wider font-semibold`}>Total Profit/Loss</span>
                            </div>
                            <div className={`text-3xl font-bold tracking-tight ${metrics.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {metrics.totalGainLoss >= 0 ? "+" : ""}{formatCurrency(metrics.totalGainLoss)}
                                <span className="text-lg ml-3 opacity-80 font-medium">({metrics.overallGainPercent.toFixed(2)}%)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-white/5">
                <CardHeader>
                    <CardTitle>Holdings</CardTitle>
                    <CardDescription>
                        Current positions across all assets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="text-white font-bold">Asset</TableHead>
                                <TableHead className="text-white font-bold">Type</TableHead>
                                <TableHead className="text-right text-white font-bold">Qty</TableHead>
                                <TableHead className="text-right text-white font-bold">Avg Price</TableHead>
                                <TableHead className="text-right text-white font-bold">Invested</TableHead>
                                <TableHead className="text-right text-white font-bold">Current Price</TableHead>
                                <TableHead className="text-right text-white font-bold">Current Value</TableHead>
                                <TableHead className="text-right text-white font-bold">P&L</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {holdings.map((h, i) => (
                                <TableRow key={h.assetName} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-semibold text-white group-hover:text-indigo-400 transition-colors cursor-pointer">
                                        <FundDetailsDialog assetName={h.assetName}>
                                            <div className="w-full h-full">
                                                {h.assetName}
                                            </div>
                                        </FundDetailsDialog>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-xs">{h.assetType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">{h.quantity.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(h.avgPrice)}</TableCell>
                                    <TableCell className="text-right font-mono text-white">{formatCurrency(h.totalInvested)}</TableCell>
                                    <TableCell className="text-right text-muted-foreground font-mono">
                                        <div className="flex items-center justify-end gap-2">
                                            {formatCurrency(h.currentPrice)}
                                            <UpdatePriceDialog assetName={h.assetName} currentPrice={h.currentPrice} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold font-mono text-white">{formatCurrency(h.currentValue)}</TableCell>
                                    <TableCell className={`text-right font-bold font-mono ${h.gainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {h.gainLoss >= 0 ? "+" : ""}{formatCurrency(h.gainLoss)}
                                        <div className={`text-xs font-normal opacity-70 ${h.gainLoss >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                            {h.gainLossPercent.toFixed(2)}%
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {holdings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                                <span className="text-2xl">🌱</span>
                                            </div>
                                            <p>No active holdings found.</p>
                                            <p className="text-sm">Start your investment journey by adding a 'Buy' transaction.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </motion.div>
    );
}
