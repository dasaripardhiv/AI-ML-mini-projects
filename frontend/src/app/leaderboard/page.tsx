'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Target, Zap, Medal, Users, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { api } from '../../utils/api';

interface LeaderboardUser {
  _id: string;
  username: string;
  avatar: string;
  tokens: number;
  accuracy: number;
  winStreak: number;
  isChampion: boolean;
  earned?: number; // for weekly/monthly
}

interface LeaderboardData {
  global: LeaderboardUser[];
  weekly: LeaderboardUser[];
  monthly: LeaderboardUser[];
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardTab, setLeaderboardTab] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeaderboardData>('/leaderboard')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching leaderboard:', err);
        setLoading(false);
      });
  }, []);

  if (!user) return null;

  const currentList = data ? data[leaderboardTab] : [];

  const getRankStyle = (index: number) => {
    if (index === 0) return 'text-yellow-400 glow-text-gold';
    if (index === 1) return 'text-slate-300';
    if (index === 2) return 'text-amber-600';
    return 'text-slate-500';
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Medal className="w-5 h-5 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-300 fill-slate-300/20" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600 fill-amber-600/20" />;
    return <span className="text-xs font-rajdhani font-black text-slate-500 w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-[#030510]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
              <Trophy className="w-8 h-8 text-[#00ff87] glow-green" /> Gladiator Leaderboard
            </h1>
            <p className="text-xs text-slate-400 font-light mt-1">
              Compete with players worldwide. Earn rewards and secure your position in history.
            </p>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setLeaderboardTab('global')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                leaderboardTab === 'global' ? 'bg-[#00ff87] text-[#030510] font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Global
            </button>
            <button
              onClick={() => setLeaderboardTab('weekly')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                leaderboardTab === 'weekly' ? 'bg-[#00ff87] text-[#030510] font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setLeaderboardTab('monthly')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                leaderboardTab === 'monthly' ? 'bg-[#00ff87] text-[#030510] font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* TOP 3 PODIUM PREVIEW */}
        {!loading && currentList.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 items-end mb-10 pt-4 max-w-2xl mx-auto">
            {/* 2nd Place */}
            <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-2 relative h-[140px] justify-end">
              <div className="absolute top-2 right-2 text-slate-400 text-xs font-rajdhani font-black">#2</div>
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-300/30 flex items-center justify-center text-xs font-bold text-white shadow-inner uppercase">
                {currentList[1].username.substring(0, 2)}
              </div>
              <h4 className="text-xs font-bold text-white truncate w-full">{currentList[1].username}</h4>
              <span className="text-[10px] font-bold text-slate-300">
                {leaderboardTab === 'global' ? `${currentList[1].tokens.toLocaleString()} Tokens` : `+${currentList[1].earned?.toLocaleString()} earned`}
              </span>
            </div>

            {/* 1st Place */}
            <div className="glass p-5 rounded-2xl border border-yellow-400/20 bg-gradient-to-t from-yellow-400/5 to-transparent flex flex-col items-center text-center space-y-2.5 relative h-[170px] justify-end glow-gold">
              <div className="absolute top-2 right-2 text-yellow-400 text-xs font-rajdhani font-black">#1</div>
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-yellow-400/40 flex items-center justify-center text-sm font-bold text-white shadow-inner uppercase relative">
                <Star className="w-3.5 h-3.5 text-yellow-400 absolute -top-1.5 -right-1.5 fill-yellow-400" />
                {currentList[0].username.substring(0, 2)}
              </div>
              <h4 className="text-sm font-black text-white truncate w-full flex items-center justify-center gap-1">
                {currentList[0].username}
                {currentList[0].isChampion && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
              </h4>
              <span className="text-xs font-black text-yellow-400">
                {leaderboardTab === 'global' ? `${currentList[0].tokens.toLocaleString()} Tokens` : `+${currentList[0].earned?.toLocaleString()} earned`}
              </span>
            </div>

            {/* 3rd Place */}
            <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center space-y-2 relative h-[120px] justify-end">
              <div className="absolute top-2 right-2 text-amber-600 text-xs font-rajdhani font-black">#3</div>
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-amber-600/30 flex items-center justify-center text-xs font-bold text-white shadow-inner uppercase">
                {currentList[2].username.substring(0, 2)}
              </div>
              <h4 className="text-xs font-bold text-white truncate w-full">{currentList[2].username}</h4>
              <span className="text-[10px] font-bold text-amber-600">
                {leaderboardTab === 'global' ? `${currentList[2].tokens.toLocaleString()} Tokens` : `+${currentList[2].earned?.toLocaleString()} earned`}
              </span>
            </div>
          </div>
        )}

        {/* LEADERBOARD LIST TABLE */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-4 bg-slate-950/40 border-b border-white/5 grid grid-cols-12 text-2xs uppercase font-extrabold text-slate-400 tracking-wider">
            <span className="col-span-2 text-center">Rank</span>
            <span className="col-span-4 pl-2">Gladiator</span>
            <span className="col-span-2 text-center">Accuracy</span>
            <span className="col-span-2 text-center flex items-center justify-center gap-0.5"><Zap className="w-3.5 h-3.5 text-[#00ff87]" /> Streak</span>
            <span className="col-span-2 text-right pr-4">Tokens</span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Retrieving leaderboard lists...</div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-light">No records found. Place some stakes to appear here!</div>
          ) : (
            <div className="divide-y divide-white/5">
              {currentList.map((player, idx) => {
                const isCurrentUser = player._id === user._id;
                return (
                  <div 
                    key={player._id} 
                    className={`p-4 grid grid-cols-12 items-center text-sm transition-all hover:bg-white/2 ${
                      isCurrentUser ? 'bg-gradient-to-r from-[#00ff87]/5 to-[#00e5ff]/5 font-semibold border-l-4 border-l-[#00ff87]' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex justify-center items-center">
                      {getRankBadge(idx)}
                    </div>

                    {/* Profile */}
                    <div className="col-span-4 flex items-center gap-3 pl-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-bold text-white shadow-inner uppercase">
                        {player.username.substring(0, 2)}
                      </div>
                      <span className="text-white truncate flex items-center gap-1">
                        {player.username}
                        {player.isChampion && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                      </span>
                    </div>

                    {/* Accuracy */}
                    <div className="col-span-2 text-center text-xs text-slate-300 font-rajdhani font-black">
                      {player.accuracy}%
                    </div>

                    {/* Streak */}
                    <div className="col-span-2 text-center text-xs text-[#00ff87] font-rajdhani font-black">
                      {player.winStreak > 0 ? `${player.winStreak} Win` : '-'}
                    </div>

                    {/* Token Balance */}
                    <div className="col-span-2 text-right pr-4 font-rajdhani font-black text-white">
                      {leaderboardTab === 'global' ? (
                        player.tokens.toLocaleString()
                      ) : (
                        <span className="text-[#00ff87]">+{player.earned?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
