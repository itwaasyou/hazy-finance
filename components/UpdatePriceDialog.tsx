"use client";

import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Activity } from "lucide-react";

interface UpdatePriceProps {
    assetName: string;
    currentPrice: number;
}

export function UpdatePriceDialog({ assetName, currentPrice }: UpdatePriceProps) {
    const { updateCurrentPrice } = useTransactions();
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState(currentPrice.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateCurrentPrice(assetName, parseFloat(price));
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10 rounded-full">
                    <Activity className="h-3 w-3 text-indigo-400" />
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel bg-slate-950 text-slate-50 border-white/10 sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-white">Update Market Price</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Set the latest NAV/Price for <span className="text-indigo-300 font-semibold">{assetName}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="price" className="text-slate-300">Current Price (₹)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            required
                            autoFocus
                            className="bg-white/5 border-white/10 text-white text-lg font-mono"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        Update Price
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
