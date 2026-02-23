"use client";

import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { PlusCircle } from "lucide-react";
import { AssetType, Platform, ExtendedTransactionType } from "@/context/TransactionContext";

const ASSET_TYPES: AssetType[] = ["Stock", "Mutual Fund", "Gold", "Other"];
const PLATFORMS: Platform[] = ["Zerodha", "Groww", "Bank", "Other", "Cash"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Dividend", "Interest", "Rental", "Business", "Gift", "Other"];
const EXPENSE_CATEGORIES = ["Rent", "Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Travel", "Education", "Other"];

import { Transaction } from "@/context/TransactionContext";

interface AddTransactionFormProps {
    transactionToEdit?: Transaction;
    children?: React.ReactNode;
}

export function AddTransactionForm({ transactionToEdit, children }: AddTransactionFormProps) {
    const { addTransaction, updateTransaction, holdings, members, selectedMemberId } = useTransactions();
    const { user, dbUser } = useAuth();
    const [open, setOpen] = useState(false);

    // Get unique existing asset names for suggestions
    const existingAssets = Array.from(new Set(holdings.map(h => h.assetName)));

    // Form State
    const [date, setDate] = useState(transactionToEdit?.date || new Date().toISOString().split('T')[0]);
    const [transactionType, setTransactionType] = useState<ExtendedTransactionType>(transactionToEdit?.transactionType || "Buy");
    const [assetType, setAssetType] = useState<AssetType>(transactionToEdit?.assetType || "Stock");
    const [assetName, setAssetName] = useState(transactionToEdit?.assetName || "");
    const [category, setCategory] = useState(transactionToEdit?.category || "");
    const [platform, setPlatform] = useState<Platform>(transactionToEdit?.platform || "Zerodha");
    const [quantity, setQuantity] = useState(transactionToEdit?.quantity.toString() || "");
    const [price, setPrice] = useState(transactionToEdit?.price.toString() || "");
    const [sipId, setSipId] = useState(transactionToEdit?.sipId || "");
    const [notes, setNotes] = useState(transactionToEdit?.notes || "");

    // State for toggle
    const [useExisting, setUseExisting] = useState(false);

    // Member State
    const [memberId, setMemberId] = useState(transactionToEdit?.memberId || (selectedMemberId !== 'all' ? selectedMemberId : user?.uid || ''));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!price) return; // Basic validation

        // For Income/Expense, quantity is 1 if not specified
        const qty = quantity ? parseFloat(quantity) : 1;
        const amt = parseFloat(price);

        // Base data common to all transactions
        const baseData = {
            date,
            assetType: (transactionType === 'Income' || transactionType === 'Expense') ? 'Cash' as AssetType : assetType,
            assetName: (assetName || (transactionType === 'Income' ? 'Income' : 'Expense')).trim(),
            platform: (transactionType === 'Income' || transactionType === 'Expense') ? 'Cash' as Platform : platform,
            transactionType,
            quantity: qty,
            price: amt,
            notes,
            memberId,
        };

        // Conditionally add optional fields
        const finalData: any = { ...baseData };

        if (transactionType === 'Income' || transactionType === 'Expense') {
            if (category) finalData.category = category;
        }

        if (transactionType === "SIP") {
            const finalSipId = sipId || (assetName.trim() + "-SIP");
            if (finalSipId) finalData.sipId = finalSipId;
        }

        if (transactionToEdit) {
            updateTransaction(transactionToEdit.id, finalData);
        } else {
            addTransaction(finalData);
        }

        // Reset
        if (!useExisting && !transactionToEdit) setAssetName(""); // Keep asset name if using existing? No, reset all.
        else if (transactionToEdit) {
            // No reset needed on edit submit, usually close dialog
        }
        else setAssetName("");

        if (!transactionToEdit) {
            setCategory("");
            setQuantity("");
            setPrice("");
            setSipId("");
            setNotes("");
        }
        setOpen(false);
    };

    const isInvestment = ['Buy', 'Sell', 'SIP', 'Deposit', 'Withdraw'].includes(transactionType);

    // Filter assets by type if selected? For now show all unique names
    // Maybe improved: When user selects "Existing", filtered by Asset Type if Asset Type is selected? 
    // Or auto-set Asset Type when Asset Name is picked?
    // Let's do: Pick Asset Name -> Auto set Asset Type & Platform from holding?
    const handleExistingSelect = (name: string) => {
        setAssetName(name);
        const holding = holdings.find(h => h.assetName === name);
        if (holding) {
            setAssetType(holding.assetType);
            // Platform is not on holding currently (holding aggregates), but we could guess or leave as is.
            // holdings in context does not store platform.
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg border-none transition-all hover:scale-105 active:scale-95">
                        <PlusCircle className="h-4 w-4" />
                        Add New
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto shadow-lg sm:rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground text-2xl font-bold">
                        {transactionToEdit ? "Edit Transaction" : (isInvestment ? "Log Investment" : `Log ${transactionType}`)}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isInvestment ? "Record your portfolio moves." : "Track your cash flow."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-5 py-4">
                    {/* Datalist for Autocomplete */}
                    <datalist id="existing-assets">
                        {existingAssets.map((asset) => (
                            <option key={asset} value={asset} />
                        ))}
                    </datalist>

                    {/* Member Selection */}
                    {dbUser?.role === 'admin' && (
                        <div className="space-y-2">
                            <Label htmlFor="member" className="text-foreground">Family Member</Label>
                            <Select onValueChange={setMemberId} value={memberId}>
                                <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                    <SelectValue placeholder="Select Member" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.id === user?.uid ? "Self" : m.name} ({m.relation})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Top Row: Date & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-foreground">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="bg-background border-input text-foreground focus:ring-ring"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transactionType" className="text-foreground">Type</Label>
                            <Select onValueChange={(val: ExtendedTransactionType) => setTransactionType(val)} defaultValue={transactionType}>
                                <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    <SelectItem value="Buy">Buy Asset</SelectItem>
                                    <SelectItem value="Sell">Sell Asset</SelectItem>
                                    <SelectItem value="SIP">SIP Installment</SelectItem>
                                    <SelectItem value="Income">Income / Earnings</SelectItem>
                                    <SelectItem value="Expense">Expense / Spending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Conditional Fields based on Type */}
                    {isInvestment ? (
                        <>
                            {!transactionToEdit && (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="useExisting"
                                        checked={useExisting}
                                        onChange={(e) => setUseExisting(e.target.checked)}
                                        className="accent-primary h-4 w-4"
                                    />
                                    <Label htmlFor="useExisting" className="text-muted-foreground cursor-pointer select-none">Select from Existing Portfolio</Label>
                                </div>
                            )}

                            {/* Asset Name Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="assetName" className="text-foreground">Asset Name</Label>
                                {useExisting && existingAssets.length > 0 ? (
                                    <Select onValueChange={handleExistingSelect} value={assetName}>
                                        <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                            <SelectValue placeholder="Select Asset" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground max-h-[200px]">
                                            {existingAssets.map(a => (
                                                <SelectItem key={a} value={a}>{a}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="assetName"
                                        value={assetName}
                                        onChange={(e) => setAssetName(e.target.value)}
                                        placeholder="e.g. HDFC Bank, SBI Nifty 50"
                                        required
                                        list="existing-assets"
                                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="assetType" className="text-foreground">Asset Class</Label>
                                    <Select onValueChange={(val: AssetType) => setAssetType(val)} value={assetType}>
                                        <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="platform" className="text-foreground">Platform</Label>
                                    <Select onValueChange={(val: Platform) => setPlatform(val)} defaultValue={platform}>
                                        <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className="text-foreground">Quantity (Units)</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        step="0.0001"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-foreground">Price / NAV (₹)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        required
                                        className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Income / Expense Fields */
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-foreground">Category</Label>
                                <Select onValueChange={setCategory} value={category}>
                                    <SelectTrigger className="bg-background border-input text-foreground focus:ring-ring">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground max-h-[200px]">
                                        {(transactionType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-foreground">Description</Label>
                                <Input
                                    id="description"
                                    value={assetName}
                                    onChange={(e) => setAssetName(e.target.value)}
                                    placeholder={transactionType === 'Income' ? "e.g. Feb Salary" : "e.g. Grocery Shopping"}
                                    required
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-foreground">Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring text-lg font-semibold"
                                />
                            </div>
                        </>
                    )}

                    {transactionType === 'SIP' && (
                        <div className="space-y-2">
                            <Label htmlFor="sipId" className="text-foreground">SIP ID (Optional)</Label>
                            <Input
                                id="sipId"
                                value={sipId}
                                onChange={(e) => setSipId(e.target.value)}
                                placeholder="Auto-generated if empty"
                                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-foreground">Notes (Optional)</Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Remarks..."
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-ring"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-border mt-2">
                        <div className="text-sm text-muted-foreground self-center mr-auto font-mono">
                            {isInvestment ? `Total: ₹${(parseFloat(quantity || "0") * parseFloat(price || "0")).toFixed(2)}` : ""}
                        </div>
                        <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted text-muted-foreground">Cancel</Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {transactionToEdit ? "Update" : "Confirm"} {transactionType}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
