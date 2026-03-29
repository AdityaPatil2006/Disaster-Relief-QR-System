const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  qrId: { type: String, required: true, unique: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

// Composite index to prevent duplicates with same name AND phone
beneficiarySchema.index({ name: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
