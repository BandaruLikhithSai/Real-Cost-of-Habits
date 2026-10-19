import test from 'node:test'; import assert from 'node:assert/strict';
import * as c from './calc.js';
test('hourly rate and zero guards', () => {
  assert.equal(c.hourlyRate(3200, 160), 20);
  assert.equal(c.hourlyRate(0, 160), 0); assert.equal(c.hourlyRate(3200, 0), 0);
});
test('working hours', () => { assert.equal(c.workingHours(100, 20), 5); assert.equal(c.workingHours(100, 0), null); });
test('sum handles refunds and invalid', () => assert.equal(c.sumExpenses([{amount:50},{amount:-10},{amount:NaN}]), 40));
test('savings', () => {
  assert.equal(c.monthlySavings(200, 25), 50); assert.equal(c.annualSavings(200, 25), 600);
  assert.equal(c.monthlySavings(200, 150), 200); assert.equal(c.monthlySavings(200, -5), 0);
});
test('percent change', () => { assert.equal(c.percentChange(110, 100), 10); assert.equal(c.percentChange(5, 0), null); });
test('goals use actual savings', () => {
  assert.equal(c.goalProgress(250, 1000), 0.25); assert.equal(c.monthsToGoal(1000, 250, 100), 8);
  assert.equal(c.monthsToGoal(1000, 250, 0), null); assert.equal(c.monthsToGoal(1000, 1000, 0), 0);
});
