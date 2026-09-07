import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentVersion, dimensionsFor, reconcileRatings, certificateEligibility } from '../src/lib/assessment-policy.ts';

const rating = (skill, score = 4) => ({ scores: Object.fromEntries(dimensionsFor(skill).map(d => [d, score])), evidence: Object.fromEntries(dimensionsFor(skill).map(d => [d, 'Evidence from this response.'])), sufficientEvidence: true, feedback: 'Revise one specific example.' });
const result = skill => reconcileRatings(rating(skill), rating(skill), skill);
const evidence = () => ({ level: 'B2', version: assessmentVersion, requiredModuleIds: ['b2-a', 'b2-b'], completedModuleIds: ['b2-a', 'b2-b'], reading: 80, listening: 80, writing: result('writing'), speaking: result('speaking'), mediationComplete: true, reviewPending: false });

test('missing or malformed AI results never become a grade', () => {
  assert.equal(reconcileRatings(null, rating('writing'), 'writing').status, 'unavailable');
  const malformed = rating('writing'); delete malformed.scores.register;
  assert.equal(reconcileRatings(malformed, rating('writing'), 'writing').status, 'unavailable');
  const insufficient = rating('speaking'); insufficient.sufficientEvidence = false;
  assert.equal(reconcileRatings(insufficient, rating('speaking'), 'speaking').status, 'human-review');
});
test('disagreement beyond one point or any pass change needs human review', () => {
  assert.equal(reconcileRatings(rating('writing', 3), rating('writing', 5), 'writing').status, 'human-review');
  const borderline = rating('writing', 3); borderline.scores.register = 2;
  assert.equal(reconcileRatings(borderline, rating('writing', 3), 'writing').status, 'human-review');
  assert.equal(reconcileRatings(rating('writing', 3), rating('writing', 4), 'writing').status, 'scored');
});
test('every certificate skill floor, module and mediation is mandatory', () => {
  assert.equal(certificateEligibility(evidence()).eligible, true);
  for (const skill of ['reading', 'listening']) {
    const value = evidence(); value[skill] = 59; value[skill === 'reading' ? 'listening' : 'reading'] = 100;
    assert.equal(certificateEligibility(value).eligible, false);
  }
  for (const skill of ['writing', 'speaking']) {
    for (const dimension of dimensionsFor(skill)) {
      const value = evidence(); value[skill].scores[dimension] = 2.5;
      assert.equal(certificateEligibility(value).eligible, false, `${skill}.${dimension} cannot be compensated`);
    }
  }
  for (const update of [{ completedModuleIds: ['b2-a'] }, { requiredModuleIds: [] }, { mediationComplete: false }, { reviewPending: true }, { version: 'outdated' }, { writing: { status: 'unavailable', reason: 'timeout' } }, { listening: NaN }]) {
    assert.equal(certificateEligibility({ ...evidence(), ...update }).eligible, false);
  }
});
test('global floor is applied before display rounding', () => {
  const value = evidence(); value.reading = 60; value.listening = 60; value.writing = reconcileRatings(rating('writing', 3), rating('writing', 3), 'writing');
  assert.equal(certificateEligibility(value).eligible, false);
  const boundary = evidence(); boundary.reading = 60; boundary.listening = 60;
  assert.equal(certificateEligibility(boundary).global, 70);
  assert.equal(certificateEligibility(boundary).eligible, true);
});
