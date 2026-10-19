import { useState } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api.js';
import Dashboard from './pages/Dashboard.jsx';
import Expenses from './pages/Expenses.jsx';
import Habits from './pages/Habits.jsx';
import Analytics from './pages/Analytics.jsx';
import Goals from './pages/Goals.jsx';
import Coach from './pages/Coach.jsx';
import Reports from './pages/Reports.jsx';

const NAV = [
  ['/', 'Overview'],
  ['/expenses', 'Expenses'],
  ['/habits', 'Habits'],
  ['/analytics', 'Analytics'],
  ['/goals', 'Savings Goals'],
  ['/coach', 'AI Coach'],
  ['/reports', 'Reports']
];

const inp = { display: 'block', width: '100%', padding: 10, margin: '6px 0 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--surface)' };

function SignIn() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await api(`/auth/${mode}`, { method: 'POST', body: f });
      if (res?.token) {
        localStorage.setItem('rch_token', res.token);
      }
      qc.setQueryData(['me'], res);
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (x) {
      setErr(x.message);
    }
  };

  return (
    <form onSubmit={submit} className="main" style={{ maxWidth: 380, marginTop: 40 }}>
      <h1 className="edit">Real cost.</h1>
      <p className="micro" style={{ marginBottom: 20 }}>Habit Intelligence</p>
      <label className="micro">
        Email
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          style={inp}
        />
      </label>
      <label className="micro">
        Password
        <input
          type="password"
          required
          minLength={8}
          placeholder="Minimum 8 characters"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          style={inp}
        />
      </label>
      {err && <p className="err" role="alert" style={{ marginBottom: 12 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button
          type="button"
          onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}
          style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
        >
          {mode === 'login' ? 'Need an account?' : 'Have an account?'}
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api('/me'),
    retry: false
  });

  const handleLogout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('rch_token');
    qc.setQueryData(['me'], null);
    qc.removeQueries();
  };

  if (me.isLoading) return <div className="main"><div className="skeleton" /></div>;
  if (me.isError || !me.data) return <SignIn />;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <b>REAL COST</b>
          <span className="micro">Habit intelligence</span>
        </div>
        <nav className="nav" aria-label="Primary">
          {NAV.map(([to, l]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>
              {l}
            </NavLink>
          ))}
        </nav>
        <div className="foot" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
              {me.data.name || 'Personal Account'}
            </div>
            <span className="micro" style={{ wordBreak: 'break-all', display: 'block', textTransform: 'none', fontSize: 11 }}>
              {me.data.email}
            </span>
          </div>
          <button
            onClick={handleLogout}
            id="signout-button"
            style={{
              background: 'none',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--neg)',
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fbeae9'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard me={me.data} />} />
          <Route path="/expenses" element={<Expenses me={me.data} />} />
          <Route path="/habits" element={<Habits me={me.data} />} />
          <Route path="/analytics" element={<Analytics me={me.data} />} />
          <Route path="/goals" element={<Goals me={me.data} />} />
          <Route path="/coach" element={<Coach me={me.data} />} />
          <Route path="/reports" element={<Reports me={me.data} />} />
        </Routes>
      </main>
    </div>
  );
}
