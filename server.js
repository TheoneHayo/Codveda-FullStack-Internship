const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/users', userRoutes);
app.use('/auth', authRoutes);

// Global Error Handler (MUST be after routes)
app.use((err, req, res, next) => {

  // Duplicate email error
  if (err.code === 11000) {
    return res.status(400).json({
      message: "Email already exists"
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format"
    });
  }

  res.status(500).json({
    message: "Server Error",
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
