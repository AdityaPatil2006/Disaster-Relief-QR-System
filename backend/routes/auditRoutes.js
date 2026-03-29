const express = require("express");
const Beneficiary = require("../models/Beneficiary");
const AidRecord = require("../models/AidRecord");
const AuditLog = require("../models/AuditLog");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/audit/analytics
// Only accessible to Admin
router.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const totalBeneficiaries = await Beneficiary.countDocuments();
    const totalAidDistributed = await AidRecord.countDocuments();
    const duplicateAttempts = await AuditLog.countDocuments({
      action: "Duplicate Aid Blocked",
    });

    // Aggregate Region Distribution
    const regionData = await AidRecord.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
    ]);

    // Aggregate Aid Types
    const aidTypesDataRaw = await AidRecord.aggregate([
      { $unwind: "$itemsDistributed" },
      { $group: { _id: "$itemsDistributed", count: { $sum: 1 } } },
    ]);

    // Aggregate Daily Activity (Last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyAidRaw = await AidRecord.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyRegistrationsRaw = await Beneficiary.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Priority Distribution
    const priorityData = await Beneficiary.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Age Demographics
    const ageData = await Beneficiary.aggregate([
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 35, 50, 65, 100],
          default: "Unknown",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    // Activity Feed (Last 10 distributions)
    const recentActivityRaw = await AidRecord.find()
      .sort({ timestamp: -1 })
      .limit(10);

    const recentActivity = recentActivityRaw.map((a) => ({
      id: a._id,
      qrId: a.beneficiaryQR,
      items: a.itemsDistributed.join(", "),
      region: a.region,
      time: a.timestamp,
    }));

    res.json({
      totals: { totalBeneficiaries, totalAidDistributed, duplicateAttempts },
      charts: {
        regionData: regionData.map((r) => ({ label: r._id, value: r.count })),
        aidTypesData: aidTypesDataRaw.map((a) => ({
          label: a._id,
          value: a.count,
        })),
        dailyAid: dailyAidRaw.map((d) => ({ label: d._id, value: d.count })),
        dailyRegistrations: dailyRegistrationsRaw.map((d) => ({ label: d._id, value: d.count })),
        priorityData: priorityData.map((p) => ({
          label: p._id,
          value: p.count,
        })),
        ageData: ageData.map((a) => ({
          label:
            a._id === "Unknown"
              ? "Unknown"
              : a._id === 0
                ? "0-18"
                : a._id === 18
                  ? "19-35"
                  : a._id === 35
                    ? "36-50"
                    : a._id === 50
                      ? "51-65"
                      : "65+",
          value: a.count,
        })),
      },
      feed: recentActivity,
    });
  } catch (e) {
    console.error("Analytics Error:", e);
    require('fs').writeFileSync('analytics_error.log', String(e.stack));
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

const xlsx = require("xlsx");

// GET /api/audit/export/excel
// Only accessible to Admin
router.get("/export/excel", requireAdmin, async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find();
    const aidRecords = await AidRecord.find().sort({ timestamp: -1 });

    const benData = beneficiaries.map((b) => ({
      "System ID (QR)": b.qrId,
      "Full Name": b.name,
      Age: b.age,
      "Contact/Phone": b.phone,
      "Registered Address": b.address,
      "Priority Level": b.priority,
      "Registration Date": b.createdAt.toISOString().split("T")[0],
    }));

    const aidData = aidRecords.map((a) => ({
      "Beneficiary Target ID": a.beneficiaryQR,
      "Commodities Distributed": a.itemsDistributed.join(", "),
      "Deployment Zone": a.region,
      "Time Executed": a.timestamp
        .toISOString()
        .replace("T", " ")
        .split(".")[0],
    }));

    const wb = xlsx.utils.book_new();
    const wsBeneficiaries = xlsx.utils.json_to_sheet(
      benData.length > 0 ? benData : [{ Empty: "No Data" }],
    );
    const wsAid = xlsx.utils.json_to_sheet(
      aidData.length > 0 ? aidData : [{ Empty: "No Data" }],
    );

    xlsx.utils.book_append_sheet(wb, wsBeneficiaries, "Beneficiary Roster");
    xlsx.utils.book_append_sheet(wb, wsAid, "Dispatch History");

    const buf = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Smart_Relief_Full_Data.xlsx"',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buf);
  } catch (e) {
    console.error("Excel Export Error:", e);
    res.status(500).json({ error: "Excel File Generation Failed" });
  }
});

// GET /api/audit/export/csv
// Outstanding CSV Export containing both Beneficiary Details and Received Aids
router.get("/export/csv", requireAdmin, async (req, res) => {
  try {
    const pipeline = [
      {
        $lookup: {
          from: "aidrecords",
          localField: "qrId",
          foreignField: "beneficiaryQR",
          as: "aidHistory"
        }
      }
    ];
    
    const aggregatedData = await Beneficiary.aggregate(pipeline);
    
    let csvContent = "Name,Age,Phone,Address,Priority,QR_ID,Registered_Date,Total_Aids_Received,Aid_Items_List\n";
    
    aggregatedData.forEach((b) => {
      // Create a readable string of all aids
      const totalAids = b.aidHistory.length;
      let aidItemsList = "None";
      
      if (totalAids > 0) {
        aidItemsList = b.aidHistory
          .map(a => `${a.itemsDistributed.join('+')} (${a.region})`)
          .join(" | ")
          .replace(/"/g, '""'); // Escape inner quotes for CSV safety
      }
        
      csvContent += `"${b.name || ''}",${b.age || 0},"${b.phone || ''}","${(b.address || '').replace(/"/g, '""')}","${b.priority || ''}","${b.qrId}","${new Date(b.createdAt).toISOString().split('T')[0]}",${totalAids},"${aidItemsList}"\n`;
    });
    
    res.setHeader("Content-Disposition", 'attachment; filename="Beneficiaries_And_Aids.csv"');
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csvContent);
  } catch (e) {
    console.error("CSV Export Error:", e);
    res.status(500).json({ error: "CSV File Generation Failed" });
  }
});

module.exports = router;
