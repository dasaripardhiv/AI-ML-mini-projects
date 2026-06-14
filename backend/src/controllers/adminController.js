import { db } from '../config/db.js';
import { processMatchPredictions } from '../utils/rewardEngine.js';

export const resolveMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { homeScore, awayScore } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ message: 'Home score and away score are required' });
    }

    const hScore = parseInt(homeScore);
    const aScore = parseInt(awayScore);

    // 1. Verify match exists and is not already completed
    const match = await db.findById('Match', matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status === 'completed') {
      return res.status(400).json({ message: 'Match is already completed and resolved' });
    }

    // Determine result
    let result = 'Draw';
    if (hScore > aScore) result = 'Home';
    else if (aScore > hScore) result = 'Away';

    // 2. Update match scores and status to completed
    await db.updateOne('Match', { _id: matchId }, {
      $set: {
        status: 'completed',
        homeScore: hScore,
        awayScore: aScore,
        result
      }
    });

    // 3. Process predictions, payouts, streaks, achievements
    const predictionSummary = await processMatchPredictions(matchId, hScore, aScore);

    res.json({
      message: 'Match resolved and rewards distributed successfully',
      match: {
        _id: matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        status: 'completed',
        homeScore: hScore,
        awayScore: aScore,
        result
      },
      payoutsCount: predictionSummary.length,
      details: predictionSummary
    });
  } catch (error) {
    console.error('Error resolving match:', error);
    res.status(500).json({ message: error.message || 'Server error resolving match' });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const users = await db.find('User');
    const matches = await db.find('Match');
    const predictions = await db.find('Prediction');
    const transactions = await db.find('Transaction');

    const totalUsers = users.length;
    const totalPredictions = predictions.length;

    // Sum user tokens
    const totalActiveTokens = users.reduce((sum, u) => sum + (u.tokens || 0), 0);

    // Filter match status
    const completedMatches = matches.filter(m => m.status === 'completed').length;
    const upcomingMatches = matches.filter(m => m.status === 'upcoming').length;
    const liveMatches = matches.filter(m => m.status === 'live').length;

    // Platform accuracy
    let sumAcc = 0;
    let usersWithPredictions = 0;
    users.forEach(u => {
      if (u.predictionsCount > 0) {
        sumAcc += (u.correctPredictions / u.predictionsCount) * 100;
        usersWithPredictions++;
      }
    });
    const avgAccuracy = usersWithPredictions > 0 ? Math.round(sumAcc / usersWithPredictions) : 0;

    // Tokens distributed
    const totalDistributed = transactions
      .filter(tx => tx.amount > 0 && tx.type !== 'cheat')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Most predicted match
    const matchPredictionsCount = {};
    predictions.forEach(p => {
      matchPredictionsCount[p.matchId] = (matchPredictionsCount[p.matchId] || 0) + 1;
    });

    let mostPredictedMatch = null;
    let maxPreds = 0;
    
    for (const matchId in matchPredictionsCount) {
      if (matchPredictionsCount[matchId] > maxPreds) {
        maxPreds = matchPredictionsCount[matchId];
        const matchData = matches.find(m => m._id === matchId);
        if (matchData) {
          mostPredictedMatch = {
            id: matchId,
            homeTeam: matchData.homeTeam,
            awayTeam: matchData.awayTeam,
            count: maxPreds
          };
        }
      }
    }

    res.json({
      totalUsers,
      totalPredictions,
      totalActiveTokens,
      avgAccuracy,
      matchCounts: {
        completed: completedMatches,
        upcoming: upcomingMatches,
        live: liveMatches,
        total: matches.length
      },
      totalDistributed,
      mostPredictedMatch
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
};
