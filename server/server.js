const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');
const { initDatabaseSchema } = require('./database/schema');
const { seedDatabase } = require('./database/seed');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const partRoutes = require('./routes/parts');
const changeRequestRoutes = require('./routes/changeRequests');
const dashboardRoutes = require('./routes/dashboard');
const auditLogRoutes = require('./routes/auditLogs');

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/change-requests', changeRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Design Change Impact Predictor (PLM)', timestamp: new Date() });
});

// Initialize DB and launch server
async function startServer() {
  try {
    await initDatabaseSchema();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 PLM Impact Predictor Backend running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
