"use client";

import { useTransactions, Transaction } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowDownLeft, ArrowUpRight, History, TrendingUp, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddTransactionForm } from "@/components/AddTransactionForm";

interface FundDetailsDialogProps {
    assetName: string;
    children: React.ReactNode;
}

export function FundDetailsDialog({ assetName, children }: FundDetailsDialogProps) {
    const { holdings, transactions, members } = useTransactions();
    const [open, setOpen] = useState(false);

    const holding = holdings.find(h => h.assetName === assetName);
    const assetTransactions = transactions
        .filter(t => t.assetName === assetName)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!holding && assetTransactions.length === 0) {
        return <>{children}</>;
    }

    const totalBuy = assetTransactions.filter(t => ['Buy', 'SIP', 'Deposit'].includes(t.transactionType)).reduce((acc, t) => acc + t.amount, 0);
    const totalSell = assetTransactions.filter(t => ['Sell', 'Withdraw'].includes(t.transactionType)).reduce((acc, t) => acc + t.amount, 0);

    // Simple realized P&L approximation (Total Sell - Cost of Sold goods) is hard without FIFO/LIFO props.
    // For now, let's just show Total Bought vs Total Sold in history summary.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className="cursor-pointer hover:opacity-80 transition-opacity">
                {children}
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground border-border max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-lg shadow-lg border">
                <div className="p-6 border-b border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {assetName}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Performance and transaction history.
                        </DialogDescription>
                    </DialogHeader>

                    {holding && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <Card className="bg-muted/40 border-border shadow-none">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Current Value</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(holding.currentValue)}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/40 border-border shadow-none">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Invested</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(holding.totalInvested)}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/40 border-border shadow-none">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Returns</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className={`text-lg font-bold ${holding.gainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                        {holding.gainLoss >= 0 ? "+" : ""}{formatCurrency(holding.gainLoss)}
                                    </div>
                                    <div className={`text-xs ${holding.gainLoss >= 0 ? "text-emerald-500/70" : "text-rose-500/70"}`}>
                                        {holding.gainLossPercent.toFixed(2)}%
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-muted/40 border-border shadow-none">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg NAV / Price</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="text-lg font-bold text-foreground">{formatCurrency(holding.avgPrice)}</div>
                                    <div className="text-xs text-muted-foreground">Cur: {formatCurrency(holding.currentPrice)}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
                    <div className="p-4 pb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <History className="h-4 w-4" />
                        Transaction History
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 pt-0">
                            <Table>
                                <TableHeader className="bg-card sticky top-0 z-10 border-b">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-foreground">Date</TableHead>
                                        <TableHead className="text-foreground">Type</TableHead>
                                        <TableHead className="text-foreground">Member</TableHead>
                                        <TableHead className="text-right text-foreground">Price</TableHead>
                                        <TableHead className="text-right text-foreground">Qty</TableHead>
                                        <TableHead className="text-right text-foreground">Amount</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assetTransactions.map((t) => (
                                        <TableRow key={t.id} className="border-border hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-mono text-muted-foreground text-xs">{t.date}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`
                                            ${['Buy', 'SIP', 'Deposit'].includes(t.transactionType)
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"}
                                        `}>
                                                    {t.transactionType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                                {t.memberId === 'primary' ? 'Self' : members.find(m => m.id === t.memberId)?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(t.price)}</TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{t.quantity.toFixed(4)}</TableCell>
                                            <TableCell className="text-right font-mono font-medium text-foreground">
                                                {formatCurrency(t.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <AddTransactionForm transactionToEdit={t}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AddTransactionForm>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent >
        </Dialog >
    );
}
