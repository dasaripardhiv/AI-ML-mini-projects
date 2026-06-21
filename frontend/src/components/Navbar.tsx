'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Wallet, ShieldCheck, LogOut, Lock, Key, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, claimSandboxTokens } = useAuth();
  const pathname = usePathname();
  const [sandboxLoading, setSandboxLoading] = useState(false);

  if (!user) return null;

  const handleSandboxClaim = async (amount: number) => {
    setSandboxLoading(true);
    try {
      await claimSandboxTokens(amount);
    } catch (err) {
      alert('Sandbox claim failed');
    } finally {
      setSandboxLoading(false);
    }
  };

  const isLocked = user.tokens < 30000 && !user.isChampion;

  return (
    <nav className="w-full bg-[#050818]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Logo and Nav links */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00ff87] to-[#00e5ff] flex items-center justify-center glow-green">
              <Trophy className="w-4.5 h-4.5 text-[#030510]" />
            </div>
            <span className="font-bold uppercase tracking-wider text-white">
              FIFA Predictor <span className="text-[#00ff87]">Arena</span>
            </span>
          </Link>

          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link 
              href="/dashboard" 
              className={`hover:text-[#00ff87] transition-all py-1 ${pathname === '/dashboard' ? 'text-[#00ff87] border-b-2 border-[#00ff87]' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/leaderboard" 
              className={`hover:text-[#00ff87] transition-all py-1 ${pathname === '/leaderboard' ? 'text-[#00ff87] border-b-2 border-[#00ff87]' : ''}`}
            >
              Leaderboard
            </Link>
            <Link 
              href={isLocked ? '#' : '/arena'} 
              className={`flex items-center gap-1 hover:text-yellow-400 transition-all py-1 ${isLocked ? 'opacity-40 cursor-not-allowed' : ''} ${pathname === '/arena' ? 'text-yellow-400 border-b-2 border-yellow-400' : ''}`}
            >
              {isLocked && <Lock className="w-3 h-3 text-slate-500" />}
              Champion Arena
            </Link>
            {user.role === 'admin' && (
              <Link 
                href="/admin" 
                className={`flex items-center gap-1 hover:text-cyan-400 transition-all py-1 ${pathname === '/admin' ? 'text-cyan-400 border-b-2 border-cyan-400' : ''}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* User stats, Sandbox debug tools and logout */}
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
          {/* SANDBOX CONTROLS */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-red-500/20 shadow-md">
            <Coins className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Sandbox:</span>
            <button 
              onClick={() => handleSandboxClaim(1000)}
              disabled={sandboxLoading}
              className="text-[9px] font-bold bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 px-2 py-0.5 rounded hover:bg-[#00ff87]/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +1k
            </button>
            <button 
              onClick={() => handleSandboxClaim(30000)}
              disabled={sandboxLoading}
              className="text-[9px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded hover:bg-yellow-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              +30k (Champion)
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-white/5 pl-3 pr-4 py-1.5 rounded-2xl shadow-inner">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">{user.username}</span>
              <span className="text-[10px] text-slate-400 font-light flex items-center justify-end gap-1">
                <Wallet className="w-3 h-3 text-[#00ff87]" />
                <span className="text-[#00ff87] font-bold">{user.tokens.toLocaleString()}</span> Tokens
              </span>
            </div>
            
            {/* Avatar representation */}
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-inner uppercase`}>
              {user.username.substring(0, 2)}
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={logout}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer hover:bg-slate-900 active:scale-95"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};
