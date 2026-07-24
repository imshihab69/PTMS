"use client";

import { useState, useEffect, useCallback } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { RevokedScreen } from "@/components/RevokedScreen";
import { Dashboard } from "@/components/Dashboard";

export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  active: boolean;
};

export default function Home() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoked, setRevoked] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.status === 403 && data.revoked) {
        setRevoked(true);
        setUser(null);
      } else if (res.ok && data.user) {
        setUser(data.user);
        setRevoked(false);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Seed admin on first load
    fetch("/api/seed", { method: "POST" }).then(() => checkSession());
  }, [checkSession]);

  const handleLogin = (u: SessionUser) => {
    setUser(u);
    setRevoked(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-space-200 text-sm tracking-widest uppercase">Initializing PTMS</p>
        </div>
      </div>
    );
  }

  if (revoked) {
    return <RevokedScreen onLogout={handleLogout} />;
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
