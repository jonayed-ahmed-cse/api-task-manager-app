const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../routes/authRoutes');
const taskRoutes = require('../routes/taskRoutes');

const app = express();

app.use(cors());
//app.use(express.json());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/v1', authRoutes);
app.use('/api/v1', taskRoutes);

app.get('/', (req, res) => {
  res.send('Task Manager API is running');
});

const PORT = process.env.PORT || 5000;


console.log('MONGO_URI length:', process.env.MONGO_URI ? process.env.MONGO_URI.length : 'UNDEFINED');
console.log('MONGO_URI starts:', JSON.stringify(process.env.MONGO_URI?.slice(0, 15)));
console.log('MONGO_URI ends:', JSON.stringify(process.env.MONGO_URI?.slice(-15)));
console.log('EMAIL_USER set:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS set:', !!process.env.EMAIL_PASS);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });

module.exports = app;