const express = require("express");
const AidRecord = require("../models/AidRecord");
const Beneficiary = require("../models/Beneficiary");
const AuditLog = require("../models/AuditLog");

const router = express.Router();

// 4. POST /api/aid/distribute
// Record aid given, prevent duplicate distribution (e.g., within 24 hours)
router.post("/distribute", async (req, res) => {
  try {
    const { qrId, items, region } = req.body;

    if (!qrId) {
      return res.status(400).json({ error: "QR ID is required." });
    }

    // Check if beneficiary exists
    const beneficiary = await Beneficiary.findOne({ qrId });
    if (!beneficiary) {
      return res
        .status(404)
        .json({ error: "Beneficiary not found for this QR ID." });
    }

    // Smart cooldown system (per aid type) --THIS IS THE MAIN PART USED TO HANDLE DUPLICATION OF RESOURCES
    const cooldownMap = {
      "Water Supplies": 2 * 60 * 60 * 1000, // 2 hours
      "Food Package": 6 * 60 * 60 * 1000, // 6 hours
      "Emergency Shelter": 24 * 60 * 60 * 1000, // 24 hours
      "Medical Kit": 12 * 60 * 60 * 1000, // 12 hours
      "Clothing": 24 * 60 * 60 * 1000, // 24 hours
      "Hygiene Kit": 24 * 60 * 60 * 1000, // 24 hours
    };

    const now = new Date();

    // Get all previous aid records for this beneficiary
    const previousAids = await AidRecord.find({
      beneficiaryQR: qrId,
    });

    // Check for cooldown violations
    let blockedItems = [];

    for (let item of items || []) {
      const cooldown = cooldownMap[item] || 6 * 60 * 60 * 1000; // default 6h

      // Find last time this item was given
      const lastRecord = previousAids
        .filter((aid) => aid.itemsDistributed.includes(item))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      if (lastRecord) {
        const timeDiff = now - new Date(lastRecord.timestamp);

        if (timeDiff < cooldown) {
          blockedItems.push(item);
        }
      }
    }

    // If any item is blocked
    if (blockedItems.length > 0) {
      await AuditLog.create({
        beneficiaryQR: qrId,
        action: "Duplicate Aid Blocked",
        message: `Blocked Items: ${blockedItems.join(", ")} for QR: ${qrId} in ${region || "Unknown Zone"}. System automatically enforced cooldown protocol.`,
      });

      return res.status(400).json({
        error: `These items are still under cooldown: ${blockedItems.join(", ")}`,
      });
    }

    // Create aid record
    const newAid = new AidRecord({
      beneficiaryQR: qrId,
      itemsDistributed: items || ["Food Package", "Water Supplies"], // Default items if none specified
      region: region || "General", // Provide default if not selected
    });

    await newAid.save();

    res.status(201).json({
      message: "Aid distributed successfully.",
      record: newAid,
    });
  } catch (error) {
    console.error("Distribution Error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while recording aid." });
  }
});

// Get aid stats
router.get("/stats", async (req, res) => {
  try {
    const totalAidDistributed = await AidRecord.countDocuments();
    res.json({ totalAidDistributed });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch aid stats" });
  }
});

module.exports = router;
