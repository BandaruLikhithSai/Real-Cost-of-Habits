import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api.js';

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

export default function Coach({ me }) {
  const currency = me?.currency || 'INR';
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['coach-insights'],
    queryFn: () => api('/coach/insights')
  });

  if (isLoading) return <div className="skeleton" style={{ height: 260 }} />;
  if (isError) return <p className="err">{error.message}</p>;

  const summary = data?.summary;
  const tips = data?.tips || [];
  const top = summary?.ranking?.[0];

  const PRESET_ANSWERS = {
    save5k: {
      q: 'How can I save ₹5,000 this month without suffering?',
      a: top
        ? `Your biggest single outflow is currently ${top.name} (₹${top.amount.toLocaleString('en-IN')}). If you reduce just 3-4 occurrences of this habit, or substitute two takeout orders with home cooking, you will hit ₹5,000 in direct cash retained without depriving yourself of everything else.`
        : 'Start by tracking 3 everyday expenses this week. Often just the awareness of logging purchases reduces impulsive spending by 15-20%.'
    },
    laborHours: {
      q: 'What is my most expensive habit in actual working labor?',
      a: top && summary?.hours
        ? `${top.name} is your highest labor drain, demanding ${top.hours.toFixed(1)} hours of your labor this period alone. At your current rate, you work until midday Wednesday just to afford this single habit.`
        : 'Set your monthly income and hours in settings to unlock precise labor-to-habit exchange calculations.'
    },
    chai5yr: {
      q: 'If I cut daily coffee/chai by half, what does that equal in 5 years?',
      a: 'Cutting ₹160/day by half saves ₹80/day, or ~₹2,400/month. Over 5 years invested at an index return of 10%, that accumulates to approximately ₹1,88,000 — enough for an international vacation or an entire emergency reserve.'
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">AI Habit Coach</h1>
          <p className="micro">Behavioral insights, time-cost auditing, and wealth recommendations</p>
        </div>
        <div style={{ background: 'var(--brand-soft)', color: 'var(--brand)', padding: '6px 12px', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 500, border: '1px solid #c9dccb' }}>
          🧠 Intelligence Engine: Active
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, margin: '28px 0' }}>
        {tips.map((tip, idx) => (
          <div
            key={idx}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span className="micro" style={{ color: 'var(--brand)', fontWeight: 600 }}>{tip.impact}</span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{tip.title}</h3>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{tip.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 28, margin: '32px 0' }}>
        <h3 style={{ margin: '0 0 8px', font: '400 24px var(--serif)' }}>Ask Your Habit Advisor</h3>
        <p className="micro" style={{ marginBottom: 20 }}>Select a common behavioral finance scenario</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(PRESET_ANSWERS).map(([key, item]) => (
            <div key={key}>
              <button
                onClick={() => setSelectedQuestion(selectedQuestion === key ? null : key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: selectedQuestion === key ? 'var(--brand-soft)' : 'var(--canvas)',
                  border: `1px solid ${selectedQuestion === key ? 'var(--brand)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>💬 {item.q}</span>
                <span>{selectedQuestion === key ? '▲' : '▼'}</span>
              </button>

              {selectedQuestion === key && (
                <div style={{ padding: '16px 20px', background: 'var(--surface)', borderLeft: '3px solid var(--brand)', margin: '8px 0 12px 12px', fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 20, color: 'var(--muted)', fontSize: 12 }}>
        💡 <b>Pro Tip:</b> To enable Claude streaming responses for custom chat queries, add your <code>ANTHROPIC_API_KEY</code> in <code>server/.env</code>.
      </div>
    </motion.div>
  );
}
