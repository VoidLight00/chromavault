// Simple Express test without TypeScript and without logger
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3004;

// Basic middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Simple test server is running'
  });
});

app.get('/test/:id', (req, res) => {
  res.json({ 
    success: true,
    id: req.params.id,
    message: 'Route parameter test successful'
  });
});

// Complex route pattern test
app.get('/api/v1/palettes/:id/colors/:colorId', (req, res) => {
  res.json({
    success: true,
    paletteId: req.params.id,
    colorId: req.params.colorId,
    message: 'Complex route test successful'
  });
});

// Error handler
app.use((error, req, res, next) => {
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
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`Test endpoints:
  - GET  http://localhost:${PORT}/health
  - GET  http://localhost:${PORT}/test/123
  - GET  http://localhost:${PORT}/api/v1/palettes/abc-123/colors/def-456`);
});

module.exports = app;