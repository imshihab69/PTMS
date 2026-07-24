"use client";

import { useState, type FormEvent } from "react";
import type { SessionUser } from "@/app/page";
import { IconSignalWave, IconTerminal } from "./Icons";

export function LoginScreen({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        onLogin(data.user);
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient background gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-rose/3 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="glass-strong rounded-2xl p-10 w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo area */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center">
            <IconTerminal className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PTMS</h1>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          <IconSignalWave className="w-4 h-4 text-neon-cyan" />
          <p className="text-xs tracking-[0.3em] uppercase text-space-200">Infrastructure Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              placeholder=""
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-space-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-neon-rose/10 border border-neon-rose/30 rounded-lg px-4 py-2.5 text-neon-rose text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-magnetic w-full py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-semibold text-sm tracking-wide uppercase disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              "Access Terminal"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[8px] text-space-300 tracking-widest uppercase">
              Developed by Shihab Mohammed | Employee ID: 21235

            
          </p>
        </div>
      </div>
    </div>
  );
}
