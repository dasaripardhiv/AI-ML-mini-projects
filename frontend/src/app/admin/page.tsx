'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Plus, Play, RefreshCw, BarChart2, Coins, Users, CheckSquare, 
  Trash, ArrowRight, UserCheck, Activity, Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { api } from '../../utils/api';

interface Match {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  status: 'upcoming' | 'live' | 'completed';
  homeScore: number;
  awayScore: number;
  oddsHome: number;
  oddsAway: number;
  oddsDraw: number;
}

interface SystemStats {
  totalUsers: number;
  totalPredictions: number;
  totalActiveTokens: number;
  avgAccuracy: number;
  matchCounts: {
    completed: number;
    upcoming: number;
    live: number;
    total: number;
  };
  totalDistributed: number;
  mostPredictedMatch: {
    homeTeam: string;
    awayTeam: string;
    count: number;
  } | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Match Form State
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [kickoffTime, setKickoffTime] = useState('');
  const [oddsHome, setOddsHome] = useState('2.0');
  const [oddsAway, setOddsAway] = useState('2.0');
  const [oddsDraw, setOddsDraw] = useState('3.0');
  const [formMsg, setFormMsg] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Live score update states
  const [liveScores, setLiveScores] = useState<Record<string, { home: string; away: string }>>({});

  const loadAdminData = async () => {
    try {
      const matchesData = await api.get<Match[]>('/matches');
      setMatches(matchesData);

      const statsData = await api.get<SystemStats>('/admin/stats');
      setStats(statsData);

      // Prepopulate score inputs
      const initialScores: Record<string, { home: string; away: string }> = {};
      matchesData.forEach(m => {
        initialScores[m._id] = { home: m.homeScore.toString(), away: m.awayScore.toString() };
      });
      setLiveScores(initialScores);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (user) {
      loadAdminData();
    }
  }, [user, router]);

  const handleCreateMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    setFormError('');
    setFormLoading(true);

