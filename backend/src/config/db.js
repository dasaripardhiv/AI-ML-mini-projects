import mongoose from 'mongoose';
import { dbFallback } from '../utils/dbFallback.js';
import dotenv from 'dotenv';

dotenv.config();

let useMongoose = false;

// Mongoose Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'avatar1' },
  tokens: { type: Number, default: 50 },
  predictionsCount: { type: Number, default: 0 },
  correctPredictions: { type: Number, default: 0 },
  winStreak: { type: Number, default: 0 },
  unlockedAchievements: { type: [String], default: [] },
  isChampion: { type: Boolean, default: false }
}, { timestamps: true });

const MatchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  kickoffTime: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  result: { type: String, enum: ['Home', 'Away', 'Draw', null], default: null },
  oddsHome: { type: Number, default: 2.0 },
  oddsAway: { type: Number, default: 2.0 },
  oddsDraw: { type: Number, default: 3.0 },
  aiInsights: {
    winProbabilities: {
      home: { type: Number, default: 45 },
      away: { type: Number, default: 35 },
      draw: { type: Number, default: 20 }
    },
    confidence: { type: String, default: 'Medium' },
    analysis: { type: String, default: 'No analysis available.' },
    upsetAlert: { type: Boolean, default: false }
  }
}, { timestamps: true });

const PredictionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  matchId: { type: String, required: true },
  type: { type: String, enum: ['Winner', 'ExactScore'], default: 'Winner' },
  predictedOutcome: { type: String, enum: ['Home', 'Away', 'Draw'] },
  predictedHomeScore: { type: Number },
  predictedAwayScore: { type: Number },
  tokensAllocated: { type: Number, required: true },
  isResolved: { type: Boolean, default: false },
  isCorrect: { type: Boolean, default: false },
  rewardTokens: { type: Number, default: 0 }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // welcome, prediction_stake, prediction_win, daily_faucet, cheat
  timestamp: { type: Date, default: Date.now }
});

const Models = {};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('⚠️ MONGODB_URI is not defined in .env. Falling back to Local JSON Database.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    useMongoose = true;
    
    Models.User = mongoose.model('User', UserSchema);
    Models.Match = mongoose.model('Match', MatchSchema);
    Models.Prediction = mongoose.model('Prediction', PredictionSchema);
    Models.Transaction = mongoose.model('Transaction', TransactionSchema);
  } catch (error) {
    console.error('❌ MongoDB connection failed. Falling back to Local JSON Database:', error.message);
  }
};

// Initialize connection
await connectDB();

const getCollectionName = (modelName) => {
  if (modelName === 'User') return 'users';
  if (modelName === 'Match') return 'matches';
  if (modelName === 'Prediction') return 'predictions';
  if (modelName === 'Transaction') return 'transactions';
  return modelName.toLowerCase() + 's';
};

export const db = {
  find: async (modelName, query = {}) => {
    if (useMongoose) {
      return await Models[modelName].find(query).lean();
    }
    return dbFallback.find(getCollectionName(modelName), query);
  },

  findOne: async (modelName, query = {}) => {
    if (useMongoose) {
      return await Models[modelName].findOne(query).lean();
    }
    return dbFallback.findOne(getCollectionName(modelName), query);
  },

  findById: async (modelName, id) => {
    if (useMongoose) {
      try {
        return await Models[modelName].findById(id).lean();
      } catch (err) {
        return null;
      }
    }
    return dbFallback.findById(getCollectionName(modelName), id);
  },

  insertOne: async (modelName, doc) => {
    if (useMongoose) {
      const newDoc = new Models[modelName](doc);
      const saved = await newDoc.save();
      return saved.toObject();
    }
    return dbFallback.insertOne(getCollectionName(modelName), doc);
  },

  updateOne: async (modelName, query, update) => {
    if (useMongoose) {
      return await Models[modelName].findOneAndUpdate(query, update, { new: true }).lean();
    }
    return dbFallback.updateOne(getCollectionName(modelName), query, update);
  },

  updateMany: async (modelName, query, update) => {
    if (useMongoose) {
      return await Models[modelName].updateMany(query, update);
    }
    return dbFallback.updateMany(getCollectionName(modelName), query, update);
  },

  deleteOne: async (modelName, query) => {
    if (useMongoose) {
      return await Models[modelName].deleteOne(query);
    }
    return dbFallback.deleteOne(getCollectionName(modelName), query);
  }
};
