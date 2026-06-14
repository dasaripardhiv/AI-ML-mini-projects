import { db } from '../config/db.js';

export const seedMatches = async () => {
  try {
    const existingMatches = await db.find('Match');
    if (existingMatches.length > 0) {
      console.log('ℹ️ Match collection already seeded. Skipping.');
      return;
    }

    const now = new Date();

    const matchesToSeed = [
      {
        homeTeam: 'Real Madrid',
        awayTeam: 'Manchester City',
        kickoffTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
        result: null,
        oddsHome: 2.4,
        oddsAway: 2.6,
        oddsDraw: 3.1,
        aiInsights: {
          winProbabilities: { home: 42, away: 38, draw: 20 },
          confidence: 'Medium',
          analysis: 'A highly technical battle. Real Madrid has a formidable Champions League home record, while City dominates possession. Both teams have key defenders returning.',
          upsetAlert: false
        }
      },
      {
        homeTeam: 'France',
        awayTeam: 'England',
        kickoffTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
        result: null,
        oddsHome: 2.1,
        oddsAway: 2.9,
        oddsDraw: 3.0,
        aiInsights: {
          winProbabilities: { home: 48, away: 32, draw: 20 },
          confidence: 'High',
          analysis: 'France enters with a fully fit Mbappe and Griezmann. England has minor defensive fatigue but their attacking line is world-class. France should control transition play.',
          upsetAlert: false
        }
      },
      {
        homeTeam: 'Argentina',
        awayTeam: 'Brazil',
        kickoffTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
        result: null,
        oddsHome: 2.2,
        oddsAway: 2.8,
        oddsDraw: 3.2,
        aiInsights: {
          winProbabilities: { home: 45, away: 35, draw: 20 },
          confidence: 'Medium',
          analysis: 'The ultimate South American derby. Argentina is on a solid defensive run, whereas Brazil is transitioning. Expect a physical match with fewer than 2.5 total goals.',
          upsetAlert: true
        }
      },
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        kickoffTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        status: 'upcoming',
        homeScore: 0,
        awayScore: 0,
        result: null,
        oddsHome: 1.8,
        oddsAway: 3.6,
        oddsDraw: 3.4,
        aiInsights: {
          winProbabilities: { home: 55, away: 22, draw: 23 },
          confidence: 'High',
          analysis: 'Arsenal is chasing the title and playing at the Emirates. Chelsea has shown sparks of brilliant form but remains fragile defensively on the road.',
          upsetAlert: false
        }
      },
      {
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester United',
        kickoffTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // Started 1 hour ago
        status: 'live',
        homeScore: 2,
        awayScore: 1,
        result: null,
        oddsHome: 1.7,
        oddsAway: 3.8,
        oddsDraw: 3.5,
        aiInsights: {
          winProbabilities: { home: 58, away: 20, draw: 22 },
          confidence: 'Medium',
          analysis: 'Live match! Liverpool dominated the first half, scoring two early goals. United responded with a clinical counter-attack in the 55th minute. A high-intensity finish expected.',
          upsetAlert: false
        }
      },
      {
        homeTeam: 'Barcelona',
        awayTeam: 'Bayern Munich',
        kickoffTime: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // Played 25 hours ago
        status: 'completed',
        homeScore: 1,
        awayScore: 3,
        result: 'Away',
        oddsHome: 2.5,
        oddsAway: 2.3,
        oddsDraw: 3.3,
        aiInsights: {
          winProbabilities: { home: 38, away: 42, draw: 20 },
          confidence: 'Medium',
          analysis: 'Completed Match. Bayern Munich proved to be highly efficient in front of goal, exploiting space behind Barcelonas high line for a comfortable 3-1 away win.',
          upsetAlert: false
        }
      }
    ];

    for (const match of matchesToSeed) {
      await db.insertOne('Match', match);
    }
    console.log('✅ Successfully seeded matches database!');
  } catch (error) {
    console.error('❌ Error seeding matches:', error);
  }
};
