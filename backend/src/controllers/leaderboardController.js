import { db } from '../config/db.js';

export const getLeaderboard = async (req, res) => {
  try {
    const allUsers = await db.find('User');
    
    // Calculate global rank profiles
    const globalProfiles = allUsers.map(user => {
      const accuracy = user.predictionsCount > 0 
        ? Math.round((user.correctPredictions / user.predictionsCount) * 100) 
        : 0;
      return {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        tokens: user.tokens || 0,
        accuracy,
        winStreak: user.winStreak || 0,
        isChampion: user.isChampion || false
      };
    });

    // 1. Global Leaderboard: Sorted by total token balance
    const globalRankings = [...globalProfiles].sort((a, b) => b.tokens - a.tokens);

    // 2. Weekly Leaderboard: Tokens earned in the last 7 days from wins and bonuses
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // 3. Monthly Leaderboard: Tokens earned in the last 30 days
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const allTransactions = await db.find('Transaction');

    const computeEarnedLeaderboard = (sinceDate) => {
      const earningsMap = {};
      
      allTransactions.forEach(tx => {
        const txDate = new Date(tx.timestamp);
        if (txDate >= sinceDate && (tx.type === 'prediction_win' || tx.type === 'streak_bonus' || tx.type === 'achievement_unlock')) {
          earningsMap[tx.userId] = (earningsMap[tx.userId] || 0) + tx.amount;
        }
      });

      return globalProfiles.map(profile => {
        return {
          ...profile,
          earned: earningsMap[profile._id] || 0
        };
      })
      .filter(p => p.earned > 0 || p.tokens > 0) // include anyone with records
      .sort((a, b) => b.earned - a.earned);
    };

    const weeklyRankings = computeEarnedLeaderboard(oneWeekAgo);
    const monthlyRankings = computeEarnedLeaderboard(oneMonthAgo);

    res.json({
      global: globalRankings.slice(0, 50),
      weekly: weeklyRankings.slice(0, 50),
      monthly: monthlyRankings.slice(0, 50)
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};
