const mongoose = require('mongoose');

const BuildSchema = new mongoose.Schema({
  repoUrl: {
    type: String,
    required: true,
  },
  dockerfile: {
    type: String,
    required: true,
  },
  buildLogs: {
    type: String,
    required: true,
  },
  imageName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Build', BuildSchema);
