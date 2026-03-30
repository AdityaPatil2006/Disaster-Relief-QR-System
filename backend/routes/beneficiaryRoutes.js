const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Beneficiary = require('../models/Beneficiary');

const router = express.Router();

// 1. POST /api/beneficiary/register
// Add new beneficiary, prevent duplicate, generate QR
router.post('/register', async (req, res) => {
  try {
    const { name, age, address, phone, priority, facePhoto } = req.body;

    // Check for existing duplicate (handled partly by DB index, but good to check explicitly)
    const existing = await Beneficiary.findOne({ name, phone });
    if (existing) {
      return res.status(400).json({ error: 'A beneficiary with this name and phone already exists.' });
    }

    // Generate unique QR ID (Using crypto UUID)
    const qrId = crypto.randomUUID();

    // Create the beneficiary
    const newBeneficiary = new Beneficiary({
      name,
      age,
      address,
      phone,
      qrId,
      facePhoto,
      priority: priority || 'Medium'
    });

    await newBeneficiary.save();

    // Generate QR Code as base64 data URI
    const qrCodeDataUri = await QRCode.toDataURL(qrId);

    res.status(201).json({
      message: 'Beneficiary registered successfully',
      beneficiary: newBeneficiary,
      qrCode: qrCodeDataUri
    });

  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ error: 'A beneficiary with this name and phone already exists.' });
    }
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. GET /api/beneficiary/list
// Return all beneficiaries
router.get('/list', async (req, res) => {
  try {
    // Optionally allow search/filter via query params
    const { search, priority } = req.query;
    let query = {};
    
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { qrId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const beneficiaries = await Beneficiary.find(query).sort({ createdAt: -1 });
    res.json(beneficiaries);
  } catch (error) {
    console.error('List Error:', error);
    res.status(500).json({ error: 'Failed to fetch beneficiaries.' });
  }
});

// 3. GET /api/beneficiary/:qrId
// Get beneficiary by QR ID
router.get('/:qrId', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({ qrId: req.params.qrId });
    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found.' });
    }
    res.json(beneficiary);
  } catch (error) {
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch beneficiary details.' });
  }
});

// Get Dashboard Stats
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalBeneficiaries = await Beneficiary.countDocuments();
    res.json({ totalBeneficiaries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// PUT /api/beneficiary/:qrId (Edit)
router.put('/:qrId', async (req, res) => {
  try {
    const { name, age, address, phone, priority, facePhoto } = req.body;
    const beneficiary = await Beneficiary.findOneAndUpdate(
      { qrId: req.params.qrId },
      { name, age, address, phone, priority, facePhoto },
      { new: true }
    );
    if (!beneficiary) return res.status(404).json({ error: 'Beneficiary not found.' });
    res.json({ message: 'Beneficiary updated successfully', beneficiary });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ error: 'Duplicate name/phone exists.' });
    res.status(500).json({ error: 'Failed to update.' });
  }
});

// DELETE /api/beneficiary/:qrId (Delete)
router.delete('/:qrId', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOneAndDelete({ qrId: req.params.qrId });
    if (!beneficiary) return res.status(404).json({ error: 'Beneficiary not found.' });
    res.json({ message: 'Beneficiary deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete.' });
  }
});

// GET /api/beneficiary/:qrId/timeline
router.get('/:qrId/timeline', async (req, res) => {
  try {
     const AidRecord = require('../models/AidRecord');
     const AuditLog = require('../models/AuditLog');
     const aidRecords = await AidRecord.find({ beneficiaryQR: req.params.qrId }).sort({ timestamp: -1 });
     const auditLogs = await AuditLog.find({ beneficiaryQR: req.params.qrId }).sort({ timestamp: -1 });
     
     const timeline = [
        ...aidRecords.map(a => ({ type: 'Distribution', items: a.itemsDistributed.join(', '), region: a.region, time: a.timestamp })),
        ...auditLogs.map(a => ({ type: 'Security Block', action: a.action, message: a.message, time: a.timestamp }))
     ].sort((a,b) => new Date(b.time) - new Date(a.time));

     res.json(timeline);
  } catch (error) {
     res.status(500).json({ error: 'Failed to fetch timeline.' });
  }
});

module.exports = router;
