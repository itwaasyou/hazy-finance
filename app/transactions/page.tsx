"use client";

import { useTransactions } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Trash2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { AddTransactionForm } from "@/components/AddTransactionForm";

export default function TransactionsPage() {
    const { transactions, deleteTransaction } = useTransactions();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 p-4 md:p-8 pt-6"
        >
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Transactions</h2>
            </div>

            <Card className="border-border">
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>
                        {transactions.length} total transactions recorded.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="w-[120px] text-foreground font-bold">Date</TableHead>
                                <TableHead className="text-foreground font-bold">Asset</TableHead>
                                <TableHead className="text-foreground font-bold">Type</TableHead>
                                <TableHead className="text-foreground font-bold">Platform</TableHead>
                                <TableHead className="text-right text-foreground font-bold">Quantity</TableHead>
                                <TableHead className="text-right text-foreground font-bold">Price</TableHead>
                                <TableHead className="text-right text-foreground font-bold">Amount</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((t) => (
                                <TableRow key={t.id} className="border-border hover:bg-muted/50 transition-colors group">
                                    <TableCell className="font-medium text-muted-foreground font-mono">{new Date(t.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{t.assetName}</span>
                                            <span className="text-xs text-muted-foreground">{t.assetType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`text-xs border px-2 py-0.5 rounded-full ${t.transactionType === 'Buy' || t.transactionType === 'SIP' || t.transactionType === 'Deposit'
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                                }`}
                                        >
                                            {t.transactionType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{t.platform}</TableCell>
                                    <TableCell className="text-right text-muted-foreground font-mono">{t.quantity}</TableCell>
                                    <TableCell className="text-right text-muted-foreground font-mono">{formatCurrency(t.price)}</TableCell>
                                    <TableCell className="text-right font-medium text-foreground font-mono">
                                        {formatCurrency(t.amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <AddTransactionForm transactionToEdit={t}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </AddTransactionForm>
                                            <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {transactions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                                <span className="text-2xl">📝</span>
                                            </div>
                                            <p>No transactions found.</p>
                                            <p className="text-sm">Log your first activity to see it here.</p>
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
