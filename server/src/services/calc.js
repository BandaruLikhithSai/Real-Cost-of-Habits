export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
export const hourlyRate = (income, hours) => (income > 0 && hours > 0 ? income / hours : 0);
// Returns null when no valid hourly rate exists, never Infinity.
export const workingHours = (amount, rate) => (rate > 0 && Number.isFinite(amount) ? amount / rate : null);
export const sumExpenses = (list) => round2(list.reduce((s, e) => s + (Number.isFinite(e.amount) ? e.amount : 0), 0)); // refunds are negative
export const annualFromMonthly = (m) => round2(m * 12);
export const clampPct = (p) => Math.min(100, Math.max(0, Number(p) || 0));
export const monthlySavings = (cost, pct) => round2(Math.max(0, cost) * (clampPct(pct) / 100));
export const annualSavings = (cost, pct) => round2(monthlySavings(cost, pct) * 12);
export const percentChange = (cur, prev) => (prev > 0 ? round2(((cur - prev) / prev) * 100) : null);
export const goalProgress = (saved, target) => (target > 0 ? Math.min(1, Math.max(0, saved) / target) : 0);
export const monthsToGoal = (target, saved, perMonth) =>
  saved >= target ? 0 : perMonth > 0 ? Math.ceil((target - saved) / perMonth) : null;
