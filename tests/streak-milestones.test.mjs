import assert from 'node:assert/strict';
import test from 'node:test';
import { isStreakMilestone, streakTargets } from '../src/lib/streak-milestones.ts';
test('streak celebrations match exact days and continue beyond the first year', () => {
  for (const day of [10,30,50,90,100,150,200,365,400,500]) assert.equal(isStreakMilestone(day), true);
  for (const day of [0,1,7,29,31,99,366,399]) assert.equal(isStreakMilestone(day), false);
  for (const count of [0,10,99,100,365,399,400,1000]) {
    const targets = streakTargets(count);
    assert.ok(targets.some(day => day > count));
    assert.deepEqual(targets, [...new Set(targets)].sort((a,b) => a-b));
  }
});
