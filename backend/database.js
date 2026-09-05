const Database = require("better-sqlite3");
const { faker } = require('@faker-js/faker');
const { calculateRisk } = require('./riskEngine');

const db = new Database("riskos.db");

// Drop existing tables to start fresh
db.exec(`
  DROP TABLE IF EXISTS transactions;
  DROP TABLE IF EXISTS risk_signals;
  DROP TABLE IF EXISTS investigations;
  DROP TABLE IF EXISTS risk_events;
  DROP TABLE IF EXISTS customers;
  DROP TABLE IF EXISTS incidents;
  DROP TABLE IF EXISTS settings;
`);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT UNIQUE,
    customer_id TEXT,
    customer_name TEXT,
    amount REAL,
    payment_method TEXT,
    location TEXT,
    device_id TEXT,
    ip_address TEXT,
    account_age_days INTEGER,
    velocity_6min INTEGER,
    historical_chargebacks INTEGER,
    device_anomaly_flag INTEGER,
    location_anomaly_flag INTEGER,
    risk_score INTEGER,
    risk_level TEXT,
    status TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS risk_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT,
    signal_type TEXT,
    severity TEXT,
    score INTEGER,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE,
    customer_name TEXT,
    email TEXT,
    avg_tx_amount REAL,
    primary_device TEXT,
    home_location TEXT,
    preferred_method TEXT,
    typical_time TEXT,
    risk_tier TEXT,
    deviation_score INTEGER,
    total_transactions INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT UNIQUE,
    title TEXT,
    severity TEXT,
    status TEXT,
    affected_tx_count INTEGER,
    total_exposure REAL,
    vector TEXT,
    description TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS investigations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT,
    status TEXT,
    decision TEXT,
    notes TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE,
    setting_value TEXT
  );
