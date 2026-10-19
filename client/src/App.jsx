import { useState } from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--canvas)'
    }}>
      <form onSubmit={submit} style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '36px 32px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 className="edit" style={{ fontSize: 36, margin: '0 0 6px' }}>Real cost.</h1>
          <p className="micro" style={{ margin: 0, letterSpacing: '0.14em' }}>Habit Intelligence</p>
        </div>

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
          <div style={{ position: 'relative', margin: '6px 0 16px' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              style={{ ...inp, margin: 0, paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 0,
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {err && <p className="err" role="alert" style={{ marginBottom: 14, fontSize: 13 }}>{err}</p>}

        <button className="btn" style={{ width: '100%', padding: '12px', fontSize: 14, fontWeight: 500, marginTop: 4 }}>
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}
            style={{ background: 'none', border: 0, color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
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

  if (me.isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
        <div className="skeleton" style={{ width: 380, height: 260, borderRadius: 'var(--radius)' }} />
      </div>
    );
  }
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
