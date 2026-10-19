import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api.js';

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
};

const CATEGORIES = ['Food & Drink', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Subscriptions', 'Utilities', 'Other'];

export default function Expenses({ me }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    category: 'Food & Drink',
    date: new Date().toISOString().slice(0, 10),
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api('/expenses?limit=100&sort=-date')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await api('/expenses', {
        method: 'POST',
        body: {
          amount: parseFloat(form.amount),
          category: form.category,
          date: new Date(form.date).toISOString(),
          note: form.note || undefined
        }
      });
      setForm({ amount: '', category: 'Food & Drink', date: new Date().toISOString().slice(0, 10), note: '' });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    } catch (err) {
      setErr(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api(`/expenses/${id}`, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    } catch (err) {
      alert('Failed to delete expense: ' + err.message);
    }
  };

  const inp = { display: 'block', width: '100%', padding: '10px 12px', margin: '6px 0 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)', fontSize: 14 };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">Expense Ledger</h1>
          <p className="micro">Track individual costs and habit occurrences</p>
        </div>
        <button className="btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ Log Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 24, margin: '24px 0', maxWidth: 480 }}>
          <h3 style={{ margin: '0 0 16px', font: '400 22px var(--serif)' }}>New Expense</h3>
          {err && <p className="err" style={{ marginBottom: 12 }}>{err}</p>}
          <label className="micro">
            Amount ({me?.currency === 'INR' || !me?.currency ? '₹ INR' : me?.currency})
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <label className="micro">
            Date
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inp}
            />
          </label>
          <label className="micro">
            Note / Details (optional)
            <input
              type="text"
              placeholder="e.g. Afternoon latte, Uber ride..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={inp}
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <div className="skeleton" style={{ height: 200, marginTop: 24 }} />}
      {isError && <p className="err" style={{ marginTop: 24 }}>{error.message}</p>}

      {data && (
        <div style={{ marginTop: 24 }}>
          {data.items.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
              <p className="micro" style={{ margin: 0 }}>No expenses recorded yet.</p>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '8px 0 16px' }}>Click "+ Log Expense" above to add your first habit or purchase.</p>
            </div>
          ) : (
            <table className="ledger">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                  <th className="micro" style={{ paddingBottom: 10 }}>Date & Item</th>
                  <th className="micro" style={{ paddingBottom: 10, textAlign: 'left' }}>Category</th>
                  <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>Amount</th>
                  <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <b>{item.note || item.category}</b>
                      <span className="micro" style={{ display: 'block', fontSize: 10 }}>
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, background: 'var(--brand-soft)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 4 }}>
                        {item.category}
                      </span>
                    </td>
                    <td className="num" style={{ fontSize: 16, fontWeight: 500 }}>
                      {money(item.amount, me?.currency)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(item._id)}
                        style={{ background: 'none', border: 0, color: 'var(--neg)', cursor: 'pointer', fontSize: 12, padding: '4px 8px' }}
                        title="Delete expense"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </motion.div>
  );
}
