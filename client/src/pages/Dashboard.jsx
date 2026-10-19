import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api.js';

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth(), 1);
const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

export default function Dashboard({ me }) {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    monthlyIncome: me?.monthlyIncome || 75000,
    workHoursPerMonth: me?.workHoursPerMonth || 160,
    currency: me?.currency || 'INR'
  });

  const q = useQuery({
    queryKey: ['summary', from.toISOString()],
    queryFn: () => api(`/analytics/summary?from=${from.toISOString()}&to=${to.toISOString()}`)
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api('/seed-my-account', { method: 'POST' });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['summary'] }),
        qc.invalidateQueries({ queryKey: ['me'] }),
        qc.invalidateQueries({ queryKey: ['expenses'] })
      ]);
    } catch (err) {
      alert('Failed to load sample data: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveIncome = async (e) => {
    e.preventDefault();
    try {
      await api('/me', {
        method: 'PATCH',
        body: {
          monthlyIncome: parseFloat(incomeForm.monthlyIncome) || 0,
          workHoursPerMonth: parseFloat(incomeForm.workHoursPerMonth) || 160,
          currency: incomeForm.currency || 'INR'
        }
      });
      setShowIncomeModal(false);
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    } catch (err) {
      alert('Failed to update income: ' + err.message);
    }
  };

  if (q.isLoading) return <div className="skeleton" style={{ height: 240 }} />;
  if (q.isError) return <p className="err" role="alert">{q.error.message}</p>;

  const d = q.data;
  const up = d.change > 0;
  const isEmpty = !d.series || d.series.length === 0;
  const activeCurrency = me?.currency || 'INR';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">Your habits, in perspective.</h1>
          <p className="micro">{from.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowIncomeModal(true)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '8px 14px',
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            ⚙️ Edit Income ({activeCurrency === 'INR' ? '₹' : activeCurrency})
          </button>
          <button
            className="btn"
            onClick={handleSeed}
            disabled={seeding}
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            {seeding ? 'Loading sample data...' : '✨ Load Sample Data (₹)'}
          </button>
        </div>
      </div>

      {showIncomeModal && (
        <form onSubmit={handleSaveIncome} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24, margin: '20px 0', maxWidth: 460 }}>
          <h3 style={{ margin: '0 0 12px', font: '400 20px var(--serif)' }}>Set Monthly Earnings & Currency</h3>
          <p className="micro" style={{ marginBottom: 16 }}>Used to calculate how many working hours your habits consume.</p>
          
          <label className="micro">
            Currency
            <select
              value={incomeForm.currency}
              onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '8px 12px', margin: '6px 0 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
            </select>
          </label>

          <label className="micro">
            Monthly Net Income ({incomeForm.currency === 'INR' ? '₹' : incomeForm.currency})
            <input
              type="number"
              min="0"
              required
              value={incomeForm.monthlyIncome}
              onChange={(e) => setIncomeForm({ ...incomeForm, monthlyIncome: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '8px 12px', margin: '6px 0 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}
            />
          </label>
          <label className="micro">
            Working Hours Per Month
            <input
              type="number"
              min="1"
              max="744"
              required
              value={incomeForm.workHoursPerMonth}
              onChange={(e) => setIncomeForm({ ...incomeForm, workHoursPerMonth: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '8px 12px', margin: '6px 0 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" type="submit">Save Settings</button>
            <button type="button" onClick={() => setShowIncomeModal(false)} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      )}

      {isEmpty && (
        <div style={{
          background: 'var(--brand-soft)',
          border: '1px solid #c9dccb',
          borderRadius: 'var(--radius)',
          padding: '24px 28px',
          margin: '28px 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--brand)' }}>
            Welcome! Your account is currently blank.
          </div>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.5 }}>
            Because you signed in with your personal account, there are no recorded habits or expenses yet.
            Click below to load realistic sample habits in Rupees (*Chai/Coffee, Swiggy/Zomato, OTT Subscriptions, Cabs*) and current month expenses to see the graphs and intelligence calculations immediately!
          </p>
          <div>
            <button
              className="btn"
              onClick={handleSeed}
              disabled={seeding}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4 }}
            >
              {seeding ? 'Populating...' : '✨ Populate Sample Habits & Expenses (₹)'}
            </button>
          </div>
        </div>
      )}

      <section className="statement" aria-label="Spending statement">
        <div>
          <span className="micro">Tracked this period</span>
          <div className="big num">{money(d.total, activeCurrency)}</div>
          <p style={{ color: d.change == null ? 'var(--muted)' : up ? 'var(--neg)' : 'var(--brand)' }}>
            {d.change == null ? 'No previous period to compare' : `${up ? '+' : ''}${d.change}% vs previous period`}
          </p>
        </div>
        <div className="sub">
          <div>
            <span className="micro">Estimated annual</span>
            <b className="num">{money(d.estimatedAnnual, activeCurrency)}</b>
            <small>Estimate from this period</small>
          </div>
          <div>
            <span className="micro">Working time</span>
            <b className="num">{d.hours == null ? '—' : `${d.hours.toFixed(1)} h`}</b>
            <small>
              {d.hourlyRate ? (
                `At ${money(d.hourlyRate, activeCurrency)}/h`
              ) : (
                <button
                  onClick={() => setShowIncomeModal(true)}
                  style={{ background: 'none', border: 0, padding: 0, color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
                >
                  Set income in settings
                </button>
              )}
            </small>
          </div>
        </div>
      </section>

      <div role="img" aria-label={`Daily spending, ${d.series.length} days with expenses`} style={{ height: 220 }}>
        {d.series && d.series.length > 0 ? (
          <ResponsiveContainer>
            <AreaChart data={d.series}>
              <XAxis dataKey="date" tickFormatter={(x) => x.slice(8)} stroke="var(--muted)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => money(v, activeCurrency)} />
              <Area dataKey="amount" stroke="var(--brand)" fill="var(--brand-soft)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="micro">No expenses in this period yet.</p>
        )}
      </div>

      <h2 style={{ font: '400 28px var(--serif)', margin: '40px 0 8px' }}>Where it goes</h2>
      {d.ranking && d.ranking.length > 0 ? (
        <table className="ledger">
          <tbody>
            {d.ranking.map((r) => (
              <tr key={r.key}>
                <td>
                  <b>{r.name}</b> <span className="micro">{r.category}</span>
                  <div className="bar">
                    <i style={{ width: `${r.share * 100}%` }} />
                  </div>
                </td>
                <td className="num">{money(r.amount, activeCurrency)}</td>
                <td className="num">{Math.round(r.share * 100)}%</td>
                <td className="num">{r.hours == null ? '—' : `${r.hours.toFixed(1)} h`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="micro" style={{ marginTop: 12 }}>No category breakdown available yet.</p>
      )}
    </motion.div>
  );
}
