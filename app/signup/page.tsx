"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const { signUpWithEmail, updateUserProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Validation
        if (!name || !phone || !password || !confirmPassword) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        // Construct backend email
        const email = `${phone}@hazy.in`;

        try {
            await signUpWithEmail(email, password, inviteCode);
            // Update profile with name
            await updateUserProfile(name);
            // Redirect will be handled by AuthWrapper but we can push to confirm
            router.push("/");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Phone number is already registered.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password is too weak.");
            } else if (err.message === 'Invalid invite code') {
                setError("Invalid Invite Code. Please check or leave empty to start a new family.");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full" />

            <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-2xl border-white/5 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Create Account</h1>
                    <p className="text-muted-foreground text-sm">
                        Join Hazy Finance to manage family wealth.
                    </p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background/50 border-white/10"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-background/50 border-white/10"
                            required
                            pattern="[0-9]{10}"
                            title="Please enter a 10-digit phone number"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-background/50 border-white/10"
                            required
                        />
                        <p className="text-xs text-muted-foreground">At least 6 characters</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-background/50 border-white/10"
                            required
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <Label htmlFor="inviteCode" className="flex items-center gap-2">
                            Invite Code <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Input
                            id="inviteCode"
                            type="text"
                            placeholder="e.g. X7K9P2"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="bg-background/50 border-white/10 tracking-widest font-mono"
                            maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">Enter a code to join an existing family.</p>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-muted-foreground">Already have an account?</span>{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
