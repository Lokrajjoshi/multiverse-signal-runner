export const MISSIONS = [
  { name: 'Signal Intake', target: 120, color: '#22d3ee' },
  { name: 'Data Quality Gate', target: 300, color: '#60a5fa' },
  { name: 'API Assurance', target: 560, color: '#a78bfa' },
  { name: 'CarePulse Recovery', target: 900, color: '#2dd4bf' },
  { name: 'Business Insight Core', target: 1400, color: '#fbbf24' }
];

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function scoreSignal(state, quality = 1) {
  const combo = clamp(state.combo + 1, 1, 8);
  const gained = Math.round(20 * quality * combo);
  return {
    ...state,
    score: state.score + gained,
    combo,
    integrity: clamp(state.integrity + 1.5 * quality, 0, 100),
    coverage: clamp(state.coverage + 2.5 * quality, 0, 100),
    insight: state.insight + (combo >= 4 ? 1 : 0)
  };
}

export function applyHazard(state, severity = 1) {
  return {
    ...state,
    integrity: clamp(state.integrity - 14 * severity, 0, 100),
    coverage: clamp(state.coverage - 4 * severity, 0, 100),
    combo: 1
  };
}

export function validateHazard(state, severity = 1) {
  return {
    ...state,
    score: state.score + Math.round(12 * severity),
    coverage: clamp(state.coverage + 4 * severity, 0, 100),
    insight: state.insight + 1
  };
}

export function missionIndex(score) {
  const index = MISSIONS.findIndex((mission) => score < mission.target);
  return index === -1 ? MISSIONS.length - 1 : index;
}

export function missionProgress(score) {
  const index = missionIndex(score);
  const previous = index === 0 ? 0 : MISSIONS[index - 1].target;
  const range = MISSIONS[index].target - previous;
  return clamp(((score - previous) / range) * 100, 0, 100);
}

export function rankFromScore(score) {
  if (score >= 1400) return 'INSIGHT ARCHITECT';
  if (score >= 900) return 'RECOVERY LEAD';
  if (score >= 560) return 'QUALITY ENGINEER';
  if (score >= 300) return 'DATA VALIDATOR';
  return 'SIGNAL ANALYST';
}
