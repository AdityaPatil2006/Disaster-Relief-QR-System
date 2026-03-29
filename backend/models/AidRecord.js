const mongoose = require('mongoose');

const aidRecordSchema = new mongoose.Schema({
  beneficiaryQR: { type: String, required: true },
  itemsDistributed: [{ type: String }],
  region: { type: String, default: 'General' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AidRecord', aidRecordSchema);
