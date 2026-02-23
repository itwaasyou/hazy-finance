"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    UserCredential,
    updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

export interface DBUser {
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
    familyGroupId: string;
    createdAt: any;
}

interface AuthContextType {
    user: User | null;
    dbUser: DBUser | null;
    loading: boolean;
    signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
    signUpWithEmail: (email: string, pass: string, inviteCode?: string) => Promise<UserCredential>;
    updateUserProfile: (name: string, photoURL?: string) => Promise<void>;
    createInvite: () => Promise<string>;
    joinFamily: (code: string) => Promise<void>;
    deleteInvite: (code: string) => Promise<void>;
    createFamily: (familyName: string) => Promise<void>;
    deleteFamily: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<DBUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Fetch User Details from Firestore
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setDbUser(userSnap.data() as DBUser);
                } else {
                    // Create basic User doc initially without family
                    const newDbUser: DBUser = {
                        uid: user.uid,
                        email: user.email || "",
                        name: user.displayName || "",
                        role: 'member',
                        familyGroupId: "", // Pending
                        createdAt: serverTimestamp()
                    };

                    await setDoc(userRef, newDbUser);
                    setDbUser(newDbUser);
                }
            } else {
                setDbUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            return await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            console.error("Error signing in with Email", error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string, inviteCode?: string) => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, pass);
            if (inviteCode) {
                await joinFamily(inviteCode);
            }
            return credential;
        } catch (error) {
            console.error("Error signing up with Email", error);
            throw error;
        }
    };

    const createInvite = async (): Promise<string> => {
        if (!dbUser || !dbUser.familyGroupId) throw new Error("No family group");
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        try {
            await setDoc(doc(db, "invites", code), {
                familyGroupId: dbUser.familyGroupId,
                createdBy: dbUser.uid,
                createdAt: serverTimestamp(),
                status: 'active'
            });
            return code;
        } catch (e) {
            console.error("Error creating invite", e);
            throw e;
        }
    };

    const deleteInvite = async (code: string) => {
        try {
            await deleteDoc(doc(db, "invites", code));
        } catch (e) {
            console.error("Error deleting invite", e);
        }
    };

    const joinFamily = async (code: string) => {
        if (!auth.currentUser) return;
        try {
            const inviteRef = doc(db, "invites", code);
            const inviteSnap = await getDoc(inviteRef);

            if (!inviteSnap.exists()) {
                throw new Error("Invalid invite code");
            }

            const { familyGroupId } = inviteSnap.data();

            // Update User
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                uid: auth.currentUser.uid,
                email: auth.currentUser.email || "",
                name: auth.currentUser.displayName || "",
                role: 'member',
                familyGroupId,
                joinedAt: serverTimestamp()
            }, { merge: true });

            // Force refresh dbUser
            const updatedSnap = await getDoc(userRef);
            setDbUser(updatedSnap.data() as DBUser);

            // Optional: Create member entry in familyMembers if not exists? 
            // TransactionContext handles manual member add, but here the USER is the member.
            // We should probably add them to 'familyMembers' collection too so they show up in the list.
            await addDoc(collection(db, "users", auth.currentUser.uid, "familyMembers"), {
                familyGroupId,
                name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "New Member",
                relation: "Member", // Default
                createdAt: serverTimestamp()
            });

        } catch (e) {
            console.error("Error joining family", e);
            throw e;
        }


    };

    const createFamily = async (familyName: string) => {
        if (!auth.currentUser) return;
        try {
            // 1. Create Family Group
            const groupRef = await addDoc(collection(db, "familyGroups"), {
                familyName: familyName,
                createdBy: auth.currentUser.uid,
                createdAt: serverTimestamp()
            });

            // 2. Update User with new familyGroupId
            const userRef = doc(db, "users", auth.currentUser.uid);
            await setDoc(userRef, {
                familyGroupId: groupRef.id,
                role: 'admin', // Creator becomes admin
                joinedAt: serverTimestamp()
            }, { merge: true });

            // 3. Create "Self" member entry for consistency
            await addDoc(collection(db, "users", auth.currentUser.uid, "familyMembers"), {
                familyGroupId: groupRef.id,
                name: auth.currentUser.displayName || "Me",
                relation: "Self",
                createdAt: serverTimestamp()
            });

            // 4. Update local state
            const snap = await getDoc(userRef);
            setDbUser(snap.data() as DBUser);

        } catch (e) {
            console.error("Error creating family", e);
            throw e;
        }
    };

    const deleteFamily = async () => {
        if (!auth.currentUser || !dbUser?.familyGroupId || dbUser.role !== 'admin') return;
        try {
            // Delete Family Group
            await deleteDoc(doc(db, "familyGroups", dbUser.familyGroupId));

            // Update User to remove familyGroupId and reset role
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
                familyGroupId: "",
                role: 'member'
            });

            // Force refresh dbUser will happen via onAuthStateChanged or we can manually set it if needed, 
            // but onSnapshot/listeners in other contexts will react to the doc change.
            // We update local state just in case.
            const snap = await getDoc(userRef);
            setDbUser(snap.data() as DBUser);
        } catch (e) {
            console.error("Error deleting family", e);
            throw e;
        }
    };

    const updateUserProfile = async (name: string, photoURL?: string) => {
        if (auth.currentUser) {
            try {
                await updateProfile(auth.currentUser, {
                    displayName: name,
                    photoURL: photoURL
                });
                // Force update user state if needed, though onAuthStateChanged might handle it or we wait for next reload
                // Just to be safe for local UI display:
                setUser({ ...auth.currentUser, displayName: name, photoURL: photoURL || null });
            } catch (error) {
                console.error("Error updating profile", error);
                throw error;
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, dbUser, loading, signInWithEmail, signUpWithEmail, updateUserProfile, createInvite, joinFamily, deleteInvite, createFamily, deleteFamily, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
