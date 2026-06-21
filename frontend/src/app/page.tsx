'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Wallet, Brain, Medal, Users, ArrowRight, ShieldCheck, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { StadiumCanvas } from '../components/3d/StadiumCanvas';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

interface Match {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  status: string;
  homeScore: number;
  awayScore: number;
}

export default function LandingPage() {
  const { user, login, register, googleLogin, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);

  useEffect(() => {
    // Load ticker matches
    api.get<Match[]>('/matches')
      .then(res => setRecentMatches(res.slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setFormLoading(true);

    try {
      if (modalType === 'login') {
        await login(email, password);
      } else {
        await register(username, email);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleMockLogin = async (role: 'admin' | 'user1' | 'user2') => {
    setErrorMsg('');
    setFormLoading(true);
    try {
      if (role === 'admin') {
        await googleLogin('admin@arena.com', 'Arena Director', 'avatar8');
      } else if (role === 'user1') {
        await googleLogin('maestro@arena.com', 'Midfield Maestro', 'avatar3');
      } else {
        await googleLogin('striker9@arena.com', 'Golden Striker', 'avatar5');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Mock login failed');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between select-none">
      {/* 3D Stadium Canvas */}
      <StadiumCanvas />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030510]/60 via-[#030510]/80 to-[#030510] -z-10" />

      {/* MATCHES TICKER */}
      <div className="w-full bg-[#040817]/80 backdrop-blur-md border-b border-white/5 py-2 overflow-hidden z-20">
        <div className="flex items-center whitespace-nowrap animate-none">
          <div className="flex gap-8 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="text-[#00ff87] glow-text-green font-bold mr-2">● LIVE TICKER</span>
            {recentMatches.length === 0 ? (
              <span>Real Madrid 0 - 0 Man City (Upcoming) • France 0 - 0 England (Upcoming) • Argentina 0 - 0 Brazil (Upcoming)</span>
            ) : (
              recentMatches.map(m => (
                <span key={m._id} className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-full border border-white/5">
                  {m.homeTeam}
                  <span className={m.status === 'live' ? 'text-[#00ff87] font-bold' : 'text-slate-300'}>
                    {m.status === 'upcoming' ? 'vs' : `${m.homeScore} - ${m.awayScore}`}
                  </span>
                  {m.awayTeam}
                  {m.status === 'live' && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse ml-1" />
                  )}
                  {m.status === 'completed' && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 rounded ml-1">FT</span>
                  )}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ff87] to-[#00e5ff] flex items-center justify-center glow-green">
            <Trophy className="w-5 h-5 text-[#030510]" />
          </div>
          <span className="text-xl font-bold uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            FIFA Predictor <span className="text-[#00ff87]">Arena</span>
          </span>
        </div>

        <div>
          <button
            onClick={() => {
              setModalType('login');
              setIsModalOpen(true);
            }}
            className="glass px-6 py-2.5 rounded-xl text-sm font-semibold tracking-wide hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            <LogIn className="w-4 h-4 text-[#00ff87]" />
            Enter Arena
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col justify-center items-center text-center max-w-5xl mx-auto px-6 py-12 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-[#00ff87]/10 px-4 py-1.5 rounded-full border border-[#00ff87]/20 text-xs font-semibold text-[#00ff87] uppercase tracking-widest shadow-md">
            <Brain className="w-4 h-4" /> AI-Powered Predictions
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold uppercase tracking-tight leading-none text-white">
            THE ULTIMATE <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00ff87] via-[#00e5ff] to-cyan-400 drop-shadow-[0_2px_15px_rgba(0,255,135,0.15)]">
              PREDICTOR ARENA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Predict match outcomes using virtual <strong className="text-[#00ff87] font-semibold">Fan Tokens</strong>, leverage AI win probabilities, unlock legendary achievements, and claim your place in the <strong className="text-yellow-400 font-semibold">Champion Arena</strong>.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => {
                setModalType('register');
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-[#030510] font-bold px-8 py-4 rounded-xl shadow-xl hover:shadow-[#00ff87]/20 transition-all flex items-center gap-2 group cursor-pointer active:scale-95 text-base"
            >
              Start Playing (Get 50 Tokens)
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => {
                setModalType('login');
                setIsModalOpen(true);
              }}
              className="glass border border-white/10 px-8 py-4 rounded-xl font-semibold hover:bg-white/5 transition-all text-base cursor-pointer active:scale-95"
            >
              Sign In
            </button>
          </div>
        </motion.div>

        {/* FEATURE HIGHLIGHTS */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl"
        >
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-3 hover:border-white/10 hover:bg-slate-900/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-[#00ff87]/20 text-[#00ff87] glow-green">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">AI Insights</h3>
            <p className="text-sm text-slate-400 font-light leading-snug">
              Compare your instincts with raw computer analytics, win probabilities, and upset alerts.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-3 hover:border-white/10 hover:bg-slate-900/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-[#00e5ff]/20 text-[#00e5ff] glow-blue">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">Risk & Reward</h3>
            <p className="text-sm text-slate-400 font-light leading-snug">
              Manage your Fan Token balance. Allocate stakes on single matches or chase high-multiplier scores.
            </p>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-3 hover:border-white/10 hover:bg-slate-900/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-yellow-400/20 text-yellow-400 glow-gold">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">Champion Arena</h3>
            <p className="text-sm text-slate-400 font-light leading-snug">
              Reach 30,000 Fan Tokens to unlock the premium Champion interface, badges, and rankings.
            </p>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#020308]/60 border-t border-white/5 py-4 z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-2">
          <span>© 2026 FIFA Predictor Arena. For simulation and educational purposes only.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer">API documentation</span>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-premium w-full max-w-md p-8 rounded-3xl relative overflow-hidden z-10 border border-white/10"
            >
              {/* Decorative glows */}
              <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-[#00ff87]/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-[#00e5ff]/10 blur-2xl" />

              <h2 className="text-2xl font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
                {modalType === 'login' ? (
                  <>
                    <LogIn className="w-6 h-6 text-[#00ff87]" />
                    Enter the Arena
                  </>
                ) : (
                  <>
                    <UserPlus className="w-6 h-6 text-[#00e5ff]" />
                    Register Gladiator
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-light mb-6">
                {modalType === 'login'
                  ? 'Connect to your profile to resume predicting and check your rank.'
                  : 'Start with 50 free Fan Tokens and unlock your first achievement.'}
              </p>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Username</label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Striker9"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-[#00ff87]/40 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/80 border border-white/5 focus:border-[#00ff87]/40 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {modalType === 'login' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-[#00ff87]/40 rounded-xl px-10 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-[#030510] font-bold py-3.5 rounded-xl shadow-lg hover:shadow-cyan-500/10 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-55"
                >
                  {formLoading ? 'Processing...' : modalType === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {/* Toggle modal type */}
              <div className="text-center mt-4 text-xs text-slate-400">
                {modalType === 'login' ? (
                  <>
                    New Gladiator?{' '}
                    <span
                      onClick={() => setModalType('register')}
                      className="text-[#00ff87] hover:underline cursor-pointer font-bold"
                    >
                      Register here
                    </span>
                  </>
                ) : (
                  <>
                    Already registered?{' '}
                    <span
                      onClick={() => setModalType('login')}
                      className="text-[#00e5ff] hover:underline cursor-pointer font-bold"
                    >
                      Login here
                    </span>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-2xs uppercase tracking-widest font-extrabold">
                  <span className="bg-slate-900/60 px-3 text-slate-500">SANDBOX TEST LOGIN</span>
                </div>
              </div>

              {/* Mock Logins */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleMockLogin('user1')}
                  disabled={formLoading}
                  className="flex flex-col items-center justify-center bg-slate-950/70 border border-white/5 hover:border-[#00e5ff]/30 py-2.5 rounded-xl cursor-pointer hover:bg-slate-900/50 active:scale-95 transition-all"
                >
                  <Medal className="w-4 h-4 text-[#00e5ff] mb-1" />
                  <span className="text-[10px] text-slate-300 font-semibold">User: Maestro</span>
                </button>
                <button
                  onClick={() => handleMockLogin('user2')}
                  disabled={formLoading}
                  className="flex flex-col items-center justify-center bg-slate-950/70 border border-white/5 hover:border-[#00ff87]/30 py-2.5 rounded-xl cursor-pointer hover:bg-slate-900/50 active:scale-95 transition-all"
                >
                  <Trophy className="w-4 h-4 text-[#00ff87] mb-1" />
                  <span className="text-[10px] text-slate-300 font-semibold">User: Striker9</span>
                </button>
                <button
                  onClick={() => handleMockLogin('admin')}
                  disabled={formLoading}
                  className="flex flex-col items-center justify-center bg-slate-950/70 border border-white/5 hover:border-yellow-400/30 py-2.5 rounded-xl cursor-pointer hover:bg-slate-900/50 active:scale-95 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-400 mb-1" />
                  <span className="text-[10px] text-slate-300 font-semibold">Admin Panel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
