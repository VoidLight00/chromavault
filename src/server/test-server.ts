/**
 * Minimal test server to isolate compatibility issues
 */

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'ChromaVault API is running'
  });
});

app.get('/test/:id', (req, res) => {
  res.json({ 
    success: true,
    id: req.params.id,
    message: 'Route parameter test successful'
  });
});

// Simple auth test route
app.post('/test/auth', (req, res) => {
  res.json({
    success: true,
    body: req.body,
    message: 'Auth test route working'
  });
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Test server running on port ${PORT}`);
  console.log(`Test endpoints:
  - GET  http://localhost:${PORT}/health
  - GET  http://localhost:${PORT}/test/123
  - POST http://localhost:${PORT}/test/auth`);
});

export default app;