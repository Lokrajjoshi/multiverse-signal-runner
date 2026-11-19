import test from 'node:test';
import assert from 'node:assert/strict';
import { applyHazard, clamp, missionIndex, missionProgress, rankFromScore, scoreSignal, validateHazard } from '../src/engine.js';

const base = { score: 0, integrity: 80, coverage: 10, insight: 0, combo: 1 };

test('clamp keeps telemetry inside safe bounds', () => {
  assert.equal(clamp(120, 0, 100), 100);
  assert.equal(clamp(-5, 0, 100), 0);
});

test('trusted signals improve score and quality telemetry', () => {
  const next = scoreSignal(base);
  assert.ok(next.score > base.score);
  assert.ok(next.integrity > base.integrity);
  assert.ok(next.coverage > base.coverage);
  assert.equal(next.combo, 2);
});

test('hazards reduce integrity and reset combo', () => {
  const next = applyHazard({ ...base, combo: 6 }, 2);
  assert.equal(next.combo, 1);
  assert.equal(next.integrity, 52);
});

test('validation converts hazards into coverage and insight', () => {
  const next = validateHazard(base, 2);
  assert.equal(next.insight, 1);
  assert.equal(next.coverage, 18);
});

test('mission engine advances with score', () => {
  assert.equal(missionIndex(0), 0);
  assert.equal(missionIndex(301), 2);
  assert.equal(missionIndex(901), 4);
  assert.ok(missionProgress(200) > 0);
});

test('rank reflects demonstrated progress', () => {
  assert.equal(rankFromScore(100), 'SIGNAL ANALYST');
  assert.equal(rankFromScore(600), 'QUALITY ENGINEER');
  assert.equal(rankFromScore(1500), 'INSIGHT ARCHITECT');
});
