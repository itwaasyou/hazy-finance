"use client";

import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { PlusCircle, Trash2, Users, UserPlus, Copy, Check, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function MembersPage() {
    const { members, addMember, deleteMember } = useTransactions();
    const { user, dbUser, createInvite, joinFamily, createFamily, deleteFamily, deleteInvite } = useAuth();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isCreateFamilyOpen, setIsCreateFamilyOpen] = useState(false);
    const [isJoinOpen, setIsJoinOpen] = useState(false);
    const [isDeleteFamilyOpen, setIsDeleteFamilyOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState("");
    const [copied, setCopied] = useState(false);
    const [newMemberName, setNewMemberName] = useState("");
    const [newMemberRelation, setNewMemberRelation] = useState("Progeny");
    const inviteTimerRef = useRef<NodeJS.Timeout | null>(null);
    const inviteCodeRef = useRef("");

    // Keep ref in sync with state for cleanup
    useEffect(() => {
        inviteCodeRef.current = inviteCode;
    }, [inviteCode]);

    // Cleanup on unmount or tab close
    useEffect(() => {
        const handleUnload = () => {
            if (inviteCodeRef.current) deleteInvite(inviteCodeRef.current);
        };
        window.addEventListener("beforeunload", handleUnload);
        return () => {
            window.removeEventListener("beforeunload", handleUnload);
            handleUnload();
        };
    }, []);

    const relations = ["Self", "Spouse", "Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Other"];

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName) return;

        // Generate a random color for charts
        const colors = ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#f43f5e"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        addMember({
            name: newMemberName,
            relation: newMemberRelation,
            color: randomColor,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${newMemberName}`
        });

        setNewMemberName("");
        setNewMemberRelation("Progeny");
        setIsAddOpen(false);
    };

    const handleCreateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const familyName = (form.elements.namedItem('familyName') as HTMLInputElement).value;

        try {
            await createFamily(familyName);
            toast.success("Family created successfully!");
            setIsCreateFamilyOpen(false);
            window.location.reload();
        } catch (e) {
            toast.error("Failed to create family");
        }
    };

    const handleGenerateInvite = async () => {
        try {
            if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
            const code = await createInvite();
            setInviteCode(code);
            setIsInviteOpen(true);

            // Auto delete after 1 minute
            inviteTimerRef.current = setTimeout(() => {
                deleteInvite(code);
                if (isInviteOpen) setIsInviteOpen(false);
            }, 60000);
        } catch (e) {
            toast.error("Failed to generate invite");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        toast.success("Invite code copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDeleteFamily = async () => {
        try {
            await deleteFamily();
            toast.success("Family deleted successfully");
            setIsDeleteFamilyOpen(false);
            window.location.reload();
        } catch (e) {
            toast.error("Failed to delete family");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 space-y-8 p-4 md:p-8 pt-6"
        >
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-gradient">Family Members</h2>
                <div className="flex items-center space-x-2">
                    {dbUser?.role === 'admin' && (
                        <Dialog open={isDeleteFamilyOpen} onOpenChange={setIsDeleteFamilyOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 mr-2">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-red-500 flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5" />
                                        Delete Family?
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400">
                                        Are you sure you want to delete this family group? This action cannot be undone and will remove all members from the group.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => setIsDeleteFamilyOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={handleDeleteFamily}>Delete Family</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={isInviteOpen} onOpenChange={(open) => {
                        setIsInviteOpen(open);
                        if (!open && inviteCode) {
                            if (inviteTimerRef.current) clearTimeout(inviteTimerRef.current);
                            deleteInvite(inviteCode);
                            setInviteCode("");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={handleGenerateInvite} className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
                                <UserPlus className="mr-2 h-4 w-4" /> Invite User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Invite Family Member</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Share this code with your family member to let them join this portfolio.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center p-6 space-y-4">
                                <div className="text-4xl font-mono font-bold tracking-widest text-white bg-white/10 px-6 py-3 rounded-lg border border-white/20">
                                    {inviteCode}
                                </div>
                                <Button onClick={copyToClipboard} variant="secondary" className="w-full">
                                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copied ? "Copied" : "Copy Code"}
                                </Button>
                                <p className="text-xs text-slate-500 text-center">
                                    This code is valid for one-time use or until revoked.
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Add Family Member</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Add a new family member to track their portfolio.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddMember} className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="text-slate-300">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. John Doe"
                                        value={newMemberName}
                                        onChange={(e) => setNewMemberName(e.target.value)}
                                        className="bg-white/5 border-white/10 text-slate-200 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all duration-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="relation" className="text-slate-300">Relation</Label>
                                    <Select value={newMemberRelation} onValueChange={setNewMemberRelation}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 w-full">
                                            <SelectValue placeholder="Select relation" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950 border-white/10 text-slate-200">
                                            {relations.map((rel) => (
                                                <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        Add Member
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                    <Card key={member.id} className="glass-card hover:bg-white/5 transition-all duration-300 group">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold text-xl shadow-lg">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-foreground">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.relation}</p>
                                </div>
                            </div>
                            {dbUser?.role === 'admin' && member.id !== user?.uid && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteMember(member.id)}
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {members.length === 0 && (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Dialog open={isCreateFamilyOpen} onOpenChange={setIsCreateFamilyOpen}>
                            <DialogTrigger asChild>
                                <Card className="glass-card border-dashed border-2 flex flex-col items-center justify-center p-8 text-muted-foreground opacity-70 hover:opacity-100 hover:border-indigo-500/50 transition-all cursor-pointer h-[200px]">
                                    <Users className="h-12 w-12 mb-4 text-indigo-400" />
                                    <h3 className="text-xl font-bold text-foreground">Create Family</h3>
                                    <p className="text-sm text-center">Start a new family portfolio.</p>
                                    <Button variant="link" className="mt-2 text-indigo-400">Get Started <UserPlus className="ml-2 h-4 w-4" /></Button>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                                <DialogHeader>
                                    <DialogTitle>Create New Family</DialogTitle>
                                    <DialogDescription>Give your family portfolio a name.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateFamily} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="familyName">Family Name</Label>
                                        <Input id="familyName" name="familyName" placeholder="e.g. The Smiths" required className="bg-white/5 border-white/10 text-slate-200" />
                                    </div>
                                    <Button type="submit">Create Family</Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
                            <DialogTrigger asChild>
                                <Card className="glass-card border-dashed border-2 flex flex-col items-center justify-center p-8 text-muted-foreground opacity-70 hover:opacity-100 hover:border-purple-500/50 transition-all cursor-pointer h-[200px]">
                                    <UserPlus className="h-12 w-12 mb-4 text-purple-400" />
                                    <h3 className="text-xl font-bold text-foreground">Join Family</h3>
                                    <p className="text-sm text-center">Have an invite code? Join an existing family.</p>
                                    <Button variant="link" className="mt-2 text-purple-400">Enter Code <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                </Card>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                                <DialogHeader>
                                    <DialogTitle>Join Family</DialogTitle>
                                    <DialogDescription>Enter the 6-character invite code shared with you.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const code = (form.elements.namedItem('joinCode') as HTMLInputElement).value;
                                    try {
                                        await joinFamily(code);
                                        toast.success("Joined family successfully!");
                                        setIsJoinOpen(false);
                                        window.location.reload(); // Refresh to load new family data
                                    } catch (err) {
                                        toast.error("Invalid invite code");
                                    }
                                }} className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="joinCode">Invite Code</Label>
                                        <Input id="joinCode" name="joinCode" placeholder="X7K9P2" className="tracking-widest font-mono uppercase" maxLength={6} required />
                                    </div>
                                    <Button type="submit">Join Family</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
