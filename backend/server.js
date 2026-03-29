require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/authRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const aidRoutes = require('./routes/aidRoutes');
const auditRoutes = require('./routes/auditRoutes'); // Will make this for dashboard
const User = require('./models/User');
const { authenticate } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/beneficiary', authenticate, beneficiaryRoutes);
app.use('/api/aid', authenticate, aidRoutes);
app.use('/api/audit', authenticate, auditRoutes);

// Create default users if they don't exist
async function seedUsers() {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const hashedAdmin = await bcrypt.hash('admin123', 10);
        await User.create({ username: 'admin', password: hashedAdmin, role: 'Admin' });
        console.log('Seeded default Admin account (admin / admin123)');
    }
    
    const workerExists = await User.findOne({ username: 'worker' });
    if (!workerExists) {
        const hashedWorker = await bcrypt.hash('worker123', 10);
        await User.create({ username: 'worker', password: hashedWorker, role: 'Field Worker' });
        console.log('Seeded default Worker account (worker / worker123)');
    }
}

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/disaster-relief';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully.');
    await seedUsers();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });
