"use client";

import { IconShield } from "./Icons";

export function RevokedScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-neon-rose/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-neon-rose/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-strong rounded-2xl p-12 max-w-lg text-center relative z-10 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-neon-rose/10 border border-neon-rose/30 flex items-center justify-center mx-auto mb-6">
          <IconShield className="w-10 h-10 text-neon-rose" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Revoked</h1>
        <p className="text-space-200 mb-8 leading-relaxed">
          Your account has been deactivated by a system administrator.
          Contact your PTMS administrator to restore access.
        </p>
        <button
          onClick={onLogout}
          className="btn-magnetic px-8 py-3 rounded-xl bg-neon-rose/20 border border-neon-rose/30 text-neon-rose font-semibold text-sm tracking-wide uppercase"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
