import mongoose from 'mongoose';
import { Expense, Habit } from '../models/index.js';
import * as c from './calc.js';
export async function summary(user, from, to) {
  const span = to - from, pFrom = new Date(from - span), uid = new mongoose.Types.ObjectId(user._id);
  const q = (a, b) => ({ user: uid, date: { $gte: a, $lt: b } });
  const [cur, prev, habits] = await Promise.all([
    Expense.find(q(from, to)).lean(), Expense.find(q(pFrom, from)).lean(), Habit.find({ user: uid }).lean()]);
  const rate = c.hourlyRate(user.monthlyIncome, user.workHoursPerMonth);
  const total = c.sumExpenses(cur), prevTotal = c.sumExpenses(prev), months = Math.max(span / 2629800000, 1 / 30);
  const names = new Map(habits.map((h) => [String(h._id), h]));
  const groups = new Map();
  for (const e of cur) { const k = e.habit ? String(e.habit) : `cat:${e.category}`; groups.set(k, [...(groups.get(k) || []), e]); }
  const ranking = [...groups].map(([k, rows]) => { const amount = c.sumExpenses(rows), h = names.get(k);
    return { key: k, name: h?.name || rows[0].category, category: rows[0].category, amount,
      share: total > 0 ? c.round2(amount / total) : 0, hours: c.workingHours(amount, rate) }; })
    .sort((a, b) => b.amount - a.amount);
  const daily = {}; for (const e of cur) { const d = e.date.toISOString().slice(0, 10); daily[d] = (daily[d] || 0) + e.amount; }
  return { period: { from, to }, total, previousTotal: prevTotal, change: c.percentChange(total, prevTotal),
    hourlyRate: c.round2(rate), hours: c.workingHours(total, rate),
    // Estimate only: scales this period's spend to a month, then x12. Not a guaranteed outcome.
    estimatedAnnual: c.annualFromMonthly(total / months), ranking,
    series: Object.entries(daily).sort().map(([date, amount]) => ({ date, amount: c.round2(amount) })) };
}
