/**
 * RISKOS Deterministic Risk Engine
 * Reused everywhere to ensure same input -> same output.
 */

function calculateRisk(txn) {
  const amount = Number(txn.amount || 0);
  const velocity6min = Number(txn.velocity_6min || 1);
  const accountAgeDays = Number(txn.account_age_days || 30);
  const isNewDevice = Boolean(txn.device_anomaly_flag || txn.is_new_device || (txn.device_id && txn.device_id.includes('NEW')));
  const isUnusualLoc = Boolean(txn.location_anomaly_flag || txn.is_unusual_location);
  const historicalCBs = Number(txn.historical_chargebacks || 0);

  // 1. Transaction Anomaly (0-100)
  let transactionAnomaly = 10;
  if (amount > 150000) transactionAnomaly = 95;
  else if (amount > 90000) transactionAnomaly = 80;
  else if (amount > 50000) transactionAnomaly = 65;
  else if (amount > 20000) transactionAnomaly = 40;
  else if (amount > 5000) transactionAnomaly = 20;

  // 2. Velocity (0-100)
  let velocity = 10;
  if (velocity6min >= 10) velocity = 95;
  else if (velocity6min >= 6) velocity = 80;
  else if (velocity6min >= 4) velocity = 60;
  else if (velocity6min >= 2) velocity = 35;

  // 3. Device Anomaly (0-100)
  let deviceAnomaly = isNewDevice ? 88 : (txn.device_id ? 15 : 45);

  // 4. Location Anomaly (0-100)
  let locationAnomaly = isUnusualLoc ? 92 : 12;

  // 5. Account Behavior (0-100)
  let accountBehavior = 10;
  if (accountAgeDays <= 2) accountBehavior = 95;
  else if (accountAgeDays <= 7) accountBehavior = 82;
  else if (accountAgeDays <= 30) accountBehavior = 60;
  else if (accountAgeDays <= 90) accountBehavior = 35;
  else if (accountAgeDays <= 180) accountBehavior = 20;

  // 6. Historical Risk (0-100)
  let historicalRisk = 10;
  if (historicalCBs >= 3) historicalRisk = 98;
  else if (historicalCBs >= 2) historicalRisk = 80;
  else if (historicalCBs >= 1) historicalRisk = 60;

  // Unified Weighted Formula
  const riskScore = Math.min(
    99,
    Math.max(
      5,
      Math.round(
        0.20 * transactionAnomaly +
        0.20 * velocity +
        0.15 * deviceAnomaly +
        0.15 * locationAnomaly +
        0.15 * accountBehavior +
        0.15 * historicalRisk
      )
    )
  );

  // Risk Level
  let riskLevel = 'LOW';
  if (riskScore >= 80) riskLevel = 'CRITICAL';
  else if (riskScore >= 60) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  // Recommended Action
  let recommendedAction = 'ALLOW';
  if (riskScore >= 75) recommendedAction = 'BLOCK';
  else if (riskScore >= 45) recommendedAction = 'VERIFY';

  // Active Signals (subscore >= 50)
  const signals = [];
  const signalDetails = [];

  if (transactionAnomaly >= 50) {
    signals.push('high_transaction_value');
    signalDetails.push(`Transaction value of ₹${amount.toLocaleString('en-IN')} exceeds normal baseline`);
  }
  if (velocity >= 50) {
    signals.push('high_velocity');
    signalDetails.push(`${velocity6min} payment attempts detected within 6 minutes`);
  }
  if (deviceAnomaly >= 50) {
    signals.push('unrecognized_device');
    signalDetails.push(`Unrecognized or newly registered device (${txn.device_id || 'Unknown'})`);
  }
  if (locationAnomaly >= 50) {
    signals.push('unusual_location');
    signalDetails.push(`Transaction originating from an unusual location (${txn.location || 'Unknown'})`);
  }
  if (accountBehavior >= 50) {
    signals.push('new_account_risk');
    signalDetails.push(`Account is only ${accountAgeDays} days old`);
  }
  if (historicalRisk >= 50) {
    signals.push('historical_chargebacks');
    signalDetails.push(`Customer account has ${historicalCBs} recorded chargeback dispute(s)`);
  }

  // Dynamic explanation builder
  let explanation = '';
  if (signals.length === 0) {
    explanation = `Transaction ${txn.transaction_id || ''} displays low risk characteristics across all signals with standard velocity and known attributes.`;
  } else {
    explanation = `Flagged for ${signals.length} active risk factor${signals.length > 1 ? 's' : ''}: ${signalDetails.join('; ')}. Recommended action is ${recommendedAction}.`;
  }

  // Confidence Score (0.75 to 0.96 based on variance among sub-scores)
  const subScoresArr = [transactionAnomaly, velocity, deviceAnomaly, locationAnomaly, accountBehavior, historicalRisk];
  const mean = subScoresArr.reduce((a, b) => a + b, 0) / subScoresArr.length;
  const variance = subScoresArr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / subScoresArr.length;
  const stdDev = Math.sqrt(variance);
  const confidence = parseFloat((Math.min(0.96, Math.max(0.72, 0.95 - (stdDev / 200)))).toFixed(2));

  return {
    transaction: txn.transaction_id,
    riskScore,
    riskLevel,
    signals,
    subScores: {
      transactionAnomaly,
      velocity,
      deviceAnomaly,
      locationAnomaly,
      accountBehavior,
      historicalRisk,
    },
    recommendedAction,
    confidence,
    explanation,
  };
}

module.exports = { calculateRisk };
