import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export default function RiskDNARadar({ subScores }) {
  const data = [
    { subject: 'Transaction Value', value: subScores?.transactionAnomaly ?? 30 },
    { subject: 'Velocity Spikes', value: subScores?.velocity ?? 25 },
    { subject: 'Device Anomaly', value: subScores?.deviceAnomaly ?? 15 },
    { subject: 'Location Anomaly', value: subScores?.locationAnomaly ?? 20 },
    { subject: 'Account Behavior', value: subScores?.accountBehavior ?? 35 },
    { subject: 'History Risk', value: subScores?.historicalRisk ?? 10 },
  ];

  return (
    <div style={{ width: '100%', height: 270 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
          <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar
            name="Risk DNA"
            dataKey="value"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
