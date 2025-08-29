const express = require('express');
const app = express();

console.log('Express version:', require('express/package.json').version);

try {
  const authRoutes = require('./src/server/routes/auth.routes').default;
  console.log('Auth routes loaded successfully');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes mounted successfully');
} catch (error) {
  console.error('Error loading auth routes:', error.message);
  console.error('Stack:', error.stack);
}

console.log('Test completed');