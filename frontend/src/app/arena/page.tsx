'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trophy, Star, ShieldCheck, Lock, Sparkles, Coins, Zap, Award, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { api } from '../../utils/api';

interface ChampionMatch {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  oddsHome: number;
  oddsAway: number;
  oddsDraw: number;
  status: string;
}

interface ChampionUser {
  _id: string;
  username: string;
  tokens: number;
  accuracy: number;
  winStreak: number;
}

export default function ChampionArenaPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [championsList, setChampionsList] = useState<ChampionUser[]>([]);
  const [exclusiveMatches, setExclusiveMatches] = useState<ChampionMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Access check
    if (user && user.tokens < 30000 && !user.isChampion) {
      router.push('/dashboard');
      return;
    }

    const loadArenaData = async () => {
      try {
        const matches = await api.get<ChampionMatch[]>('/matches');
        setExclusiveMatches(matches.filter(m => m.status === 'upcoming').slice(0, 3));

        const lbData = await api.get<{ global: any[] }>('/leaderboard');
        // Filter only users with tokens >= 30,000 or marked champion
        const champs = lbData.global.filter(u => u.tokens >= 30000 || u.isChampion);
        setChampionsList(champs);
      } catch (err) {
        console.error('Error loading Champion Arena data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadArenaData();
    }
  }, [user, router]);

  if (!user || (user.tokens < 30000 && !user.isChampion)) {
    return (
      <div className="min-h-screen bg-[#030510] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="w-16 h-16 text-yellow-500/20 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold uppercase tracking-wider text-white">ACCESS DENIED</h2>
        <p className="text-sm text-slate-400 max-w-sm mt-1 leading-relaxed">
          The Champion Arena is locked. Accumulate 30,000 Fan Tokens to unlock entry and claim your Champion Badge.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060401] stadium-grid">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-gold p-8 rounded-3xl border border-yellow-500/30 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
        >
          {/* Background flare */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

          <div className="space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1 bg-yellow-400/20 px-3 py-1 rounded-full text-xs font-black uppercase text-yellow-400 tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Elite Gladiator Status
            </span>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white glow-text-gold font-rajdhani">
              CHAMPION ARENA
            </h1>
            <p className="text-sm text-yellow-200/70 max-w-xl font-light leading-relaxed">
              Welcome, Gladiator! You have climbed the rankings and earned your status. Enjoy exclusive high-multiplier predictor options and climb the Elite Champion leaderboard.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-yellow-500/20 w-32 h-32 rounded-2xl glow-gold">
            <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] fill-yellow-400/10" />
            <span className="text-3xs uppercase font-extrabold text-slate-400 mt-2 tracking-wider">CHAMPION BADGE</span>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* High stakes prediction fixtures */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2 font-rajdhani">
              <Flame className="w-5 h-5 text-yellow-400" /> High-Stakes Predictions
            </h2>

            {loading ? (
              <div className="text-center py-10 text-slate-500">Loading fixtures...</div>
            ) : exclusiveMatches.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-yellow-500/10 text-slate-500 font-light">
                No high-stakes matches listed currently. Check back later!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exclusiveMatches.map(match => (
                  <div key={match._id} className="glass-gold p-6 rounded-2xl flex flex-col justify-between h-[220px]">
                    <div className="flex justify-between items-center text-[10px] text-yellow-400/70 font-semibold mb-3">
                      <span>ELITE EVENT</span>
                      <span className="bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">DOUBLE PAYOUT</span>
                    </div>

                    <div className="flex justify-between items-center font-rajdhani font-black text-white text-lg my-2">
                      <span className="w-5/12 text-right truncate">{match.homeTeam}</span>
                      <span className="text-yellow-500 font-bold w-2/12 text-center text-sm">VS</span>
                      <span className="w-5/12 text-left truncate">{match.awayTeam}</span>
                    </div>

                    {/* Odds */}
                    <div className="grid grid-cols-3 gap-2 bg-black/60 p-2.5 rounded-xl border border-yellow-500/10 text-center text-2xs uppercase text-slate-400 my-2">
                      <div>Home <span className="text-yellow-400 font-bold block mt-0.5 text-xs">{(match.oddsHome * 2).toFixed(2)}x</span></div>
                      <div>Draw <span className="text-yellow-400 font-bold block mt-0.5 text-xs">{(match.oddsDraw * 2).toFixed(2)}x</span></div>
                      <div>Away <span className="text-yellow-400 font-bold block mt-0.5 text-xs">{(match.oddsAway * 2).toFixed(2)}x</span></div>
                    </div>

                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-black py-2.5 rounded-xl text-xs uppercase tracking-wider glow-gold active:scale-98 transition-all cursor-pointer"
                    >
                      Place Prediction via Dashboard
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Champion Rankings list */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-2 font-rajdhani">
              <Award className="w-5 h-5 text-yellow-400" /> Champion Rankings
            </h2>

            <div className="glass-gold rounded-2xl p-5 border border-yellow-500/20">
              {loading ? (
                <div className="text-center py-6 text-slate-500 text-xs">Loading ranks...</div>
              ) : championsList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-light">No champions listed.</div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {championsList.map((champ, index) => (
                    <div key={champ._id} className="flex justify-between items-center border-b border-yellow-500/10 pb-3 last:border-b-0 last:pb-0 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-rajdhani font-black text-yellow-400 w-5">#{index + 1}</span>
                        <div className="w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xs font-bold text-yellow-400 uppercase">
                          {champ.username.substring(0, 2)}
                        </div>
                        <span className="font-bold text-white truncate max-w-[100px]">{champ.username}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-bold text-yellow-400 font-rajdhani">{champ.tokens.toLocaleString()} Tokens</span>
                        <span className="text-[9px] text-slate-400 font-light mt-0.5">Acc: {champ.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
