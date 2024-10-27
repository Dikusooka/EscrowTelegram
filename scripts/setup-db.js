require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user');

async function setupDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    
    // Create admin user
    await User.findOneAndUpdate(
      { telegramId: process.env.ADMIN_ID },
      { 
        isAdmin: true,
        username: 'admin'
      },
      { upsert: true }
    );
    
    console.log('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
