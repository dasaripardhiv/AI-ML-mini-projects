import { db } from '../config/db.js';

// Auto-generator for AI Insights
const generateAiInsights = (homeTeam, awayTeam, oddsHome, oddsAway) => {
  // Determine win probabilities based on odds (rough inverse relationship)
  const rawHome = 1 / oddsHome;
  const rawAway = 1 / oddsAway;
  const rawDraw = 1 / 3.0; // Draw odds average 3.0
  const sum = rawHome + rawAway + rawDraw;

  const homePct = Math.round((rawHome / sum) * 100);
  const awayPct = Math.round((rawAway / sum) * 100);
  const drawPct = 100 - homePct - awayPct;

  // Analysis templates
  const analysisTemplates = [
    `${homeTeam} has been dominant at home, scoring 2.4 goals per match. However, ${awayTeam} possesses a compact counter-attacking structure that could exploit gaps.`,
    `Recent head-to-head records favor ${homeTeam} slightly. Key midfield battles will dictate the tempo. ${awayTeam} relies heavily on set-pieces.`,
    `A high-stakes clash! ${awayTeam} is on a 4-match win streak, while ${homeTeam} is recovering from key injuries. Expect a high-intensity match with plenty of transitional play.`
  ];

  const randomIndex = Math.floor(Math.random() * analysisTemplates.length);
  const analysis = analysisTemplates[randomIndex];

  const confidence = Math.abs(homePct - awayPct) > 25 ? 'High' : (Math.abs(homePct - awayPct) > 10 ? 'Medium' : 'Low');
  const upsetAlert = (homePct > awayPct && oddsAway < 3.2) || (awayPct > homePct && oddsHome < 3.2);

  return {
    winProbabilities: {
      home: homePct,
      away: awayPct,
      draw: drawPct
    },
    confidence,
    analysis,
    upsetAlert
  };
};

export const getMatches = async (req, res) => {
  try {
    const matches = await db.find('Match');
    // Sort matches by kickoff time descending
    matches.sort((a, b) => new Date(a.kickoffTime) - new Date(b.kickoffTime));
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ message: 'Server error fetching matches' });
  }
};

export const getMatchById = async (req, res) => {
  try {
    const match = await db.findById('Match', req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Server error fetching match details' });
  }
};

export const createMatch = async (req, res) => {
  try {
    const { homeTeam, awayTeam, kickoffTime, oddsHome, oddsAway, oddsDraw } = req.body;

    if (!homeTeam || !awayTeam || !kickoffTime) {
      return res.status(400).json({ message: 'Home team, away team, and kickoff time are required' });
    }

    const oHome = parseFloat(oddsHome) || 2.0;
    const oAway = parseFloat(oddsAway) || 2.0;
    const oDraw = parseFloat(oddsDraw) || 3.0;

    const aiInsights = generateAiInsights(homeTeam, awayTeam, oHome, oAway);

    const newMatch = await db.insertOne('Match', {
      homeTeam,
      awayTeam,
      kickoffTime: new Date(kickoffTime).toISOString(),
      status: 'upcoming',
      homeScore: 0,
      awayScore: 0,
      result: null,
      oddsHome: oHome,
      oddsAway: oAway,
      oddsDraw: oDraw,
      aiInsights
    });

    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Server error creating match' });
  }
};

export const updateMatch = async (req, res) => {
  try {
    const { homeScore, awayScore, status } = req.body;
    const match = await db.findById('Match', req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (homeScore !== undefined) updateFields.homeScore = parseInt(homeScore);
    if (awayScore !== undefined) updateFields.awayScore = parseInt(awayScore);

    // If status is updated to completed, result must be calculated, but normally resolved in adminController
    if (status === 'completed' && homeScore !== undefined && awayScore !== undefined) {
      let result = 'Draw';
      if (parseInt(homeScore) > parseInt(awayScore)) result = 'Home';
      else if (parseInt(awayScore) > parseInt(homeScore)) result = 'Away';
      updateFields.result = result;
    }

    const updatedMatch = await db.updateOne('Match', { _id: req.params.id }, { $set: updateFields });
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ message: 'Server error updating match' });
  }
};
