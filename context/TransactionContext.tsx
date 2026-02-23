"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, addDoc, deleteDoc, updateDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp, where, getDocs, collectionGroup } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

export type AssetType = 'Stock' | 'Mutual Fund' | 'Gold' | 'Cash' | 'ETF' | 'FD' | 'Other';
export type TransactionType = 'Buy' | 'Sell' | 'SIP' | 'Deposit' | 'Withdraw';

export type ExtendedTransactionType = TransactionType | 'Income' | 'Expense';

export type Platform = 'Groww' | 'Zerodha' | 'Bank' | 'Other' | 'Cash';

export interface Member {
    id: string;
    familyGroupId: string;
    name: string;
    relation: string; // 'Self', 'Spouse', 'Father', 'Mother', 'Child', etc.
    phone?: string;
    avatar?: string; // URL or color code
    color?: string; // For charts
    createdAt?: any;
}

export interface Asset {
    id: string; // assetId
    familyGroupId: string;
    assetType: AssetType;
    assetName: string;
    symbol?: string;
    createdAt?: any;
}

export interface Transaction {
    id: string; // transactionId
    familyGroupId: string;
    memberId: string; // FK
    assetId: string; // FK
    assetType: AssetType;
    assetName: string;
    transactionType: ExtendedTransactionType;
    date: string; // ISO date string YYYY-MM-DD
    quantity: number;
    price: number;
    amount: number;
    sipId?: string; // Nullable
    platform: Platform;
    category?: string;
    notes?: string;
    createdAt?: any;
}

export interface Holding {
    assetName: string;
    assetType: AssetType;
    quantity: number;
    totalInvested: number;
    avgPrice: number;
    currentPrice: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercent: number;
}

export interface SIPSummary {
    sipId: string;
    assetName: string;
    totalInvested: number;
    totalUnits: number;
    avgNav: number;
    latestNav: number;
    currentValue: number;
    gainLoss: number;
    gainPercent: number;
}

export interface SIPSchedule {
    id: string; // sipId
    familyGroupId: string;
    memberId: string;
    assetId: string;
    sipName: string;
    frequency: 'Monthly' | 'Weekly';
    dayOfMonth?: number;
    startDate: string;
    status: 'Active' | 'Paused' | 'Stopped';
    createdAt?: any;
}

export interface CategorySummary {
    category: string;
    amount: number;
    type: 'Income' | 'Expense';
}

interface DashboardMetrics {
    totalInvested: number;
    totalCurrentValue: number;
    totalGainLoss: number;
    overallGainPercent: number;
    assetAllocation: { name: string; value: number }[];
    totalIncome: number;
    totalExpenses: number;
    categoryBreakdown: CategorySummary[];
}

