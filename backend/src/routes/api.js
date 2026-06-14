import express from 'express';
import { register, login, getProfile, googleLogin, devSandboxClaim } from '../controllers/authController.js';
import { getMatches, getMatchById, createMatch, updateMatch } from '../controllers/matchController.js';
import { submitPrediction, getUserPredictions } from '../controllers/predictionController.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { resolveMatch, getSystemStats } from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Auth Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/profile', authMiddleware, getProfile);
router.post('/auth/sandbox', authMiddleware, devSandboxClaim);

// Match Routes
router.get('/matches', getMatches);
router.get('/matches/:id', getMatchById);
router.post('/matches', adminMiddleware, createMatch);
router.put('/matches/:id', adminMiddleware, updateMatch);

// Prediction Routes
router.post('/predictions', authMiddleware, submitPrediction);
router.get('/predictions/my', authMiddleware, getUserPredictions);

// Leaderboard Routes
router.get('/leaderboard', getLeaderboard);

// Admin Routes
router.post('/admin/resolve/:matchId', adminMiddleware, resolveMatch);
router.get('/admin/stats', adminMiddleware, getSystemStats);

export default router;
