import { Router } from 'express'; import bcrypt from 'bcryptjs'; import jwt from 'jsonwebtoken'; import { z } from 'zod';
import { User, Habit, Expense, Goal } from '../models/index.js'; import { requireAuth, validate } from '../middleware/index.js'; import { summary } from '../services/analytics.js';
import * as c from '../services/calc.js';
const r = Router(), wrap = (f) => (q, s, n) => f(q, s, n).catch(n);
const cookie = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 6048e5, path: '/' };
const pub = (u) => ({ id: u._id, email: u.email, name: u.name, monthlyIncome: u.monthlyIncome, workHoursPerMonth: u.workHoursPerMonth, currency: u.currency || 'INR' });
const cred = z.object({ email: z.string().email(), password: z.string().min(8).max(128), name: z.string().max(80).optional() });
const sign = (res, u) => {
  const token = jwt.sign({ sub: String(u._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, cookie);
  return token;
};
const nf = (s) => s.status(404).json({ error: { code: 'not_found', message: 'Expense not found' } });
r.post('/auth/register', validate(cred), wrap(async (q, s) => {
  if (await User.exists({ email: q.body.email.toLowerCase() })) return s.status(409).json({ error: { code: 'exists', message: 'Email already registered' } });
  const u = await User.create({ email: q.body.email, name: q.body.name, passwordHash: await bcrypt.hash(q.body.password, 12), currency: 'INR' });
  const token = sign(s, u); s.status(201).json({ ...pub(u), token }); }));
r.post('/auth/login', validate(cred), wrap(async (q, s) => {
  const u = await User.findOne({ email: q.body.email.toLowerCase() });
  if (!u || !(await bcrypt.compare(q.body.password, u.passwordHash))) return s.status(401).json({ error: { code: 'invalid', message: 'Incorrect email or password' } });
  const token = sign(s, u); s.json({ ...pub(u), token }); }));
r.post('/auth/logout', (_q, s) => {
  s.cookie('token', '', { ...cookie, maxAge: 0, expires: new Date(0) });
  s.clearCookie('token', { path: '/' });
  s.json({ success: true, message: 'Logged out successfully' });
});
r.get('/me', requireAuth, wrap(async (q, s) => s.json(pub(await User.findById(q.userId)))));
r.patch('/me', requireAuth, validate(z.object({ name: z.string().max(80), monthlyIncome: z.number().min(0), workHoursPerMonth: z.number().min(0).max(744), currency: z.string().min(1).max(10) }).partial()),
  wrap(async (q, s) => s.json(pub(await User.findByIdAndUpdate(q.userId, q.body, { new: true })))));
r.post('/seed-my-account', requireAuth, wrap(async (q, s) => {
  const uid = q.userId;
  await User.findByIdAndUpdate(uid, { monthlyIncome: 75000, workHoursPerMonth: 160, currency: 'INR' });
  await Habit.deleteMany({ user: uid });
  await Expense.deleteMany({ user: uid });
  await Goal.deleteMany({ user: uid });
  const coffee = await Habit.create({ user: uid, name: 'Specialty Coffee / Chai', category: 'Food & Drink', expectedMonthly: 4000, budget: 3500, frequencyPerMonth: 25 });
  const dining = await Habit.create({ user: uid, name: 'Swiggy / Zomato Dining', category: 'Food & Drink', expectedMonthly: 8500, budget: 7000, frequencyPerMonth: 12 });
  const streaming = await Habit.create({ user: uid, name: 'OTT & Digital Subscriptions', category: 'Entertainment', expectedMonthly: 1200, budget: 1000, frequencyPerMonth: 4 });
  const rideshare = await Habit.create({ user: uid, name: 'Uber / Auto Commutes', category: 'Transport', expectedMonthly: 5500, budget: 4500, frequencyPerMonth: 18 });
  await Goal.create({ user: uid, title: 'Emergency Fund', targetAmount: 50000, currentSaved: 15000, monthlyContribution: 5000, habitToCut: dining._id });
  await Goal.create({ user: uid, title: 'Weekend Vacation', targetAmount: 25000, currentSaved: 8000, monthlyContribution: 3000, habitToCut: coffee._id });
  const now = new Date();
  const expenses = [];
  const daysInMonth = Math.min(now.getDate(), 28);
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
    if (day % 1 === 0) expenses.push({ user: uid, habit: coffee._id, category: 'Food & Drink', amount: 160, date: d, note: 'Daily cappuccino / brew' });
    if (day % 3 === 0) expenses.push({ user: uid, habit: dining._id, category: 'Food & Drink', amount: 680, date: d, note: 'Dinner order' });
    if (day % 4 === 0) expenses.push({ user: uid, habit: rideshare._id, category: 'Transport', amount: 280, date: d, note: 'Cab commute' });
  }
  expenses.push({ user: uid, habit: streaming._id, category: 'Entertainment', amount: 649, date: new Date(now.getFullYear(), now.getMonth(), 2), note: 'Netflix & Spotify' });
  await Expense.insertMany(expenses);
  s.json({ success: true, message: 'Sample habits, goals, and expenses loaded in Rupees!' });
}));
const exp = z.object({ amount: z.number().finite().refine((n) => n !== 0, 'Amount cannot be zero'), category: z.string().min(1).max(40),
  date: z.coerce.date(), note: z.string().max(280).optional(), habit: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional() });
const list = z.object({ category: z.string().optional(), habit: z.string().optional(), from: z.coerce.date().optional(), to: z.coerce.date().optional(),
  sort: z.enum(['date', '-date', 'amount', '-amount']).default('-date'), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
r.get('/expenses', requireAuth, validate(list, 'query'), wrap(async (q, s) => {
  const { category, habit, from, to, sort, page, limit } = q.query, f = { user: q.userId };
  if (category) f.category = category; if (habit) f.habit = habit;
  if (from || to) f.date = { ...(from && { $gte: from }), ...(to && { $lt: to }) };
  const [items, total] = await Promise.all([Expense.find(f).sort(sort.startsWith('-') ? { [sort.slice(1)]: -1 } : { [sort]: 1 }).skip((page - 1) * limit).limit(limit).lean(), Expense.countDocuments(f)]);
  s.json({ items, total, page, pages: Math.ceil(total / limit) }); }));
r.post('/expenses', requireAuth, validate(exp), wrap(async (q, s) => s.status(201).json(await Expense.create({ ...q.body, user: q.userId }))));
r.put('/expenses/:id', requireAuth, validate(exp), wrap(async (q, s) => { // ownership enforced in the filter
  const d = await Expense.findOneAndUpdate({ _id: q.params.id, user: q.userId }, q.body, { new: true }); d ? s.json(d) : nf(s); }));
r.delete('/expenses/:id', requireAuth, wrap(async (q, s) => {
  const d = await Expense.findOneAndDelete({ _id: q.params.id, user: q.userId }); d ? s.status(204).end() : nf(s); }));

// Habits Routes
const habSchema = z.object({ name: z.string().min(1).max(80), category: z.string().min(1).max(40), expectedMonthly: z.number().min(0).default(0), budget: z.number().min(0).default(0), frequencyPerMonth: z.number().min(0).default(0) });
r.get('/habits', requireAuth, wrap(async (q, s) => s.json(await Habit.find({ user: q.userId }).lean())));
r.post('/habits', requireAuth, validate(habSchema), wrap(async (q, s) => s.status(201).json(await Habit.create({ ...q.body, user: q.userId }))));
r.put('/habits/:id', requireAuth, validate(habSchema.partial()), wrap(async (q, s) => {
  const h = await Habit.findOneAndUpdate({ _id: q.params.id, user: q.userId }, q.body, { new: true });
  h ? s.json(h) : s.status(404).json({ error: { message: 'Habit not found' } });
}));
r.delete('/habits/:id', requireAuth, wrap(async (q, s) => {
  const h = await Habit.findOneAndDelete({ _id: q.params.id, user: q.userId });
  h ? s.status(204).end() : s.status(404).json({ error: { message: 'Habit not found' } });
}));

// Goals Routes
const goalSchema = z.object({ title: z.string().min(1).max(100), targetAmount: z.number().min(1), currentSaved: z.number().min(0).default(0), monthlyContribution: z.number().min(0).default(0), habitToCut: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional() });
r.get('/goals', requireAuth, wrap(async (q, s) => {
  const goals = await Goal.find({ user: q.userId }).populate('habitToCut').lean();
  s.json(goals.map(g => ({ ...g, progress: c.goalProgress(g.currentSaved, g.targetAmount), monthsRemaining: c.monthsToGoal(g.targetAmount, g.currentSaved, g.monthlyContribution) })));
}));
r.post('/goals', requireAuth, validate(goalSchema), wrap(async (q, s) => s.status(201).json(await Goal.create({ ...q.body, user: q.userId }))));
r.put('/goals/:id', requireAuth, validate(goalSchema.partial()), wrap(async (q, s) => {
  const g = await Goal.findOneAndUpdate({ _id: q.params.id, user: q.userId }, q.body, { new: true });
  g ? s.json(g) : s.status(404).json({ error: { message: 'Goal not found' } });
}));
r.delete('/goals/:id', requireAuth, wrap(async (q, s) => {
  const g = await Goal.findOneAndDelete({ _id: q.params.id, user: q.userId });
  g ? s.status(204).end() : s.status(404).json({ error: { message: 'Goal not found' } });
}));

// AI Coach Insights Route
r.get('/coach/insights', requireAuth, wrap(async (q, s) => {
  const uid = q.userId, user = await User.findById(uid).lean(), now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1), to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sum = await summary(user, from, to), top = sum.ranking[0], tips = [];
  if (top) {
    const cut25 = c.round2(top.amount * 0.25), annualSave = c.round2(cut25 * 12);
    tips.push({
      type: 'cut_opportunity',
      title: `Optimize ${top.name}`,
      message: `${top.name} takes ${Math.round(top.share * 100)}% of your discretionary spend (${top.hours ? `${top.hours.toFixed(1)} hours of labor` : ''}). Trimming 25% frees ₹${cut25.toLocaleString('en-IN')}/mo or ₹${annualSave.toLocaleString('en-IN')}/year.`,
      impact: `Save ₹${annualSave.toLocaleString('en-IN')}/yr`
    });
  }
  if (sum.hours > 15) {
    tips.push({
      type: 'time_warning',
      title: 'Heavy Labor Exchange',
      message: `You worked ${sum.hours.toFixed(1)} hours this month just to afford these habits. Consider if the immediate gratification equals nearly 2 days of work.`,
      impact: `${sum.hours.toFixed(1)}h of effort`
    });
  }
  tips.push({
    type: 'compound_growth',
    title: 'The Real Cost Mindset',
    message: 'Every habit has an opportunity cost: ₹500 saved every week invested at 10% returns ₹10.3 Lakhs over 15 years.',
    impact: 'Compound Wealth'
  });
  s.json({ summary: sum, tips, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
}));

r.get('/analytics/summary', requireAuth, validate(z.object({ from: z.coerce.date(), to: z.coerce.date() }).refine((v) => v.to > v.from, 'to must be after from'), 'query'),
  wrap(async (q, s) => s.json(await summary(await User.findById(q.userId).lean(), q.query.from, q.query.to))));
export default r;
