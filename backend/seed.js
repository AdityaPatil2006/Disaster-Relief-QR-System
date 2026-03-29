const mongoose = require('mongoose');
require('dotenv').config();

const Beneficiary = require('./models/Beneficiary');
const AidRecord = require('./models/AidRecord');
const AuditLog = require('./models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/disaster-relief';

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const regions = ["North Zone", "South Sector", "Downtown Shelter", "East Camp", "West District", "Central Distribution"];
const priorities = ["High", "Medium", "Low"];
const aidTypes = ["Food Ration", "Drinking Water", "Medical Kit", "Blanket", "Baby Supplies", "Hygiene Kit", "Temporary Shelter"];

// Helper to get random array element
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to get random number in range
const getRandNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to generate a date from up to 7 days ago
const getRandomDatePast7Days = () => {
  const now = new Date();
  const pastDays = Math.random() * 7;
  now.setDate(now.getDate() - pastDays);
  return now;
};

async function seedData() {
  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    console.log("Wiping existing records...");
    await Beneficiary.deleteMany({});
    await AidRecord.deleteMany({});
    await AuditLog.deleteMany({});
    console.log("Collections wiped.");

    console.log("Generating 25 Beneficiaries...");
    const beneficiaries = [];
    for (let i = 0; i < 25; i++) {
        const name = `${getRandom(firstNames)} ${getRandom(lastNames)}`;
        const dateRegistered = getRandomDatePast7Days();
        const b = new Beneficiary({
            name: name,
            age: getRandNum(18, 85),
            address: `Block ${getRandNum(1, 100)}, ${getRandom(regions)}`,
            phone: `+1-555-${getRandNum(100, 999)}-${getRandNum(1000, 9999)}`,
            qrId: `BEN-${Date.now().toString(36).toUpperCase()}-${getRandNum(1000, 9999)}`,
            priority: getRandom(priorities),
            createdAt: dateRegistered
        });
        beneficiaries.push(b);
    }
    const savedBeneficiaries = await Beneficiary.insertMany(beneficiaries);
    console.log("Beneficiaries generated successfully!");

    console.log("Generating 60 Aid Records...");
    const aidRecords = [];
    for (let i = 0; i < 60; i++) {
        // Pick a completely random beneficiary who has already been registered
        const targetB = getRandom(savedBeneficiaries);
        
        // Random time that happened AFTER they were registered
        // If they registered today, the aid could be today.
        const start = targetB.createdAt.getTime();
        const end = Date.now();
        const aidTimestamp = new Date(start + Math.random() * (end - start));

        // Random list of items (1 to 3 items)
        const items = [];
        const numItems = getRandNum(1, 3);
        for(let j = 0; j < numItems; j++) {
            const item = getRandom(aidTypes);
            if (!items.includes(item)) items.push(item);
        }

        const a = new AidRecord({
            beneficiaryQR: targetB.qrId,
            itemsDistributed: items,
            region: getRandom(regions),
            timestamp: aidTimestamp
        });
        aidRecords.push(a);
    }
    await AidRecord.insertMany(aidRecords);
    console.log("Aid Records generated successfully!");

    console.log("Generating Audit Logs (Duplicate Scans)...");
    const auditLogs = [];
    for (let i = 0; i < 5; i++) {
        const start = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const end = Date.now();
        auditLogs.push(new AuditLog({
            action: 'Duplicate Aid Blocked',
            details: `QR ID ${getRandom(savedBeneficiaries).qrId} attempted back-to-back scan. Automatically blocked by system.`,
            timestamp: new Date(start + Math.random() * (end - start))
        }));
    }
    await AuditLog.insertMany(auditLogs);
    console.log("Audit Logs generated successfully!");

    console.log("Seeding complete! You may now exit this process.");
    process.exit(0);

  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
}

seedData();
