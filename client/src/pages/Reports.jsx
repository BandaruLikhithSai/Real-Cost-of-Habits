import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api.js';

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth(), 1);
const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

const money = (n, cur = 'INR') => {
  const currency = cur || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : undefined;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
};

export default function Reports({ me }) {
  const currency = me?.currency || 'INR';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['summary', from.toISOString()],
    queryFn: () => api(`/analytics/summary?from=${from.toISOString()}&to=${to.toISOString()}`)
  });

  if (isLoading) return <div className="skeleton" style={{ height: 300 }} />;
  if (isError) return <p className="err">{error.message}</p>;

  const total = data.total || 0;
  const annual = data.estimatedAnnual || 0;
  const hours = data.hours ? data.hours.toFixed(1) : 0;
  const hourlyRate = data.hourlyRate || (me?.monthlyIncome && me?.workHoursPerMonth ? me.monthlyIncome / me.workHoursPerMonth : 0);

  const printReport = () => {
    window.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="edit">Habit Cost Audit Report</h1>
          <p className="micro">Executive Summary • {from.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="btn" onClick={printReport}>
          🖨️ Print / Save Statement
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 32, margin: '28px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--line)', paddingBottom: 16, marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <b style={{ fontSize: 16, letterSpacing: '0.05em' }}>REAL COST FINANCIAL AUDIT</b>
            <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>Prepared for: {me?.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="micro">Status</span>
            <div style={{ fontWeight: 600, color: 'var(--brand)' }}>Active Period Audit</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 32 }}>
          <div>
            <span className="micro">Monthly Spend</span>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{money(total, currency)}</div>
          </div>
          <div>
            <span className="micro">Annual Projected</span>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{money(annual, currency)}</div>
          </div>
          <div>
            <span className="micro">Hours of Labor</span>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4, color: 'var(--accent)' }}>{hours} hrs</div>
          </div>
          <div>
            <span className="micro">Income Drain</span>
            <div className="num" style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>
              {me?.monthlyIncome > 0 ? `${Math.round((total / me.monthlyIncome) * 100)}%` : '—'}
            </div>
          </div>
        </div>

        <h3 style={{ font: '400 22px var(--serif)', margin: '28px 0 12px' }}>Detailed Habit Breakdown</h3>
        <table className="ledger">
          <thead>
            <tr style={{ borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
              <th className="micro" style={{ paddingBottom: 10 }}>Habit / Stream</th>
              <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>Monthly Spend</th>
              <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>% Share</th>
              <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>Labor Hours</th>
              <th className="micro" style={{ paddingBottom: 10, textAlign: 'right' }}>Annual Projection</th>
            </tr>
          </thead>
          <tbody>
            {data.ranking?.map((r) => (
              <tr key={r.key}>
                <td>
                  <b>{r.name}</b>
                  <span className="micro" style={{ display: 'block', fontSize: 10 }}>{r.category}</span>
                </td>
                <td className="num">{money(r.amount, currency)}</td>
                <td className="num">{Math.round(r.share * 100)}%</td>
                <td className="num">{r.hours ? `${r.hours.toFixed(1)} h` : '—'}</td>
                <td className="num" style={{ color: 'var(--muted)' }}>{money(r.amount * 12, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 36, padding: 20, background: 'var(--brand-soft)', borderRadius: 'var(--radius)', border: '1px solid #c9dccb' }}>
          <h4 style={{ margin: '0 0 8px', color: 'var(--brand)', fontSize: 16 }}>Audit Conclusion & Action Plan</h4>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
            Your habits currently demand <b>{hours} hours</b> of effort per month. Trimming just 20% across all discretionary categories will free up <b>{money(total * 0.2, currency)}</b> every single month (<b>{money(total * 0.2 * 12, currency)}/year</b>) without eliminating the lifestyle benefits you enjoy.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
