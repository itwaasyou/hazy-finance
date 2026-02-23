"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddTransactionForm } from "@/components/AddTransactionForm";

interface RecentTransactionsProps {
    className?: string;
}

export function RecentTransactions({ className }: RecentTransactionsProps) {
    const { transactions, members } = useTransactions();

    if (!transactions) return null;

    return (
        <Card className={cn("", className)}>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest financial moves</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                        <AddTransactionForm key={transaction.id} transactionToEdit={transaction}>
                            <div className="flex items-center justify-between group p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner transition-transform group-hover:scale-105",
                                            transaction.transactionType === "Buy" || transaction.transactionType === "Deposit"
                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10"
                                                : transaction.transactionType === "Sell" || transaction.transactionType === "Withdraw"
                                                    ? "border-rose-500/20 bg-rose-500/10 text-rose-400 shadow-rose-500/10"
                                                    : "border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-indigo-500/10"
                                        )}
                                    >
                                        {transaction.transactionType === "Buy" || transaction.transactionType === "Deposit" ? (
                                            <ArrowDownLeft className="h-5 w-5" />
                                        ) : transaction.transactionType === "Sell" || transaction.transactionType === "Withdraw" ? (
                                            <ArrowUpRight className="h-5 w-5" />
                                        ) : (
                                            <Repeat className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold leading-none text-foreground group-hover:text-primary transition-colors">
                                            {transaction.assetName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground font-mono">
                                                {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">{transaction.transactionType}</span>
                                            {transaction.memberId && transaction.memberId !== 'primary' && (
                                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                                                    {members.find(m => m.id === transaction.memberId)?.name || 'Member'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className={cn(
                                        "font-bold font-mono text-sm tracking-tight",
                                        "text-foreground"
                                    )}
                                >
                                    {formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        </AddTransactionForm>
                    ))}
                    {transactions.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8 italic opacity-60">No recent activity</div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