`);

// Prepare insert statements
const insertTransaction = db.prepare(`
  INSERT INTO transactions 
  (transaction_id, customer_id, customer_name, amount, payment_method, location, device_id, ip_address, account_age_days, velocity_6min, historical_chargebacks, device_anomaly_flag, location_anomaly_flag, risk_score, risk_level, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSignal = db.prepare(`
  INSERT INTO risk_signals (transaction_id, signal_type, severity, score, explanation)
  VALUES (?, ?, ?, ?, ?)
`);

const insertCustomer = db.prepare(`
  INSERT INTO customers (customer_id, customer_name, email, avg_tx_amount, primary_device, home_location, preferred_method, typical_time, risk_tier, deviation_score, total_transactions, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertIncident = db.prepare(`
  INSERT INTO incidents (incident_id, title, severity, status, affected_tx_count, total_exposure, vector, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertInvestigation = db.prepare(`
  INSERT INTO investigations (transaction_id, status, decision, notes, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertSetting = db.prepare(`
  INSERT INTO settings (setting_key, setting_value)
  VALUES (?, ?)
`);

console.log("🌱 Seeding RISKOS database with consistent synthetic payment dataset...");

// 1. Generate 30 synthetic customer baselines
const customers = [];
const cities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
const paymentMethods = ['UPI', 'Credit Card', 'Net Banking', 'Debit Card', 'Wallet'];
const timesOfDay = ['Morning (09:00 - 12:00)', 'Afternoon (12:00 - 17:00)', 'Evening (17:00 - 22:00)', 'Night (22:00 - 04:00)'];

for (let i = 1; i <= 30; i++) {
  const custId = `CUST-${String(i).padStart(4, '0')}`;
  const name = faker.person.fullName();
  const email = name.toLowerCase().replace(/[^a-z]/g, '.') + '@example.com';
  const avgAmt = Math.floor(Math.random() * 25000) + 2000;
  const primaryDev = `DEV-${String(i).padStart(3, '0')}`;
  const homeLoc = cities[i % cities.length];
  const prefMethod = paymentMethods[i % paymentMethods.length];
  const typTime = timesOfDay[i % timesOfDay.length];
  const riskTier = i % 5 === 0 ? 'HIGH' : i % 3 === 0 ? 'MEDIUM' : 'LOW';
  const devScore = i % 5 === 0 ? Math.floor(Math.random() * 45) + 40 : Math.floor(Math.random() * 20) + 5;

  customers.push({
    customer_id: custId,
    customer_name: name,
    email,
    avg_tx_amount: avgAmt,
    primary_device: primaryDev,
    home_location: homeLoc,
    preferred_method: prefMethod,
    typical_time: typTime,
    risk_tier: riskTier,
    deviation_score: devScore,
  });

  insertCustomer.run(
    custId,
    name,
    email,
    avgAmt,
    primaryDev,
    homeLoc,
    prefMethod,
    typTime,
    riskTier,
    devScore,
    Math.floor(Math.random() * 50) + 5,
    new Date(Date.now() - (i * 86400000 * 5)).toISOString()
  );
}

// 2. Shared IP & Device clusters for Network Graph demo
const sharedDevices = ['DEV-CLUSTER-01', 'DEV-CLUSTER-02', 'DEV-999'];
const sharedIPs = ['103.21.244.12', '45.112.56.89', '185.220.101.5'];

// 3. Generate 120 transactions with consistent risk signals
for (let i = 1; i <= 120; i++) {
  const cust = customers[i % customers.length];
  const txnId = `TXN-${String(i).padStart(5, '0')}`;

  const isHighRiskScenario = i % 5 === 0 || i % 13 === 0;
  const isMediumRiskScenario = !isHighRiskScenario && (i % 3 === 0);

  const amount = isHighRiskScenario 
    ? Math.floor(Math.random() * 120000) + 60000 
    : isMediumRiskScenario 
      ? Math.floor(Math.random() * 45000) + 15000 
      : Math.floor(Math.random() * 8000) + 500;

  const velocity_6min = isHighRiskScenario ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 3) + 1;
  const account_age_days = isHighRiskScenario ? Math.floor(Math.random() * 6) + 1 : Math.floor(Math.random() * 360) + 20;
  const device_anomaly_flag = isHighRiskScenario ? 1 : (i % 7 === 0 ? 1 : 0);
  const location_anomaly_flag = isHighRiskScenario ? 1 : (i % 9 === 0 ? 1 : 0);
  const historical_chargebacks = isHighRiskScenario ? Math.floor(Math.random() * 3) + 1 : 0;

  const device_id = (i % 8 === 0) ? sharedDevices[i % sharedDevices.length] : (device_anomaly_flag ? `DEV-NEW-${i}` : cust.primary_device);
  const ip_address = (i % 6 === 0) ? sharedIPs[i % sharedIPs.length] : `49.37.${(i * 3) % 250}.${(i * 7) % 250}`;
  const location = location_anomaly_flag ? cities[(i + 4) % cities.length] : cust.home_location;
  const payment_method = cust.preferred_method;

  const rawTxn = {
    transaction_id: txnId,
    customer_id: cust.customer_id,
    customer_name: cust.customer_name,
    amount,
    payment_method,
    location,
    device_id,
    ip_address,
    account_age_days,
    velocity_6min,
    historical_chargebacks,
    device_anomaly_flag,
    location_anomaly_flag,
  };

  const evalResult = calculateRisk(rawTxn);
  const risk_score = evalResult.riskScore;
  const risk_level = evalResult.riskLevel;
  const status = evalResult.recommendedAction.toLowerCase();

  const date = new Date();
  date.setMinutes(date.getMinutes() - (i * 25));

  insertTransaction.run(
    txnId,
    cust.customer_id,
    cust.customer_name,
    amount,
    payment_method,
    location,
    device_id,
    ip_address,
    account_age_days,
    velocity_6min,
    historical_chargebacks,
    device_anomaly_flag,
    location_anomaly_flag,
    risk_score,
    risk_level,
    status,
    date.toISOString()
  );

  Object.entries(evalResult.subScores).forEach(([signalKey, score]) => {
    let severity = score >= 75 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW';
    let explanation = `${signalKey} score evaluated at ${score}/100`;
    if (signalKey === 'velocity') explanation = `${velocity_6min} attempts in 6 minutes window`;
    if (signalKey === 'transactionAnomaly') explanation = `Amount ₹${amount.toLocaleString('en-IN')} vs customer baseline ₹${cust.avg_tx_amount.toLocaleString('en-IN')}`;
    if (signalKey === 'deviceAnomaly') explanation = device_anomaly_flag ? 'New or unrecognized device identifier' : 'Known customer device';

    insertSignal.run(txnId, signalKey, severity, score, explanation);
  });
}

// 4. Generate Incident Records
const incidentsList = [
  {
    incident_id: 'INC-2026-001',
    title: 'Card Velocity Burst from Cluster IP 103.21.244.12',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    affected_tx_count: 14,
    total_exposure: 485000,
    vector: 'IP Velocity / Bot Spikes',
    description: 'Rapid sequential payment attempts originating from a known proxy subnet targeting multiple merchant endpoints.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    incident_id: 'INC-2026-002',
    title: 'New Device Identity Switching Spike',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    affected_tx_count: 8,
    total_exposure: 290000,
    vector: 'Device Spoofing',
    description: 'Multiple high-value transactions using fresh device identifiers with spoofed browser headers.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    incident_id: 'INC-2026-003',
    title: 'Geographic Location Anomaly Cluster (Bengaluru -> Kolkata)',
    severity: 'MEDIUM',
    status: 'CONTAINED',
    affected_tx_count: 5,
    total_exposure: 125000,
    vector: 'Account Takeover (ATO)',
    description: 'Simultaneous login & transaction events across distant geographical nodes within a 5-minute interval.',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

incidentsList.forEach((inc) => {
  insertIncident.run(
    inc.incident_id,
    inc.title,
    inc.severity,
    inc.status,
    inc.affected_tx_count,
    inc.total_exposure,
    inc.vector,
    inc.description,
    inc.created_at
  );
});

// 5. Generate sample investigations
for (let i = 1; i <= 8; i++) {
  const txnId = `TXN-${String(i * 5).padStart(5, '0')}`;
  const statuses = ['open', 'resolved', 'dismissed'];
  const decisions = ['allowed', 'blocked', 'challenged'];

  insertInvestigation.run(
    txnId,
    statuses[i % statuses.length],
    decisions[i % decisions.length],
    `Automated investigation log for case ${txnId}. Risk review completed.`,
    new Date(Date.now() - (i * 3600000 * 4)).toISOString()
  );
}

// 6. Default Settings
insertSetting.run('verification_threshold', '50000');
insertSetting.run('risk_score_cutoff', '70');
insertSetting.run('block_threshold', '100000');
insertSetting.run('vulcan_intelligence_mode', 'synthetic_layer');
insertSetting.run('auto_contain_clusters', 'enabled');

console.log("✅ RISKOS Database seeded successfully!");
console.log("Customers:", db.prepare("SELECT COUNT(*) FROM customers").get());
console.log("Transactions:", db.prepare("SELECT COUNT(*) FROM transactions").get());
console.log("Incidents:", db.prepare("SELECT COUNT(*) FROM incidents").get());

module.exports = db;