"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import { useTransactions } from "@/context/TransactionContext";

export default function SettingsPage() {
    const { user, updateUserProfile } = useAuth();
    const { allTransactions } = useTransactions();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.displayName) {
            setName(user.displayName);
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateUserProfile(name);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (!allTransactions || allTransactions.length === 0) {
            toast.error("No transactions to export");
            return;
        }

        const headers = ["Date", "Type", "Asset Name", "Asset Type", "Quantity", "Price", "Amount", "Platform", "Category", "Notes"];
        const csvContent = [
            headers.join(","),
            ...allTransactions.map(t => [
                t.date,
                t.transactionType,
                `"${(t.assetName || "").replace(/"/g, '""')}"`,
                t.assetType,
                t.quantity,
                t.price,
                t.amount,
                t.platform,
                t.category || "",
                `"${(t.notes || "").replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `hazy_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-gradient">Settings</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-2 glass-card border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-200">Profile</CardTitle>
                        <CardDescription className="text-slate-400">Manage your public profile settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300" htmlFor="name">Display Name</label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/5 border-white/10 text-slate-200 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300" htmlFor="email">Email</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@example.com"
                                value={user?.email || ""}
                                disabled
                                className="bg-white/5 border-white/10 text-slate-400 opacity-50 cursor-not-allowed"
                            />
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>

                <Card className="col-span-2 glass-card border-white/10">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-200">Data Management</CardTitle>
                        <CardDescription className="text-slate-400">Export your transaction history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={handleExportCSV} className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" /> Export to CSV
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
