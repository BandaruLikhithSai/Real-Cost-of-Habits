import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import routes from './routes/index.js';
import { errorHandler } from './middleware/index.js';

let cachedConnection = null;
export async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }
  cachedConnection = await mongoose.connect(process.env.MONGODB_URI);
  return cachedConnection;
}

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN;
app.use(cors({
  origin: clientOrigin ? [clientOrigin, 'http://localhost:5173'] : true,
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Serverless DB connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: { code: 'db_error', message: 'Failed to connect to database' } });
  }
});

app.use('/api', routes);
app.use((_q, s) => s.status(404).json({ error: { code: 'not_found', message: 'Not found' } }));
app.use(errorHandler);

export default app;
