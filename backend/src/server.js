import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { seedMatches } from './utils/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For local development, allow requests from any host
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mount API routes
app.use('/api', apiRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'FIFA Predictor Arena API is running!' });
});

// Seed data and start server
const startServer = async () => {
  try {
    // Seed default matches if database is empty
    await seedMatches();
    
    app.listen(PORT, () => {
      console.log(`🚀 FIFA Predictor Arena Backend Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
