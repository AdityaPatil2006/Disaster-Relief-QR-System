const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  beneficiaryQR: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'Duplicate Blocked'
  message: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
