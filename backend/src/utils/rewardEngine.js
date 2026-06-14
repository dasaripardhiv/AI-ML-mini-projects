import { db } from '../config/db.js';

// Define standard achievements
export const ACHIEVEMENTS = [
  { id: 'first_prediction', name: 'First Prediction', description: 'Submit your first prediction', reward: 10 },
  { id: 'first_win', name: 'First Win', description: 'Predict a match outcome correctly', reward: 20 },
  { id: 'streak_starter', name: 'Streak Starter', description: 'Achieve a 3-match win streak', reward: 30 },
  { id: 'five_win_streak', name: 'Five Win Streak', description: 'Achieve a 5-match win streak', reward: 100 },
  { id: 'prediction_master', name: 'Prediction Master', description: 'Predict 10 matches correctly', reward: 200 },
  { id: 'underdog_hero', name: 'Underdog Hero', description: 'Correctly predict an outcome with under 30% AI probability', reward: 50 },
  { id: 'score_master', name: 'Score Master', description: 'Correctly predict the exact match score', reward: 100 },
  { id: 'champion_status', name: 'Champion Status', description: 'Accumulate 30,000 Fan Tokens', reward: 500 }
];

export const processMatchPredictions = async (matchId, homeScore, awayScore) => {
  // 1. Fetch match
  const match = await db.findById('Match', matchId);
  if (!match) {
    throw new Error('Match not found');
  }

  // Determine actual result
  let actualResult = 'Draw';
  if (homeScore > awayScore) {
    actualResult = 'Home';
  } else if (awayScore > homeScore) {
    actualResult = 'Away';
  }

  // 2. Fetch all predictions for this match
  const predictions = await db.find('Prediction', { matchId, isResolved: false });
  const resultsSummary = [];

  for (const pred of predictions) {
    const user = await db.findById('User', pred.userId);
    if (!user) continue;

    let isCorrect = false;
    let rewardTokens = 0;
    let isExactScoreCorrect = false;

    // Check winner prediction
    const predictedWinnerMatches = pred.predictedOutcome === actualResult;

    if (pred.type === 'Winner') {
      isCorrect = predictedWinnerMatches;
    } else if (pred.type === 'ExactScore') {
      isExactScoreCorrect = (
        pred.predictedHomeScore === homeScore &&
        pred.predictedAwayScore === awayScore
      );
      isCorrect = isExactScoreCorrect;
    }

    // Determine multiplier
    let oddsMultiplier = 2.0;
    if (actualResult === 'Home') oddsMultiplier = match.oddsHome;
    else if (actualResult === 'Away') oddsMultiplier = match.oddsAway;
    else oddsMultiplier = match.oddsDraw;

    if (isCorrect) {
      if (pred.type === 'Winner') {
        rewardTokens = Math.round(pred.tokensAllocated * oddsMultiplier);
      } else {
        // Exact score is harder, give 2.5x multiplier on odds
        rewardTokens = Math.round(pred.tokensAllocated * oddsMultiplier * 2.5);
      }
    }

    // Update prediction
    await db.updateOne('Prediction', { _id: pred._id }, {
      $set: {
        isResolved: true,
        isCorrect,
        rewardTokens
      }
    });

    // Update user stats
    const newPredictionsCount = (user.predictionsCount || 0) + 1;
    const newCorrectCount = (user.correctPredictions || 0) + (isCorrect ? 1 : 0);
    const newStreak = isCorrect ? (user.winStreak || 0) + 1 : 0;
    let tokenBalanceChange = rewardTokens;

    // Log prediction win transaction
    if (rewardTokens > 0) {
      await db.insertOne('Transaction', {
        userId: user._id,
        amount: rewardTokens,
        type: 'prediction_win',
        description: `Won prediction on ${match.homeTeam} vs ${match.awayTeam}`
      });
    }

    // Check for streak bonuses directly credited
    let streakBonus = 0;
    if (newStreak === 3) {
      streakBonus = 50;
    } else if (newStreak === 5) {
      streakBonus = 150;
    } else if (newStreak === 10) {
      streakBonus = 500;
    }

    if (streakBonus > 0) {
      tokenBalanceChange += streakBonus;
      await db.insertOne('Transaction', {
        userId: user._id,
        amount: streakBonus,
        type: 'streak_bonus',
        description: `${newStreak} Win Streak Bonus!`
      });
    }

    // Create updated user representation
    let updatedTokens = (user.tokens || 0) + tokenBalanceChange;
    let newlyUnlocked = [];

    // Check achievements
    const currentUnlocked = user.unlockedAchievements || [];

    // 1. First Prediction
    if (newPredictionsCount >= 1 && !currentUnlocked.includes('first_prediction')) {
      newlyUnlocked.push('first_prediction');
    }
    // 2. First Win
    if (isCorrect && !currentUnlocked.includes('first_win')) {
      newlyUnlocked.push('first_win');
    }
    // 3. Streak Starter (3 wins)
    if (newStreak >= 3 && !currentUnlocked.includes('streak_starter')) {
      newlyUnlocked.push('streak_starter');
    }
    // 4. Five Win Streak
    if (newStreak >= 5 && !currentUnlocked.includes('five_win_streak')) {
      newlyUnlocked.push('five_win_streak');
    }
    // 5. Prediction Master (10 correct)
    if (newCorrectCount >= 10 && !currentUnlocked.includes('prediction_master')) {
      newlyUnlocked.push('prediction_master');
    }
    // 6. Score Master (Exact score correct)
    if (isExactScoreCorrect && !currentUnlocked.includes('score_master')) {
      newlyUnlocked.push('score_master');
    }
    // 7. Underdog Hero
    if (isCorrect) {
      const predictedProb = actualResult === 'Home' ? match.aiInsights?.winProbabilities?.home :
                            actualResult === 'Away' ? match.aiInsights?.winProbabilities?.away :
                            match.aiInsights?.winProbabilities?.draw;
      if (predictedProb && predictedProb < 30 && !currentUnlocked.includes('underdog_hero')) {
        newlyUnlocked.push('underdog_hero');
      }
    }
    // 8. Champion Status
    if (updatedTokens >= 30000 && !currentUnlocked.includes('champion_status')) {
      newlyUnlocked.push('champion_status');
    }

    // Process unlocked achievements
    let achievementRewardTokens = 0;
    const finalUnlocked = [...currentUnlocked];

    for (const achId of newlyUnlocked) {
      finalUnlocked.push(achId);
      const ach = ACHIEVEMENTS.find(a => a.id === achId);
      if (ach) {
        achievementRewardTokens += ach.reward;
        await db.insertOne('Transaction', {
          userId: user._id,
          amount: ach.reward,
          type: 'achievement_unlock',
          description: `Unlocked achievement: ${ach.name}`
        });
      }
    }

    updatedTokens += achievementRewardTokens;
    const isChampion = updatedTokens >= 30000;

    // Save user updates
    await db.updateOne('User', { _id: user._id }, {
      $set: {
        tokens: updatedTokens,
        predictionsCount: newPredictionsCount,
        correctPredictions: newCorrectCount,
        winStreak: newStreak,
        unlockedAchievements: finalUnlocked,
        isChampion
      }
    });

    resultsSummary.push({
      userId: user._id,
      username: user.username,
      isCorrect,
      tokensWon: rewardTokens,
      streakBonus,
      newStreak,
      unlockedAchievements: newlyUnlocked
    });
  }

  return resultsSummary;
};
