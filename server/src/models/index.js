import mongoose from 'mongoose';
const { Schema } = mongoose; const ref = (m) => ({ type: Schema.Types.ObjectId, ref: m });
export const User = mongoose.model('User', new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }, name: { type: String, trim: true, default: '' },
  monthlyIncome: { type: Number, min: 0, default: 0 }, workHoursPerMonth: { type: Number, min: 0, default: 160 },
  currency: { type: String, default: 'INR' } }, { timestamps: true }));
export const Habit = mongoose.model('Habit', new Schema({
  user: { ...ref('User'), required: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true }, expectedMonthly: { type: Number, min: 0, default: 0 },
  budget: { type: Number, min: 0, default: 0 }, frequencyPerMonth: { type: Number, min: 0, default: 0 } }, { timestamps: true }));
export const Expense = mongoose.model('Expense', new Schema({
  user: { ...ref('User'), required: true }, habit: { ...ref('Habit'), default: null },
  category: { type: String, required: true }, amount: { type: Number, required: true }, // negative = refund
  date: { type: Date, required: true }, note: { type: String, maxlength: 280, default: '' } }, { timestamps: true })
  .index({ user: 1, date: -1 }));
export const Goal = mongoose.model('Goal', new Schema({
  user: { ...ref('User'), required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  targetAmount: { type: Number, required: true, min: 1 },
  currentSaved: { type: Number, min: 0, default: 0 },
  monthlyContribution: { type: Number, min: 0, default: 0 },
  habitToCut: { ...ref('Habit'), default: null }
}, { timestamps: true }));
