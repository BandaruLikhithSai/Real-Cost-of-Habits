import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api.js';

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth(), 1);
const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

const COLORS = ['#285747', '#3f7b66', '#5c9e87', '#7fc2ab', '#a8d7c4', '#c9e8dc'];

export default function Analytics({ me }) {
  const [cutPct, setCutPct] = useState(25);
  const currency = me?.currency || 'INR';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['summary', from.toISOString()],
    queryFn: () => api(`/analytics/summary?from=${from.toISOString()}&to=${to.toISOString()}`)
  });

  if (isLoading) return <div className="skeleton" style={{ height: 300 }} />;
  if (isError) return <p className="err">{error.message}</p>;

  const total = data.total || 0;
  const hourlyRate = data.hourlyRate || (me?.monthlyIncome && me?.workHoursPerMonth ? me.monthlyIncome / me.workHoursPerMonth : 0);
  const monthlySavings = (total * (cutPct / 100));
  const annualSavings = monthlySavings * 12;
  const hoursSavedMonthly = hourlyRate > 0 ? (monthlySavings / hourlyRate).toFixed(1) : 0;
  const tenYearCompound = Math.round(monthlySavings * (((Math.pow(1 + 0.10 / 12, 120) - 1) / (0.10 / 12))));

  const chartData = data.ranking?.map((r) => ({
    name: r.name,
    amount: r.amount,
    hours: r.hours ? parseFloat(r.hours.toFixed(1)) : 0
  })) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div>
        <h1 className="edit">Habit Analytics & Intelligence</h1>
        <p className="micro">{from.toLocaleString(undefined, { month: 'long', year: 'numeric' })} Breakdown & Opportunity Analysis</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, margin: '28px 0' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20 }}>
          <span className="micro">Monthly Habit Total</span>
          <div className="num" style={{ fontSize: 28, fontWeight: 600, margin: '8px 0 4px' }}>
            {money(total, currency)}
          </div>
          <small style={{ color: 'var(--muted)' }}>Annual: {money(data.estimatedAnnual, currency)}</small>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20 }}>
          <span className="micro">Working Time Burn</span>
          <div className="num" style={{ fontSize: 28, fontWeight: 600, margin: '8px 0 4px', color: 'var(--accent)' }}>
            {data.hours ? `${data.hours.toFixed(1)} h` : '—'}
          </div>
          <small style={{ color: 'var(--muted)' }}>At {money(hourlyRate, currency)}/hr wage</small>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 20 }}>
          <span className="micro">Discretionary Ratio</span>
          <div className="num" style={{ fontSize: 28, fontWeight: 600, margin: '8px 0 4px' }}>
            {me?.monthlyIncome > 0 ? `${Math.round((total / me.monthlyIncome) * 100)}%` : '—'}
          </div>
          <small style={{ color: 'var(--muted)' }}>Of net take-home salary</small>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 28, margin: '32px 0' }}>
        <h3 style={{ margin: '0 0 6px', font: '400 24px var(--serif)' }}>Habit Cost Comparison</h3>
        <p className="micro" style={{ marginBottom: 24 }}>Amount spent per habit this month</p>
        <div style={{ height: 260 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => money(v, currency)} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="micro">No data to display in chart.</p>
          )}
        </div>
      </div>

      {/* Simulator Section */}
      <div style={{
        background: 'var(--brand-soft)',
        border: '1px solid #c9dccb',
        borderRadius: 'var(--radius)',
        padding: 32,
        margin: '32px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ margin: '0 0 6px', font: '400 24px var(--serif)', color: 'var(--brand)' }}>
              Habit Reduction & Opportunity Simulator
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)' }}>
              See what happens to your wealth and working hours when you trim your habits.
            </p>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>
            Cut by {cutPct}%
          </div>
        </div>

        <div style={{ margin: '24px 0' }}>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={cutPct}
            onChange={(e) => setCutPct(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
            <span>5% (Gentle trim)</span>
            <span>25% (Balanced)</span>
            <span>50% (Substantial)</span>
            <span>100% (Complete detox)</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, paddingTop: 16, borderTop: '1px solid #c9dccb' }}>
          <div>
            <span className="micro" style={{ color: 'var(--brand)' }}>Monthly Cash Saved</span>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', marginTop: 4 }}>
              +{money(monthlySavings, currency)}
            </div>
            <small style={{ fontSize: 12, color: 'var(--muted)' }}>Direct monthly savings</small>
          </div>

          <div>
            <span className="micro" style={{ color: 'var(--brand)' }}>Annual Cash Saved</span>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', marginTop: 4 }}>
              +{money(annualSavings, currency)}
            </div>
            <small style={{ fontSize: 12, color: 'var(--muted)' }}>Per year in your bank</small>
          </div>

          <div>
            <span className="micro" style={{ color: 'var(--brand)' }}>Working Life Reclaimed</span>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', marginTop: 4 }}>
              +{hoursSavedMonthly} hrs/mo
            </div>
            <small style={{ fontSize: 12, color: 'var(--muted)' }}>Free time gained each month</small>
          </div>

          <div>
            <span className="micro" style={{ color: 'var(--brand)' }}>10-Yr Wealth If Invested</span>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, color: 'var(--brand)', marginTop: 4 }}>
              ₹{tenYearCompound.toLocaleString('en-IN')}
            </div>
            <small style={{ fontSize: 12, color: 'var(--muted)' }}>At 10% compound interest</small>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