interface TransactionContextType {
    transactions: Transaction[]; // Filtered list
    allTransactions: Transaction[]; // Raw list
    members: Member[];
    selectedMemberId: string;
    setSelectedMemberId: (id: string) => void;
    holdings: Holding[];
    sipSummaries: SIPSummary[];
    sipSchedules: SIPSchedule[];
    metrics: DashboardMetrics;
    addTransaction: (transaction: any) => Promise<void>; // Looser type to handle asset creation logic
    deleteTransaction: (id: string) => Promise<void>;
    updateTransaction: (id: string, updated: Partial<Transaction>) => Promise<void>;
    updateCurrentPrice: (assetName: string, price: number) => Promise<void>;
    clearData: () => void;
    addSIPSchedule: (sip: Omit<SIPSchedule, "id" | "familyGroupId" | "createdAt">) => Promise<void>;
    deleteSIPSchedule: (id: string) => Promise<void>;
    addMember: (member: Omit<Member, "id" | "familyGroupId" | "createdAt">) => Promise<void>;
    updateMember: (id: string, updated: Partial<Member>) => Promise<void>;
    deleteMember: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const { user, dbUser } = useAuth();
    const familyGroupId = dbUser?.familyGroupId;

    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
    const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
    const [sipSchedules, setSipSchedules] = useState<SIPSchedule[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        if (!user || !familyGroupId) {
            setRawTransactions([]);
            setMembers([]);
            setSipSchedules([]);
            setManualPrices({});
            setAssets([]);
            return;
        }

        const userDocRef = doc(db, "users", user.uid);

        // Transactions Listener
        // Transactions Listener
        let qTx;
        if (dbUser?.role === 'admin') {
            // Admin sees all family transactions
            qTx = query(
                collectionGroup(db, "transactions"),
                where("familyGroupId", "==", familyGroupId),
                orderBy("date", "desc")
            );
        } else {
            // Member sees only their own
            qTx = query(
                collection(userDocRef, "transactions"),
                orderBy("date", "desc")
            );
        }

        const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
            const txs: Transaction[] = [];
            snapshot.forEach((doc) => txs.push({ id: doc.id, ...doc.data() } as Transaction));
            // Client-side sort if needed for collectionGroup cross-collection order consistency without specific composite index
            // But orderBy in query usually handles it.
            // Just ensuring robust sort:
            txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRawTransactions(txs);
        });

        // Members Listener
        // Members Listener - Fetch from Users collection
        const qMembers = query(collection(db, "users"), where("familyGroupId", "==", familyGroupId));
        const unsubscribeMembers = onSnapshot(qMembers, (snapshot) => {
            const mems: Member[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                mems.push({
                    id: doc.id,
                    familyGroupId: familyGroupId,
                    name: data.name,
                    relation: data.role === 'admin' ? 'Admin' : 'Member', // Map role to relation-like display
                    createdAt: data.joinedAt
                } as Member);
            });

            setMembers(mems);
        });

        // Price Updates Listener
        const qPrices = collection(userDocRef, "priceUpdates");
        const unsubscribePrices = onSnapshot(qPrices, (snapshot) => {
            const prices: Record<string, number> = {};
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.assetName && data.currentPrice) {
                    prices[data.assetName] = data.currentPrice;
                }
            });
            setManualPrices(prices);
        });

        // SIP Groups Listener
        const qSips = collection(userDocRef, "sipGroups");
        const unsubscribeSips = onSnapshot(qSips, (snapshot) => {
            const sips: SIPSchedule[] = [];
            snapshot.forEach((doc) => sips.push({ id: doc.id, ...doc.data() } as SIPSchedule));
            setSipSchedules(sips);
        });

        // Assets Listener
        const qAssets = collection(userDocRef, "assets");
        const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
            const assetList: Asset[] = [];
            snapshot.forEach((doc) => assetList.push({ id: doc.id, ...doc.data() } as Asset));
            setAssets(assetList);
        });

        return () => {
            unsubscribeTx();
            unsubscribeMembers();
            unsubscribePrices();
            unsubscribeSips();
            unsubscribeAssets();
        };
    }, [user, familyGroupId]);

    // Filter transactions based on selection
    const transactions = useMemo(() => {
        if (selectedMemberId === 'all') return rawTransactions;
        return rawTransactions.filter(t => t.memberId === selectedMemberId);
    }, [rawTransactions, selectedMemberId]);

    const updateCurrentPrice = async (assetName: string, price: number) => {
        if (!user || !familyGroupId) return;
        const userDocRef = doc(db, "users", user.uid);
        try {
            const q = query(
                collection(userDocRef, "priceUpdates"),
                where("assetName", "==", assetName)
            );
            const snaps = await getDocs(q);

            if (!snaps.empty) {
                const docId = snaps.docs[0].id;
                await updateDoc(doc(userDocRef, "priceUpdates", docId), { currentPrice: price, updatedAt: serverTimestamp() });
            } else {
                const asset = assets.find(a => a.assetName === assetName);
                await addDoc(collection(userDocRef, "priceUpdates"), {
                    familyGroupId,
                    assetId: asset?.id || "unknown",
                    assetName,
                    currentPrice: price,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (e) {
            console.error("Error updating price: ", e);
        }
    };

    const addTransaction = async (t: any) => {
        if (!user || !familyGroupId) return;

        let targetUserId = user.uid;
        if (dbUser?.role === 'admin') {
            targetUserId = (t.memberId && t.memberId !== 'primary') ? t.memberId : user.uid;
        }
        const targetUserDocRef = doc(db, "users", targetUserId);

        try {
            // Check if Asset exists in master list, if not create it
            let assetId = t.assetId;
            if (!assetId && t.assetName && t.assetType !== 'Cash') {
                const assetsRef = collection(targetUserDocRef, "assets");
                const q = query(assetsRef, where("assetName", "==", t.assetName), where("assetType", "==", t.assetType));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    assetId = querySnapshot.docs[0].id;
                } else {
                    // Create new Asset
                    const assetRef = await addDoc(assetsRef, {
                        familyGroupId,
                        assetType: t.assetType,
                        assetName: t.assetName,
                        createdAt: serverTimestamp()
                    });
                    assetId = assetRef.id;
                }
            }

            // Create Transaction
            await addDoc(collection(targetUserDocRef, "transactions"), {
                ...t,
                familyGroupId,
                memberId: targetUserId,
                assetId: assetId || "cash-asset",
                amount: t.quantity * t.price,
                createdAt: serverTimestamp()
            });

            // Update latest price for the asset
            if (['Buy', 'SIP'].includes(t.transactionType) && t.price > 0) {
                await updateCurrentPrice(t.assetName, t.price);
            }
        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!user) return;
        const tx = rawTransactions.find(t => t.id === id);
        if (!tx) return;

        if (dbUser?.role !== 'admin' && tx.memberId !== user.uid) return;

        try {
            await deleteDoc(doc(db, "users", tx.memberId, "transactions", id));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    };

    const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
        if (!user) return;
        const tx = rawTransactions.find(t => t.id === id);
        if (!tx) return;

        if (dbUser?.role !== 'admin' && tx.memberId !== user.uid) return;

        try {
            const txRef = doc(db, "users", tx.memberId, "transactions", id);
            const dataToUpdate: any = { ...updated };

            // Ensure memberId is valid UID if updated
            if (dataToUpdate.memberId === 'primary') {
                dataToUpdate.memberId = user.uid;
            }

            // Prevent non-admins from changing memberId ownership
            if (dbUser?.role !== 'admin') {
                delete dataToUpdate.memberId;
            }

            if (updated.quantity !== undefined && updated.price !== undefined) {
                dataToUpdate.amount = updated.quantity * updated.price;
            }
            await updateDoc(txRef, dataToUpdate);
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }

    const addSIPSchedule = async (sip: Omit<SIPSchedule, "id" | "familyGroupId" | "createdAt">) => {
        if (!user || !familyGroupId) return;
        try {
            await addDoc(collection(db, "users", user.uid, "sipGroups"), {
                ...sip,
                familyGroupId,
                status: 'Active',
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error adding SIP: ", e);
        }
    };

    const deleteSIPSchedule = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "sipGroups", id));
        } catch (e) {
            console.error("Error deleting SIP: ", e);
        }
    };

    const addMember = async (member: Omit<Member, "id" | "familyGroupId" | "createdAt">) => {
        if (!user || !familyGroupId) return;
        try {
            await addDoc(collection(db, "users", user.uid, "familyMembers"), {
                ...member,
                familyGroupId,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error adding Member: ", e);
        }
    };

    const updateMember = async (id: string, updated: Partial<Member>) => {
        if (!user) return;
        try {
            const ref = doc(db, "users", user.uid, "familyMembers", id);
            await updateDoc(ref, updated);
        } catch (e) {
            console.error("Error updating Member: ", e);
        }
    };

    const deleteMember = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "familyMembers", id));
        } catch (e) {
            console.error("Error deleting Member: ", e);
        }
    };

    const clearData = () => {
        console.warn("clearData is disabled in Firebase mode for safety.");
    };

    const holdings = useMemo(() => {
        const map = new Map<string, {
            quantity: number;
            invested: number;
            type: AssetType;
        }>();

        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sorted.forEach(t => {
            if (t.transactionType === 'Income' || t.transactionType === 'Expense') return;

            if (!map.has(t.assetName)) {
                map.set(t.assetName, { quantity: 0, invested: 0, type: t.assetType });
            }
            const h = map.get(t.assetName)!;

            if (t.transactionType === 'Buy' || t.transactionType === 'SIP' || t.transactionType === 'Deposit') {
                h.quantity += t.quantity;
                h.invested += t.amount;
            } else if (t.transactionType === 'Sell' || t.transactionType === 'Withdraw') {
                const avgPrice = h.quantity > 0 ? h.invested / h.quantity : 0;
                h.quantity -= t.quantity;
                h.invested -= (t.quantity * avgPrice);
            }
        });

        return Array.from(map.entries()).map(([name, data]) => {
            const currentPrice = manualPrices[name] || (data.quantity > 0 ? (data.invested / data.quantity) : 0);
            const currentValue = data.quantity * currentPrice;
            const gainLoss = currentValue - data.invested;
            const gainLossPercent = data.invested > 0 ? (gainLoss / data.invested) * 100 : 0;

            return {
                assetName: name,
                assetType: data.type,
                quantity: data.quantity,
                totalInvested: data.invested,
                avgPrice: data.quantity > 0 ? data.invested / data.quantity : 0,
                currentPrice,
                currentValue,
                gainLoss,
                gainLossPercent,
            };
        }).filter(h => h.quantity > 0.0001);
    }, [transactions, manualPrices]);

    const sipSummaries = useMemo(() => {
        const map = new Map<string, {
            assetName: string;
            invested: number;
            units: number;
            lastDate: string;
        }>();

        transactions.filter(t => t.transactionType === 'SIP').forEach(t => {
            const key = t.sipId || t.assetName;
            if (!map.has(key)) {
                map.set(key, { assetName: t.assetName, invested: 0, units: 0, lastDate: t.date });
            }
            const s = map.get(key)!;
            s.invested += t.amount;
            s.units += t.quantity;
            if (new Date(t.date) > new Date(s.lastDate)) {
                s.lastDate = t.date;
            }
        });

        return Array.from(map.entries()).map(([id, data]) => {
            const latestNav = manualPrices[data.assetName] || (data.units > 0 ? data.invested / data.units : 0);
            const currentValue = data.units * latestNav;
            const gainLoss = currentValue - data.invested;
            return {
                sipId: id,
                assetName: data.assetName,
                totalInvested: data.invested,
                totalUnits: data.units,
                avgNav: data.units > 0 ? data.invested / data.units : 0,
                latestNav,
                currentValue,
                gainLoss,
                gainPercent: data.invested > 0 ? (gainLoss / data.invested) * 100 : 0,
            };
        });
    }, [transactions, manualPrices]);

    const metrics = useMemo(() => {
        const totalInvested = holdings.reduce((acc, h) => acc + h.totalInvested, 0);
        const totalCurrentValue = holdings.reduce((acc, h) => acc + h.currentValue, 0);
        const totalGainLoss = totalCurrentValue - totalInvested;
        const overallGainPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        const allocationMap = new Map<string, number>();
        holdings.forEach(h => {
            const existing = allocationMap.get(h.assetType) || 0;
            allocationMap.set(h.assetType, existing + h.currentValue);
        });
        const assetAllocation = Array.from(allocationMap.entries()).map(([name, value]) => ({ name, value }));

        let totalIncome = 0;
        let totalExpenses = 0;
        const categoryMap = new Map<string, { amount: number, type: 'Income' | 'Expense' }>();

        transactions.forEach(t => {
            if (t.transactionType === 'Income') {
                totalIncome += t.amount;
                const cat = t.category || 'Other Income';
                const prev = categoryMap.get(cat) || { amount: 0, type: 'Income' };
                categoryMap.set(cat, { amount: prev.amount + t.amount, type: 'Income' });
            } else if (t.transactionType === 'Expense') {
                totalExpenses += t.amount;
                const cat = t.category || 'Other Expense';
                const prev = categoryMap.get(cat) || { amount: 0, type: 'Expense' };
                categoryMap.set(cat, { amount: prev.amount + t.amount, type: 'Expense' });
            }
        });

        const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            amount: data.amount,
            type: data.type
        }));

        return {
            totalInvested,
            totalCurrentValue,
            totalGainLoss,
            overallGainPercent,
            assetAllocation,
            totalIncome,
            totalExpenses,
            categoryBreakdown
        };
    }, [holdings, transactions]);


    return (
        <TransactionContext.Provider
            value={{
                transactions,
                allTransactions: rawTransactions,
                members,
                selectedMemberId,
                setSelectedMemberId,
                holdings,
                sipSummaries,
                sipSchedules,
                metrics,
                addTransaction,
                deleteTransaction,
                updateTransaction,
                updateCurrentPrice,
                clearData,
                addSIPSchedule,
                deleteSIPSchedule,
                addMember,
                updateMember,
                deleteMember
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error("useTransactions must be used within a TransactionProvider");
    }
    return context;
}
