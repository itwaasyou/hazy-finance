"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

import Link from "next/link";

export default function LoginPage() {
    const { signInWithEmail } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Phone/Password State
    // Phone/Password State
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const handlePhoneAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!phone || !password) {
            setError("Please enter both phone and password.");
            setLoading(false);
            return;
        }

        // Construct backend email
        const email = `${phone}@hazy.in`;

        try {
            await signInWithEmail(email, password);
            // Redirect handled by AuthWrapper
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid phone number or password.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Phone number is already in use. Please sign in.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Authentication failed. Please try again.");
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

            <div className="w-full max-w-md space-y-8 glass-panel p-8 rounded-2xl border-white/5 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gradient mb-2">Hazy Finance</h1>
                    <p className="text-muted-foreground text-sm">
                        Your Family's Wealth, Simplified.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/5 text-center">
                        <p className="text-sm text-slate-300">
                            Track investments, SIPs, and Net Worth in one place.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handlePhoneAuth} className="space-y-4">
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
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account?</span>{" "}
                        <Link href="/signup" className="text-primary hover:underline font-medium">
                            Sign Up
                        </Link>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground mt-4">
                        By continuing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
}
