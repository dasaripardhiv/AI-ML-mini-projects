'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Wallet, Award, TrendingUp, Zap, ChevronRight, HelpCircle, 
  CheckCircle, XCircle, AlertTriangle, Play, Coins, Calendar, Trophy, Lock
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
  result: 'Home' | 'Away' | 'Draw' | null;
  oddsHome: number;
  oddsAway: number;
  oddsDraw: number;
  aiInsights?: {
    winProbabilities: { home: number; away: number; draw: number };
    confidence: string;
    analysis: string;
    upsetAlert: boolean;
  };
}

interface UserPrediction {
  _id: string;
  matchId: string;
  type: 'Winner' | 'ExactScore';
  predictedOutcome?: 'Home' | 'Away' | 'Draw';
  predictedHomeScore?: number;
  predictedAwayScore?: number;
  tokensAllocated: number;
  isResolved: boolean;
  isCorrect: boolean;
  rewardTokens: number;
  createdAt: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    kickoffTime: string;
    status: string;
    homeScore: number;
    awayScore: number;
    result: string | null;
    oddsHome: number;
    oddsAway: number;
    oddsDraw: number;
  } | null;
}

export default function Dashboard() {
  const { user, refreshProfile, claimSandboxTokens } = useAuth();
  const [activeTab, setActiveTab] = useState<'matches' | 'predictions' | 'achievements'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals/Drawers State
  const [selectedMatchForAi, setSelectedMatchForAi] = useState<Match | null>(null);
  const [selectedMatchForPredict, setSelectedMatchForPredict] = useState<Match | null>(null);
  
  // Prediction Form State
  const [predType, setPredType] = useState<'Winner' | 'ExactScore'>('Winner');
  const [outcome, setOutcome] = useState<'Home' | 'Away' | 'Draw'>('Home');
  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [tokensAllocated, setTokensAllocated] = useState('10');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      const matchesData = await api.get<Match[]>('/matches');
      setMatches(matchesData);
      
      const predictionsData = await api.get<UserPrediction[]>('/predictions/my');
      setUserPredictions(predictionsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePredictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    if (!selectedMatchForPredict || !user) return;

    const tokens = parseInt(tokensAllocated);
    if (isNaN(tokens) || tokens <= 0) {
      setFormError('Please enter a valid positive token stake.');
      setFormLoading(false);
      return;
    }

    if (tokens > user.tokens) {
      setFormError(`Insufficient tokens. You have ${user.tokens} available.`);
      setFormLoading(false);
      return;
    }

    try {
      await api.post('/predictions', {
        matchId: selectedMatchForPredict._id,
        type: predType,
        predictedOutcome: outcome,
        predictedHomeScore: predType === 'ExactScore' ? parseInt(homeScore) : undefined,
        predictedAwayScore: predType === 'ExactScore' ? parseInt(awayScore) : undefined,
        tokensAllocated: tokens
      });

      setFormSuccess('Prediction submitted successfully!');
      setTimeout(async () => {
        setSelectedMatchForPredict(null);
        setFormSuccess('');
        setFormError('');
        // Refresh
        await refreshProfile();
        await fetchData();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit prediction');
    } finally {
      setFormLoading(false);
    }
  };

  if (!user) return null;

  // Acc calculations
  const totalPredsCount = user.predictionsCount || 0;
  const correctCount = user.correctPredictions || 0;
  const accuracyPct = totalPredsCount > 0 ? Math.round((correctCount / totalPredsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#030510]">
      <Navbar />

      {/* DASHBOARD STATS BAR */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-[#00ff87]/20 flex items-center justify-center text-[#00ff87] glow-green">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Fan Tokens</p>
              <h4 className="text-xl font-black text-white font-rajdhani">{user.tokens.toLocaleString()}</h4>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff] glow-blue">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Accuracy</p>
              <h4 className="text-xl font-black text-white font-rajdhani">{accuracyPct}%</h4>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-yellow-400/20 flex items-center justify-center text-yellow-400 glow-gold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Win Streak</p>
              <h4 className="text-xl font-black text-white font-rajdhani">{user.winStreak} Matches</h4>
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Achievements</p>
              <h4 className="text-xl font-black text-white font-rajdhani">{user.unlockedAchievements.length} Unlocked</h4>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex gap-4 border-b border-white/5">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'matches' ? 'bg-[#00ff87] text-[#030510] font-black glow-green' : 'glass text-slate-400 hover:text-white'
          }`}
        >
          Match Center
        </button>
        <button
          onClick={() => setActiveTab('predictions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'predictions' ? 'bg-[#00ff87] text-[#030510] font-black glow-green' : 'glass text-slate-400 hover:text-white'
          }`}
        >
          My Predictions ({userPredictions.length})
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'achievements' ? 'bg-[#00ff87] text-[#030510] font-black glow-green' : 'glass text-slate-400 hover:text-white'
          }`}
        >
          Gladiator Medals
        </button>
      </div>

      {/* TAB CONTENTS */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading arena data...</div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'matches' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* UPCOMING / LIVE MATCHES SECTION */}
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-6 flex items-center gap-2">
                    <Play className="w-5 h-5 text-[#00ff87] fill-[#00ff87]" /> Active Fixtures
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matches.filter(m => m.status !== 'completed').map(match => {
                      const hasPredicted = userPredictions.some(p => p.matchId === match._id);
                      return (
                        <div 
                          key={match._id} 
                          className={`glass rounded-3xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col justify-between ${
                            match.status === 'live' ? 'border-[#00ff87]/20 bg-[#00ff87]/2' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            {match.status === 'live' ? (
                              <span className="flex items-center gap-1 bg-[#00ff87]/10 border border-[#00ff87]/30 text-[#00ff87] font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                ● LIVE MATCH
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(match.kickoffTime).toLocaleString()}
                              </span>
                            )}
                            {match.aiInsights?.upsetAlert && (
                              <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                <AlertTriangle className="w-3 h-3" /> Upset Alert
                              </span>
                            )}
                          </div>

                          {/* Teams Displays */}
                          <div className="flex justify-between items-center py-3">
                            <div className="text-center w-5/12">
                              <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-sm font-black mx-auto mb-2 text-white">
                                {match.homeTeam.substring(0, 3).toUpperCase()}
                              </div>
                              <h4 className="text-sm font-bold text-white leading-tight">{match.homeTeam}</h4>
                            </div>

                            <div className="text-center w-2/12 flex flex-col items-center justify-center">
                              {match.status === 'live' ? (
                                <div className="text-2xl font-black text-white font-rajdhani bg-slate-950/80 px-3 py-1 rounded-xl border border-white/5">
                                  {match.homeScore} - {match.awayScore}
                                </div>
                              ) : (
                                <span className="text-slate-500 font-rajdhani font-black text-lg">VS</span>
                              )}
                            </div>

                            <div className="text-center w-5/12">
                              <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-sm font-black mx-auto mb-2 text-white">
                                {match.awayTeam.substring(0, 3).toUpperCase()}
                              </div>
                              <h4 className="text-sm font-bold text-white leading-tight">{match.awayTeam}</h4>
                            </div>
                          </div>

                          {/* Odds Panel */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-white/5 my-4 text-center">
                            <div className="text-2xs font-semibold uppercase text-slate-400">
                              Home: <span className="text-white font-bold block mt-0.5 text-xs">{match.oddsHome.toFixed(2)}x</span>
                            </div>
                            <div className="text-2xs font-semibold uppercase text-slate-400">
                              Draw: <span className="text-white font-bold block mt-0.5 text-xs">{match.oddsDraw.toFixed(2)}x</span>
                            </div>
                            <div className="text-2xs font-semibold uppercase text-slate-400">
                              Away: <span className="text-white font-bold block mt-0.5 text-xs">{match.oddsAway.toFixed(2)}x</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedMatchForAi(match)}
                              className="w-1/2 glass hover:bg-slate-900 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Brain className="w-3.5 h-3.5 text-[#00ff87]" />
                              AI Insights
                            </button>
                            {match.status === 'upcoming' ? (
                              <button
                                onClick={() => {
                                  setSelectedMatchForPredict(match);
                                  setOutcome('Home');
                                  setPredType('Winner');
                                }}
                                disabled={hasPredicted}
                                className={`w-1/2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  hasPredicted 
                                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-[#030510] glow-green active:scale-95'
                                }`}
                              >
                                {hasPredicted ? 'Predicted' : 'Predict Match'}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-1/2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-950 text-slate-600 border border-white/5 cursor-not-allowed flex items-center justify-center"
                              >
                                Locked (In Play)
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMPLETED FIXTURES */}
                <div className="pt-8">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-slate-400" /> Resolved Fixtures
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {matches.filter(m => m.status === 'completed').map(match => (
                      <div key={match._id} className="glass rounded-2xl border border-white/5 p-5 flex flex-col justify-between opacity-75 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-3">
                          <span>COMPLETED</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-white/5">FT</span>
                        </div>
                        <div className="flex justify-between items-center font-rajdhani font-black text-white text-sm my-2">
                          <span className="w-5/12 text-right truncate">{match.homeTeam}</span>
                          <span className="w-2/12 text-center bg-slate-950/80 px-2.5 py-0.5 border border-white/5 rounded text-xs">
                            {match.homeScore} - {match.awayScore}
                          </span>
                          <span className="w-5/12 text-left truncate">{match.awayTeam}</span>
                        </div>
                        <div className="text-[10px] text-center text-slate-400 font-light mt-2 border-t border-white/5 pt-2">
                          Outcome: <span className="font-bold text-white">{match.result === 'Home' ? match.homeTeam : match.result === 'Away' ? match.awayTeam : 'Draw'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* MY PREDICTIONS TAB */}
            {activeTab === 'predictions' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#00ff87]" /> Prediction History
                </h2>

                {userPredictions.length === 0 ? (
                  <div className="text-center py-20 bg-slate-950/50 rounded-3xl border border-white/5 text-slate-500 font-light">
                    No predictions submitted yet. Place stakes on upcoming fixtures!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPredictions.map(pred => {
                      const m = pred.match;
                      if (!m) return null;
                      
                      return (
                        <div key={pred._id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all">
                          {/* Match Info */}
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              {pred.type === 'ExactScore' ? 'Exact Score Prediction' : 'Winner Outcome Prediction'}
                            </span>
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                              {m.homeTeam} 
                              <span className="text-slate-500">
                                {m.status === 'upcoming' ? 'vs' : `${m.homeScore} - ${m.awayScore}`}
                              </span> 
                              {m.awayTeam}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-light mt-1">
                              Staked: <strong className="text-white font-semibold">{pred.tokensAllocated} Tokens</strong>
                            </span>
                          </div>

                          {/* Prediction Detail */}
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Guess</span>
                            <span className="text-xs text-white font-semibold mt-0.5">
                              {pred.type === 'Winner' ? (
                                `Winner: ${pred.predictedOutcome === 'Home' ? m.homeTeam : pred.predictedOutcome === 'Away' ? m.awayTeam : 'Draw'}`
                              ) : (
                                `Exact Score: ${pred.predictedHomeScore} - ${pred.predictedAwayScore}`
                              )}
                            </span>
                          </div>

                          {/* Status / Reward */}
                          <div className="flex items-center gap-4">
                            {!pred.isResolved ? (
                              <span className="bg-slate-900 border border-white/5 text-slate-400 text-2xs uppercase font-extrabold px-3 py-1.5 rounded-full tracking-wider">
                                PENDING KICKOFF
                              </span>
                            ) : pred.isCorrect ? (
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-2xs uppercase font-extrabold px-3 py-1.5 rounded-full tracking-wider flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> CORRECT
                                </span>
                                <span className="text-[#00ff87] text-xs font-bold">
                                  +{pred.rewardTokens} Tokens
                                </span>
                              </div>
                            ) : (
                              <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-2xs uppercase font-extrabold px-3 py-1.5 rounded-full tracking-wider flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> INCORRECT
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* GLADIATOR MEDALS TAB */}
            {activeTab === 'achievements' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Ledger & Medals */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Achievements list */}
                  <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" /> Gladiator Medals
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(user.achievementsList || []).map(ach => {
                        const isUnlocked = user.unlockedAchievements.includes(ach.id);
                        return (
                          <div 
                            key={ach.id} 
                            className={`glass p-5 rounded-2xl border flex items-start gap-4 transition-all ${
                              isUnlocked 
                                ? 'border-[#00ff87]/20 bg-gradient-to-br from-[#00ff87]/5 to-[#00e5ff]/5 glow-green' 
                                : 'border-white/5 opacity-40'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isUnlocked ? 'bg-slate-900 text-yellow-400 border border-yellow-400/20' : 'bg-slate-950 text-slate-600'
                            }`}>
                              <Trophy className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-white uppercase">{ach.name}</h4>
                              <p className="text-2xs text-slate-400 font-light mt-0.5 leading-snug">{ach.description}</p>
                              <span className="text-[10px] font-bold text-[#00ff87] mt-1.5 block">
                                +{ach.reward} Tokens Reward
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Transactions log */}
                  <div className="glass p-6 rounded-3xl border border-white/5 h-fit">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                      <Wallet className="w-4.5 h-4.5 text-[#00ff87]" /> Transaction History
                    </h3>

                    {user.transactions && user.transactions.length > 0 ? (
                      <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                        {user.transactions.map(tx => (
                          <div key={tx._id} className="flex justify-between items-start border-b border-white/5 pb-2.5 text-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-white capitalize">{tx.description || tx.type.replace('_', ' ')}</span>
                              <span className="text-slate-500 text-[10px] mt-0.5">{new Date(tx.timestamp).toLocaleString()}</span>
                            </div>
                            <span className={`font-bold font-rajdhani text-sm ${tx.amount > 0 ? 'text-[#00ff87]' : 'text-red-400'}`}>
                              {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-600 text-xs font-light">No ledger records found.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* AI INSIGHTS DIALOG */}
      <AnimatePresence>
        {selectedMatchForAi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatchForAi(null)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-premium w-full max-w-lg p-6 rounded-3xl relative overflow-hidden border border-white/10 z-10"
            >
              <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-1 flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00ff87] glow-green" /> AI Prediction Engine
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Insights for {selectedMatchForAi.homeTeam} vs {selectedMatchForAi.awayTeam}
              </p>

              <div className="space-y-6">
                {/* Win Probabilities Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-2xs uppercase font-bold text-slate-400 tracking-wider">
                    <span>{selectedMatchForAi.homeTeam} ({selectedMatchForAi.aiInsights?.winProbabilities?.home}%)</span>
                    <span>Draw ({selectedMatchForAi.aiInsights?.winProbabilities?.draw}%)</span>
                    <span>{selectedMatchForAi.awayTeam} ({selectedMatchForAi.aiInsights?.winProbabilities?.away}%)</span>
                  </div>
                  <div className="h-3.5 w-full rounded-full bg-slate-950 flex overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-[#00ff87]" 
                      style={{ width: `${selectedMatchForAi.aiInsights?.winProbabilities?.home}%` }} 
                    />
                    <div 
                      className="bg-slate-700" 
                      style={{ width: `${selectedMatchForAi.aiInsights?.winProbabilities?.draw}%` }} 
                    />
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-[#00e5ff]" 
                      style={{ width: `${selectedMatchForAi.aiInsights?.winProbabilities?.away}%` }} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confidence Level</span>
                    <p className="text-sm font-bold text-white mt-0.5">{selectedMatchForAi.aiInsights?.confidence} Rating</p>
                  </div>
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Upset Alert</span>
                    <p className={`text-sm font-bold mt-0.5 ${selectedMatchForAi.aiInsights?.upsetAlert ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                      {selectedMatchForAi.aiInsights?.upsetAlert ? '⚠️ HIGH POTENTIAL' : 'Low Potential'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Detailed Analysis</span>
                  <p className="text-xs text-slate-300 font-light leading-relaxed">
                    {selectedMatchForAi.aiInsights?.analysis}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMatchForAi(null)}
                className="w-full mt-6 bg-slate-900 border border-white/10 hover:border-white/20 text-white font-semibold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider"
              >
                Close Insights
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREDICT DRAWER */}
      <AnimatePresence>
        {selectedMatchForPredict && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMatchForPredict(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="glass-premium w-full max-w-md h-full p-8 overflow-y-auto flex flex-col justify-between border-l border-white/10 z-10 relative"
            >
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider text-white mb-1">
                  Place Prediction
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {selectedMatchForPredict.homeTeam} vs {selectedMatchForPredict.awayTeam}
                </p>

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl mb-4 font-semibold">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handlePredictSubmit} className="space-y-6">
                  {/* Select Prediction Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Prediction Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPredType('Winner')}
                        className={`py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                          predType === 'Winner' ? 'bg-[#00ff87] text-[#030510]' : 'glass text-slate-400 hover:text-white'
                        }`}
                      >
                        Winner Outcome
                      </button>
                      <button
                        type="button"
                        onClick={() => setPredType('ExactScore')}
                        className={`py-2 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                          predType === 'ExactScore' ? 'bg-[#00ff87] text-[#030510]' : 'glass text-slate-400 hover:text-white'
                        }`}
                      >
                        Exact Score
                      </button>
                    </div>
                  </div>

                  {/* Winner Outcome Selector */}
                  {predType === 'Winner' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Select Winner</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setOutcome('Home')}
                          className={`py-3 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                            outcome === 'Home' ? 'bg-gradient-to-r from-emerald-500 to-[#00ff87] text-[#030510]' : 'glass text-slate-400'
                          }`}
                        >
                          Home ({selectedMatchForPredict.oddsHome.toFixed(2)}x)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutcome('Draw')}
                          className={`py-3 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                            outcome === 'Draw' ? 'bg-slate-700 text-white' : 'glass text-slate-400'
                          }`}
                        >
                          Draw ({selectedMatchForPredict.oddsDraw.toFixed(2)}x)
                        </button>
                        <button
                          type="button"
                          onClick={() => setOutcome('Away')}
                          className={`py-3 rounded-xl text-xs font-bold uppercase cursor-pointer transition-all ${
                            outcome === 'Away' ? 'bg-gradient-to-r from-cyan-400 to-[#00e5ff] text-[#030510]' : 'glass text-slate-400'
                          }`}
                        >
                          Away ({selectedMatchForPredict.oddsAway.toFixed(2)}x)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Exact Score Selector */
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Predict Exact Score</label>
                      <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-white/5">
                        <div className="text-center w-5/12">
                          <span className="text-2xs uppercase font-bold text-slate-500 block mb-1">{selectedMatchForPredict.homeTeam}</span>
                          <input
                            type="number"
                            min="0"
                            value={homeScore}
                            onChange={(e) => setHomeScore(e.target.value)}
                            className="w-16 bg-slate-900 border border-white/10 rounded-xl py-2 text-center text-lg font-black font-rajdhani text-white outline-none focus:border-[#00ff87]/50"
                          />
                        </div>
                        <span className="text-slate-500 font-bold">:</span>
                        <div className="text-center w-5/12">
                          <span className="text-2xs uppercase font-bold text-slate-500 block mb-1">{selectedMatchForPredict.awayTeam}</span>
                          <input
                            type="number"
                            min="0"
                            value={awayScore}
                            onChange={(e) => setAwayScore(e.target.value)}
                            className="w-16 bg-slate-900 border border-white/10 rounded-xl py-2 text-center text-lg font-black font-rajdhani text-white outline-none focus:border-[#00ff87]/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tokens Allocation Stake */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-slate-400">Tokens to Stake</span>
                      <span className="text-[#00ff87]">Max: {user.tokens} Tokens</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={user.tokens}
                        value={tokensAllocated}
                        onChange={(e) => setTokensAllocated(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-[#00ff87]/40 rounded-xl px-4 py-3.5 text-sm font-bold text-white outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setTokensAllocated('10')}
                        className="glass py-1.5 rounded-lg text-3xs font-bold uppercase cursor-pointer hover:bg-slate-900"
                      >
                        10
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokensAllocated(Math.max(1, Math.round(user.tokens * 0.25)).toString())}
                        className="glass py-1.5 rounded-lg text-3xs font-bold uppercase cursor-pointer hover:bg-slate-900"
                      >
                        25%
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokensAllocated(Math.max(1, Math.round(user.tokens * 0.5)).toString())}
                        className="glass py-1.5 rounded-lg text-3xs font-bold uppercase cursor-pointer hover:bg-slate-900"
                      >
                        50%
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokensAllocated(user.tokens.toString())}
                        className="glass py-1.5 rounded-lg text-3xs font-bold uppercase cursor-pointer hover:bg-slate-900"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="space-y-2 mt-8">
                <button
                  type="button"
                  onClick={handlePredictSubmit}
                  disabled={formLoading}
                  className="w-full bg-gradient-to-r from-[#00ff87] to-[#00e5ff] text-[#030510] font-black py-4 rounded-xl shadow-lg hover:shadow-cyan-500/10 transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-55"
                >
                  Confirm Stakes & Predict
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMatchForPredict(null)}
                  className="w-full bg-slate-950 border border-white/5 hover:bg-slate-900 text-slate-400 font-bold py-3 rounded-xl cursor-pointer text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
