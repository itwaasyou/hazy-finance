"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, Calendar, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useState } from "react";
import { SIPSchedule } from "@/context/TransactionContext";
import { UpdatePriceDialog } from "@/components/UpdatePriceDialog";

// Helper to Quick Log a SIP
function QuickLogSIP({ schedule }: { schedule: SIPSchedule }) {
    const { addTransaction, holdings } = useTransactions();
    const [open, setOpen] = useState(false);
    const [nav, setNav] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Try to find existing asset type/platform defaults from holdings
    const existing = holdings.find(h => h.assetName === schedule.assetName);

    const handleLog = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(nav);
        if (!price) return;

        addTransaction({
            date,
            assetType: existing?.assetType || 'Mutual Fund',
            assetName: schedule.assetName,
            platform: 'Groww', // Default, maybe could infer or ask
            transactionType: 'SIP',
            quantity: schedule.amount / price,
            price: price,
            sipId: schedule.assetName + "-SIP", // Ensure grouping
            notes: "SIP Schedule Auto-log"
        });
        setOpen(false);
        setNav("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs bg-indigo-500/10 text-indigo-300 hover:text-white hover:bg-indigo-500"
                >
                    Pay
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel bg-slate-950 border-white/10 sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-white">Record SIP Payment</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Logging <strong>{formatCurrency(schedule.amount)}</strong> for {schedule.assetName}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLog} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="log-date" className="text-slate-300">Date</Label>
                        <Input
                            id="log-date"
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nav" className="text-slate-300">Current NAV / Price</Label>
                        <Input
                            id="nav"
                            type="number"
                            step="0.01"
                            value={nav}
                            onChange={e => setNav(e.target.value)}
                            placeholder="Enter NAV to calc units"
                            required
                            autoFocus
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                        Units: {nav ? (schedule.amount / parseFloat(nav)).toFixed(4) : "0.00"}
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        Confirm Payment
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function AddSIPScheduleForm() {
    const { addSIPSchedule, holdings } = useTransactions();
    const [open, setOpen] = useState(false);
    const [assetName, setAssetName] = useState("");
    const [amount, setAmount] = useState("");
    const [day, setDay] = useState("5");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const existingAssets = Array.from(new Set(holdings.map(h => h.assetName)));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addSIPSchedule({
            assetName: assetName.trim(), // Trim to match existing
            amount: parseFloat(amount),
            frequency: 'Monthly',
            dayOfMonth: parseInt(day),
            active: true,
            startDate
        });
        setAssetName("");
        setAmount("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-500/20">
                    <PlusCircle className="h-4 w-4" />
                    New SIP Schedule
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel bg-slate-950 text-slate-50 border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-gradient-primary text-2xl">Create SIP Schedule</DialogTitle>
                    <DialogDescription className="text-slate-400">Set up a recurring investment reminder.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <datalist id="sip-assets">
                        {existingAssets.map((asset) => (
                            <option key={asset} value={asset} />
                        ))}
                    </datalist>
                    <div className="space-y-2">
                        <Label htmlFor="asset" className="text-slate-300">Fund / Asset Name</Label>
                        <Input
                            id="asset"
                            value={assetName}
                            onChange={e => setAssetName(e.target.value)}
                            placeholder="e.g. SBI Small Cap Fund"
                            required
                            list="sip-assets"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-slate-300">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="day" className="text-slate-300">Monthly Day</Label>
                            <Input
                                id="day"
                                type="number"
                                min="1"
                                max="31"
                                value={day}
                                onChange={e => setDay(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="start" className="text-slate-300">Start Date</Label>
                        <Input
                            id="start"
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 text-white"
                        />
                    </div>
                    <div className="pt-4 flex justify-end">
                        <Button type="submit" className="bg-indigo-600 text-white">Save Schedule</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function SIPTrackerPage() {
    const { sipSummaries, sipSchedules, deleteSIPSchedule } = useTransactions();

    // Calculate upcoming SIPs
    const today = new Date();
    const upcoming = sipSchedules
        .filter(s => s.active)
        .map(s => {
            // Find next occurrence of "dayOfMonth"
            let nextDate = new Date(today.getFullYear(), today.getMonth(), s.dayOfMonth);
            if (nextDate < today) {
                nextDate = new Date(today.getFullYear(), today.getMonth() + 1, s.dayOfMonth);
            }
            return { ...s, nextDate };
        })
        .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 p-4 md:p-8 pt-6"
        >
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-gradient">SIP Tracker</h2>
                    <p className="text-muted-foreground mt-1">Manage your systematic investments.</p>
                </div>
                <AddSIPScheduleForm />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:border-indigo-500/30 transition-colors glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Invested (SIP)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-white">{formatCurrency(sipSummaries.reduce((acc, s) => acc + s.totalInvested, 0))}</div>
                    </CardContent>
                </Card>
                <Card className="hover:border-indigo-500/30 transition-colors glass-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Current Monthly Commitment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-white">
                            {formatCurrency(sipSchedules.reduce((acc, s) => s.active ? acc + s.amount : acc, 0))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Upcoming Schedule */}
                <Card className="md:col-span-5 glass-card border-white/5">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-indigo-400" />
                            <CardTitle>Upcoming SIPs</CardTitle>
                        </div>
                        <CardDescription>Next due payments based on your schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {upcoming.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/20">
                                            <span className="text-xs uppercase">{s.nextDate.toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-lg leading-none">{s.nextDate.getDate()}</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">{s.assetName}</div>
                                            <div className="text-xs text-muted-foreground">Monthly</div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <div className="font-bold text-white">{formatCurrency(s.amount)}</div>
                                        <div className="flex gap-2">
                                            {/* Quick Log Button */}
                                            <QuickLogSIP schedule={s} />

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                                onClick={() => deleteSIPSchedule(s.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {upcoming.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground italic">
                                    No active schedules found.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Active Portfolios from History */}
                <Card className="md:col-span-7 border-white/5 glass-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            <CardTitle>Portfolio Performance</CardTitle>
                        </div>
                        <CardDescription>
                            Consolidated view of your Systematic Investment Plans.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-white font-bold">Asset</TableHead>
                                    <TableHead className="text-right text-white font-bold">Invested</TableHead>
                                    <TableHead className="text-right text-white font-bold">NAV</TableHead>
                                    <TableHead className="text-right text-white font-bold">Value</TableHead>
                                    <TableHead className="text-right text-white font-bold">Returns</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sipSummaries.map((s) => (
                                    <TableRow key={s.sipId} className="border-white/5 hover:bg-white/5 transition-colors group">
                                        <TableCell className="font-semibold text-white">
                                            {s.assetName}
                                            <div className="text-xs text-muted-foreground font-normal">{s.totalUnits.toFixed(4)} Units</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-white">{formatCurrency(s.totalInvested)}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            <div className="flex items-center justify-end gap-2">
                                                {formatCurrency(s.latestNav)}
                                                <UpdatePriceDialog assetName={s.assetName} currentPrice={s.latestNav} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-white font-semibold">{formatCurrency(s.currentValue)}</TableCell>
                                        <TableCell className={`text-right font-bold font-mono ${s.gainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                            {s.gainLoss >= 0 ? "+" : ""}{formatCurrency(s.gainLoss)}
                                            <div className={`text-xs font-normal opacity-70 ${s.gainLoss >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                                                {s.gainPercent.toFixed(2)}%
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {sipSummaries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                            No SIP history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </motion.div >
    );
}
