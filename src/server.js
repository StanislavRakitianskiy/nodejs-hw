import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB before starting server
await connectMongoDB();

// Middleware
app.use(logger);
app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(cookieParser());

// Routes
app.use(authRoutes);
app.use(notesRoutes);

// 404 middleware
app.use(notFoundHandler);

// Celebrate validation errors
app.use(errors());

// Error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


