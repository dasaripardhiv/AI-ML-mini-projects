import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { ACHIEVEMENTS } from '../utils/rewardEngine.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fifa_predictor_secret_key';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const userExists = await db.findOne('User', { email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const usernameExists = await db.findOne('User', { username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Set role. Let's make the first user or 'admin@arena.com' an admin automatically!
    const role = email.toLowerCase() === 'admin@arena.com' ? 'admin' : 'user';

    // Create user
    const newUser = await db.insertOne('User', {
      username,
      email,
      password: hashedPassword,
      avatar: `avatar${Math.floor(Math.random() * 8) + 1}`,
      tokens: 50,
      predictionsCount: 0,
      correctPredictions: 0,
      winStreak: 0,
      unlockedAchievements: [],
      isChampion: false,
      role
    });

    // Record welcome transaction
    await db.insertOne('Transaction', {
      userId: newUser._id,
      amount: 50,
      type: 'welcome',
      description: 'Welcome Bonus'
    });

    const token = generateToken(newUser);

    // Remove password
    const { password: _, ...userProfile } = newUser;

    res.status(201).json({
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Find user
    const user = await db.findOne('User', { email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userProfile } = user;

    res.json({
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await db.findById('User', req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch transactions
    const transactions = await db.find('Transaction', { userId: user._id });
    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const { password: _, ...userProfile } = user;

    res.json({
      ...userProfile,
      transactions,
      achievementsList: ACHIEVEMENTS
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    let user = await db.findOne('User', { email });

    if (!user) {
      // Create user with dummy password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), salt);
      const role = email.toLowerCase() === 'admin@arena.com' ? 'admin' : 'user';

      user = await db.insertOne('User', {
        username: name || email.split('@')[0],
        email,
        password: hashedPassword,
        avatar: avatar || `avatar${Math.floor(Math.random() * 8) + 1}`,
        tokens: 50,
        predictionsCount: 0,
        correctPredictions: 0,
        winStreak: 0,
        unlockedAchievements: [],
        isChampion: false,
        role
      });

      // Record welcome transaction
      await db.insertOne('Transaction', {
        userId: user._id,
        amount: 50,
        type: 'welcome',
        description: 'Welcome Bonus (Google Login)'
      });
    }

    const token = generateToken(user);
    const { password: _, ...userProfile } = user;

    res.json({
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google Login' });
  }
};

export const devSandboxClaim = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await db.findById('User', req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addedAmount = parseInt(amount) || 1000;
    const newTokens = (user.tokens || 0) + addedAmount;
    const isChampion = newTokens >= 30000;

    // Check achievement unlock
    const currentUnlocked = user.unlockedAchievements || [];
    let newlyUnlocked = [];
    let achievementTokens = 0;

    if (isChampion && !currentUnlocked.includes('champion_status')) {
      newlyUnlocked.push('champion_status');
      const ach = ACHIEVEMENTS.find(a => a.id === 'champion_status');
      if (ach) {
        achievementTokens += ach.reward;
        await db.insertOne('Transaction', {
          userId: user._id,
          amount: ach.reward,
          type: 'achievement_unlock',
          description: 'Unlocked achievement: Champion Status'
        });
      }
    }

    const finalTokens = newTokens + achievementTokens;
    const finalUnlocked = [...currentUnlocked, ...newlyUnlocked];

    // Update tokens
    const updatedUser = await db.updateOne('User', { _id: user._id }, {
      $set: {
        tokens: finalTokens,
        isChampion: finalTokens >= 30000,
        unlockedAchievements: finalUnlocked
      }
    });

    // Record Sandbox transaction
    await db.insertOne('Transaction', {
      userId: user._id,
      amount: addedAmount,
      type: 'cheat',
      description: 'Developer Sandbox Token Faucet'
    });

    const transactions = await db.find('Transaction', { userId: user._id });
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const { password: _, ...userProfile } = updatedUser;

    res.json({
      ...userProfile,
      transactions,
      newlyUnlocked
    });
  } catch (error) {
    console.error('Dev sandbox claim error:', error);
    res.status(500).json({ message: 'Server error in Developer Sandbox' });
  }
};
