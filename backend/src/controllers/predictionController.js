import { db } from '../config/db.js';

export const submitPrediction = async (req, res) => {
  try {
    const { matchId, type, predictedOutcome, predictedHomeScore, predictedAwayScore, tokensAllocated } = req.body;
    const userId = req.user.id;

    if (!matchId || !tokensAllocated) {
      return res.status(400).json({ message: 'Match ID and token allocation are required' });
    }

    const stake = parseInt(tokensAllocated);
    if (isNaN(stake) || stake <= 0) {
      return res.status(400).json({ message: 'Token allocation must be a positive number' });
    }

    // 1. Fetch match and check kickoff time
    const match = await db.findById('Match', matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'upcoming') {
      return res.status(400).json({ message: 'Match has already started or completed' });
    }

    if (new Date(match.kickoffTime) < new Date()) {
      return res.status(400).json({ message: 'Cannot place predictions after kickoff time' });
    }

    // 2. Fetch user and check token balance
    const user = await db.findById('User', userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.tokens < stake) {
      return res.status(400).json({ message: `Insufficient token balance. You have ${user.tokens} tokens.` });
    }

    // 3. Check if user already predicted this match
    const existingPred = await db.findOne('Prediction', { userId, matchId });
    if (existingPred) {
      return res.status(400).json({ message: 'You have already placed a prediction on this match' });
    }

    // 4. Create prediction record
    const newPred = await db.insertOne('Prediction', {
      userId,
      matchId,
      type: type || 'Winner',
      predictedOutcome,
      predictedHomeScore: type === 'ExactScore' ? parseInt(predictedHomeScore) : null,
      predictedAwayScore: type === 'ExactScore' ? parseInt(predictedAwayScore) : null,
      tokensAllocated: stake,
      isResolved: false,
      isCorrect: false,
      rewardTokens: 0
    });

    // 5. Deduct tokens and record transaction
    const updatedUser = await db.updateOne('User', { _id: userId }, {
      $inc: { tokens: -stake }
    });

    await db.insertOne('Transaction', {
      userId,
      amount: -stake,
      type: 'prediction_stake',
      description: `Stake on ${match.homeTeam} vs ${match.awayTeam}`
    });

    // Fetch refreshed transactions list
    const transactions = await db.find('Transaction', { userId });
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(201).json({
      prediction: newPred,
      user: {
        ...updatedUser,
        transactions
      }
    });
  } catch (error) {
    console.error('Error submitting prediction:', error);
    res.status(500).json({ message: 'Server error placing prediction' });
  }
};

export const getUserPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const predictions = await db.find('Prediction', { userId });

    // Populate predictions with match information
    const populated = [];
    for (const pred of predictions) {
      const match = await db.findById('Match', pred.matchId);
      populated.push({
        ...pred,
        match: match ? {
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          kickoffTime: match.kickoffTime,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          result: match.result,
          oddsHome: match.oddsHome,
          oddsAway: match.oddsAway,
          oddsDraw: match.oddsDraw
        } : null
      });
    }

    // Sort: unresolved/upcoming first, then completed descending by date
    populated.sort((a, b) => {
      if (a.isResolved !== b.isResolved) {
        return a.isResolved ? 1 : -1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json(populated);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({ message: 'Server error retrieving predictions' });
  }
};
