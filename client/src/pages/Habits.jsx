import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api.js';

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

const CATEGORIES = ['Food & Drink', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Subscriptions', 'Utilities', 'Other'];

export default function Habits({ me }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Food & Drink',
    expectedMonthly: '',
    budget: '',
    frequencyPerMonth: ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const { data: habits, isLoading, isError, error } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api('/habits')
  });

  const hourlyRate = (me?.monthlyIncome && me?.workHoursPerMonth)
    ? me.monthlyIncome / me.workHoursPerMonth
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await api('/habits', {
        method: 'POST',
        body: {
          name: form.name,
          category: form.category,
          expectedMonthly: parseFloat(form.expectedMonthly) || 0,
          budget: parseFloat(form.budget) || 0,
          frequencyPerMonth: parseInt(form.frequencyPerMonth) || 0
        }
      });
      setForm({ name: '', category: 'Food & Drink', expectedMonthly: '', budget: '', frequencyPerMonth: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    } catch (e) {
      setErr(e.message || 'Failed to save habit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this habit?')) return;
    try {
      await api(`/habits/${id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    } catch (e) {
      alert('Failed to delete habit: ' + e.message);
    }
  };

  const inp = { display: 'block', width: '100%', padding: '10px 12px', margin: '6px 0 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)', fontSize: 14 };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">Tracked Habits</h1>
          <p className="micro">Define recurring habits, frequency, and monthly cost impact</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ New Habit'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24, margin: '24px 0', maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', font: '400 22px var(--serif)' }}>Create Habit</h3>
          {err && <p className="err" style={{ marginBottom: 12 }}>{err}</p>}
          <label className="micro">
            Habit Name
            <input
              type="text"
              required
              placeholder="e.g. Daily Coffee, Weekend Dining, Gym"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inp}
            />
          </label>
          <label className="micro">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={inp}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="micro">
              Expected Spend (₹/mo)
              <input
                type="number"
                min="0"
                placeholder="4000"
                value={form.expectedMonthly}
                onChange={(e) => setForm({ ...form, expectedMonthly: e.target.value })}
                style={inp}
              />
            </label>
            <label className="micro">
              Budget Target (₹/mo)
              <input
                type="number"
                min="0"
                placeholder="3000"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                style={inp}
              />
            </label>
          </div>
          <label className="micro">
            Frequency (times per month)
            <input
              type="number"
              min="0"
              placeholder="e.g. 20"
              value={form.frequencyPerMonth}
              onChange={(e) => setForm({ ...form, frequencyPerMonth: e.target.value })}
              style={inp}
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Habit'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="skeleton" style={{ height: 220, marginTop: 24 }} />}
      {isError && <p className="err" style={{ marginTop: 24 }}>{error.message}</p>}

      {habits && (
        <div style={{ marginTop: 28 }}>
          {habits.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <p className="micro">No habits configured yet.</p>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '8px 0 16px' }}>Click "+ New Habit" or load sample data from the Overview tab.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {habits.map((h) => {
                const workHoursCost = hourlyRate > 0 ? (h.expectedMonthly / hourlyRate).toFixed(1) : null;
                const annualCost = h.expectedMonthly * 12;
                return (
                  <div
                    key={h._id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      padding: 22,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{h.name}</h3>
                        <span style={{ fontSize: 11, background: 'var(--brand-soft)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 4 }}>
                          {h.category}
                        </span>
                      </div>
                      <div style={{ margin: '14px 0' }}>
                        <span className="micro" style={{ fontSize: 10 }}>Expected Monthly</span>
                        <div className="num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>
                          {money(h.expectedMonthly, me?.currency)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                          {money(annualCost, me?.currency)} projected per year
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10, fontSize: 13, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Working Time:</span>
                        <b style={{ color: 'var(--text)' }}>{workHoursCost ? `${workHoursCost} hours/mo` : '—'}</b>
                      </div>
                      {h.frequencyPerMonth > 0 && (
                        <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span>Frequency:</span>
                          <b style={{ color: 'var(--text)' }}>{h.frequencyPerMonth}x / month</b>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDelete(h._id)}
                        style={{ background: 'none', border: 0, color: 'var(--neg)', fontSize: 12, cursor: 'pointer' }}
                      >
                        Delete Habit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
