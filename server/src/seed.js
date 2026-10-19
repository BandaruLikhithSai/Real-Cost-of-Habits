try { process.loadEnvFile?.('.env'); } catch {}
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Habit, Expense } from './models/index.js';

if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not set in server/.env');
  console.error('Please configure MONGODB_URI before running seed.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB...');

const email = 'demo@example.com';
const password = 'password123';

await User.deleteOne({ email });

const user = await User.create({
  email,
  passwordHash: await bcrypt.hash(password, 12),
  name: 'Alex Morgan',
  monthlyIncome: 75000,
  workHoursPerMonth: 160,
  currency: 'INR'
});

await Habit.deleteMany({ user: user._id });
await Expense.deleteMany({ user: user._id });

const coffee = await Habit.create({ user: user._id, name: 'Specialty Coffee / Chai', category: 'Food & Drink', expectedMonthly: 4000, budget: 3500, frequencyPerMonth: 25 });
const dining = await Habit.create({ user: user._id, name: 'Swiggy / Zomato Dining', category: 'Food & Drink', expectedMonthly: 8500, budget: 7000, frequencyPerMonth: 12 });
const streaming = await Habit.create({ user: user._id, name: 'OTT & Digital Subscriptions', category: 'Entertainment', expectedMonthly: 1200, budget: 1000, frequencyPerMonth: 4 });
const rideshare = await Habit.create({ user: user._id, name: 'Uber / Auto Commutes', category: 'Transport', expectedMonthly: 5500, budget: 4500, frequencyPerMonth: 18 });

const now = new Date();
const expenses = [];
const daysInMonth = Math.min(now.getDate(), 28);

for (let day = 1; day <= daysInMonth; day++) {
  const d = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0);
  if (day % 1 === 0) expenses.push({ user: user._id, habit: coffee._id, category: 'Food & Drink', amount: 160, date: d, note: 'Daily cappuccino / brew' });
  if (day % 3 === 0) expenses.push({ user: user._id, habit: dining._id, category: 'Food & Drink', amount: 680, date: d, note: 'Dinner order' });
  if (day % 4 === 0) expenses.push({ user: user._id, habit: rideshare._id, category: 'Transport', amount: 280, date: d, note: 'Cab commute' });
}
expenses.push({ user: user._id, habit: streaming._id, category: 'Entertainment', amount: 649, date: new Date(now.getFullYear(), now.getMonth(), 2), note: 'Netflix & Spotify' });

await Expense.insertMany(expenses);

console.log('--- Demo Data Seeded Successfully ---');
console.log(`Demo Email:    ${email}`);
console.log(`Demo Password: ${password}`);
console.log('You can now log in using these credentials to see the full dashboard!');
await mongoose.disconnect();
