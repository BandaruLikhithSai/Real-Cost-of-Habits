import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api.js';

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

export default function Goals({ me }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    targetAmount: '',
    currentSaved: '',
    monthlyContribution: ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const currency = me?.currency || 'INR';

  const { data: goals, isLoading, isError, error } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api('/goals')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await api('/goals', {
        method: 'POST',
        body: {
          title: form.title,
          targetAmount: parseFloat(form.targetAmount),
          currentSaved: parseFloat(form.currentSaved) || 0,
          monthlyContribution: parseFloat(form.monthlyContribution) || 0
        }
      });
      setForm({ title: '', targetAmount: '', currentSaved: '', monthlyContribution: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['goals'] });
    } catch (e) {
      setErr(e.message || 'Failed to save goal');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFunds = async (goal, delta) => {
    try {
      await api(`/goals/${goal._id}`, {
        method: 'PUT',
        body: { currentSaved: Math.min(goal.targetAmount, (goal.currentSaved || 0) + delta) }
      });
      qc.invalidateQueries({ queryKey: ['goals'] });
    } catch (e) {
      alert('Failed to update goal: ' + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this goal?')) return;
    try {
      await api(`/goals/${id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['goals'] });
    } catch (e) {
      alert('Failed to delete goal: ' + e.message);
    }
  };

  const inp = { display: 'block', width: '100%', padding: '10px 12px', margin: '6px 0 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)', fontSize: 14 };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">Savings Goals</h1>
          <p className="micro">Redirect money reclaimed from habits into meaningful milestones</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24, margin: '24px 0', maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', font: '400 22px var(--serif)' }}>New Savings Target</h3>
          {err && <p className="err" style={{ marginBottom: 12 }}>{err}</p>}
          <label className="micro">
            Goal Name
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund, Vacation, MacBook"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inp}
            />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="micro">
              Target Amount (₹)
              <input
                type="number"
                min="1"
                required
                placeholder="50000"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                style={inp}
              />
            </label>
            <label className="micro">
              Current Saved (₹)
              <input
                type="number"
                min="0"
                placeholder="10000"
                value={form.currentSaved}
                onChange={(e) => setForm({ ...form, currentSaved: e.target.value })}
                style={inp}
              />
            </label>
          </div>
          <label className="micro">
            Monthly Contribution (₹/mo)
            <input
              type="number"
              min="0"
              placeholder="e.g. 5000"
              value={form.monthlyContribution}
              onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
              style={inp}
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="skeleton" style={{ height: 220, marginTop: 24 }} />}
      {isError && <p className="err" style={{ marginTop: 24 }}>{error.message}</p>}

      {goals && (
        <div style={{ marginTop: 28 }}>
          {goals.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <p className="micro">No active goals yet.</p>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '8px 0 16px' }}>Click "+ New Goal" or load sample data to set a milestone.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {goals.map((g) => {
                const pct = Math.round((g.progress || 0) * 100);
                return (
                  <div
                    key={g._id}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--radius)',
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{g.title}</h3>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{pct}%</span>
                      </div>

                      <div style={{ height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden', margin: '8px 0 16px' }}>
                        <div style={{ width: `${Math.min(100, pct)}%`, background: 'var(--brand)', height: '100%', transition: 'width 0.3s ease' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <span className="micro" style={{ fontSize: 10 }}>Saved</span>
                          <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{money(g.currentSaved, currency)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="micro" style={{ fontSize: 10 }}>Target</span>
                          <div className="num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--muted)' }}>{money(g.targetAmount, currency)}</div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, fontSize: 13, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Monthly savings:</span>
                        <b style={{ color: 'var(--text)' }}>{money(g.monthlyContribution, currency)}/mo</b>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span>Estimated timeline:</span>
                        <b style={{ color: 'var(--text)' }}>
                          {g.monthsRemaining === 0 ? 'Goal reached! 🎉' : g.monthsRemaining ? `${g.monthsRemaining} months remaining` : 'Set monthly allocation'}
                        </b>
                      </div>
                    </div>

                    <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleAddFunds(g, 1000)}
                          style={{ background: 'var(--brand-soft)', border: '1px solid #c9dccb', color: 'var(--brand)', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                        >
                          +₹1,000
                        </button>
                        <button
                          onClick={() => handleAddFunds(g, 5000)}
                          style={{ background: 'var(--brand-soft)', border: '1px solid #c9dccb', color: 'var(--brand)', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
                        >
                          +₹5,000
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(g._id)}
                        style={{ background: 'none', border: 0, color: 'var(--neg)', fontSize: 12, cursor: 'pointer' }}
                      >
                        Delete
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