    try {
      await api.post('/matches', {
        homeTeam,
        awayTeam,
        kickoffTime: new Date(kickoffTime).toISOString(),
        oddsHome: parseFloat(oddsHome),
        oddsAway: parseFloat(oddsAway),
        oddsDraw: parseFloat(oddsDraw)
      });

      setFormMsg('Match created and AI insights generated successfully!');
      setHomeTeam('');
      setAwayTeam('');
      setKickoffTime('');
      setOddsHome('2.0');
      setOddsAway('2.0');
      setOddsDraw('3.0');
      
      await loadAdminData();
    } catch (err: any) {
      setFormError(err.message || 'Error creating match');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      await api.put(`/matches/${matchId}`, { status: 'live' });
      await loadAdminData();
    } catch (err) {
      alert('Failed to start match');
    }
  };

  const handleUpdateLiveScore = async (matchId: string) => {
    const scores = liveScores[matchId];
    if (!scores) return;

    try {
      await api.put(`/matches/${matchId}`, {
        homeScore: parseInt(scores.home),
        awayScore: parseInt(scores.away)
      });
      alert('Score updated successfully!');
      await loadAdminData();
    } catch (err) {
      alert('Failed to update live scores');
    }
  };

  const handleResolveMatch = async (matchId: string) => {
    const scores = liveScores[matchId];
    if (!scores) return;

    const confirm = window.confirm('Are you sure you want to resolve this match? This will pay out tokens to winners and cannot be undone.');
    if (!confirm) return;

    try {
      const summary = await api.post<{ payoutsCount: number }>(`/admin/resolve/${matchId}`, {
        homeScore: parseInt(scores.home),
        awayScore: parseInt(scores.away)
      });
      alert(`Match resolved successfully! Processed ${summary.payoutsCount} player predictions.`);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve match');
    }
  };

  const handleScoreChange = (matchId: string, team: 'home' | 'away', val: string) => {
    setLiveScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: val
      }
    }));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#030510] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white">ACCESS DENIED</h2>
        <p className="text-xs text-slate-400 mt-1">Administrator privileges required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030510]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-cyan-400" /> Admin Command Center
          </h1>
          <p className="text-xs text-slate-400 font-light mt-1">
            Create fixtures, update live match scores, publish results, and review dashboard analytics.
          </p>
        </div>

        {/* ANALYTICS HIGHLIGHTS */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" /> Total Users
              </span>
              <h4 className="text-xl font-black text-white font-rajdhani mt-1">{stats.totalUsers}</h4>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <CheckSquare className="w-3 h-3 text-[#00ff87]" /> Predictions
              </span>
              <h4 className="text-xl font-black text-white font-rajdhani mt-1">{stats.totalPredictions}</h4>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-400" /> Tokens Circulation
              </span>
              <h4 className="text-xl font-black text-white font-rajdhani mt-1">{stats.totalActiveTokens.toLocaleString()}</h4>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400" /> Avg Accuracy
              </span>
              <h4 className="text-xl font-black text-white font-rajdhani mt-1">{stats.avgAccuracy}%</h4>
            </div>

            <div className="glass p-5 rounded-2xl border border-white/5 col-span-2 lg:col-span-1">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                <BarChart2 className="w-3 h-3 text-red-400" /> Fixtures (Live / Upc)
              </span>
              <h4 className="text-xl font-black text-white font-rajdhani mt-1">
                {stats.matchCounts.live} / {stats.matchCounts.upcoming}
              </h4>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Match Creator Form */}
          <div className="glass p-6 rounded-3xl border border-white/5 h-fit space-y-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" /> Create Match
            </h3>

            {formMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl font-semibold">
                {formMsg}
              </div>
            )}
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMatchSubmit} className="space-y-4 text-xs font-semibold text-slate-400">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="uppercase font-bold tracking-wider">Home Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Liverpool"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase font-bold tracking-wider">Away Team</label>
                  <input
                    type="text"
                    placeholder="e.g. Everton"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="uppercase font-bold tracking-wider">Kickoff Date/Time</label>
                <input
                  type="datetime-local"
                  value={kickoffTime}
                  onChange={(e) => setKickoffTime(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="uppercase font-bold tracking-wider">Odds Home</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={oddsHome}
                    onChange={(e) => setOddsHome(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase font-bold tracking-wider">Odds Draw</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={oddsDraw}
                    onChange={(e) => setOddsDraw(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="uppercase font-bold tracking-wider">Odds Away</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={oddsAway}
                    onChange={(e) => setOddsAway(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-400/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none text-center"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-55"
              >
                {formLoading ? 'Creating...' : 'Create Match'}
              </button>
            </form>
          </div>

          {/* Active Matches Manager */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-[#00ff87]" /> Active Fixtures Controller
            </h3>

            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading matches...</div>
            ) : matches.filter(m => m.status !== 'completed').length === 0 ? (
              <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-white/5 text-slate-500 text-xs font-light">
                No active or upcoming matches. Add fixtures using the form.
              </div>
            ) : (
              <div className="space-y-4">
                {matches.filter(m => m.status !== 'completed').map(match => {
                  const currentScore = liveScores[match._id] || { home: '0', away: '0' };
                  return (
                    <div key={match._id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          {match.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">
                          {match.homeTeam} vs {match.awayTeam}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-light mt-0.5">
                          Kickoff: {new Date(match.kickoffTime).toLocaleString()}
                        </span>
                      </div>

                      {/* Score editor / Start Match */}
                      <div className="flex items-center gap-3">
                        {match.status === 'upcoming' ? (
                          <button
                            onClick={() => handleStartMatch(match._id)}
                            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-emerald-400" /> Start Live
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={currentScore.home}
                              onChange={(e) => handleScoreChange(match._id, 'home', e.target.value)}
                              className="w-10 bg-slate-900 border border-white/10 rounded px-1 py-1 text-center font-bold text-sm text-white"
                            />
                            <span className="text-slate-500 font-bold">:</span>
                            <input
                              type="number"
                              min="0"
                              value={currentScore.away}
                              onChange={(e) => handleScoreChange(match._id, 'away', e.target.value)}
                              className="w-10 bg-slate-900 border border-white/10 rounded px-1 py-1 text-center font-bold text-sm text-white"
                            />
                            <button
                              onClick={() => handleUpdateLiveScore(match._id)}
                              className="p-2 bg-slate-900 border border-white/10 rounded-xl hover:border-white/20 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
                              title="Update Live Score"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResolveMatch(match._id)}
                              className="bg-yellow-400 text-[#030510] text-xs font-black px-3 py-2 rounded-xl cursor-pointer hover:bg-yellow-300 active:scale-95 transition-all"
                            >
                              Resolve
                            </button>
                          </div>
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
    </div>
  );
}
