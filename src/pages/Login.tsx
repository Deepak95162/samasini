import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { inviteAnalyst } from '../lib/auth';

export default function Login() {
  const { loginUser } = useApp();
  const [mode, setMode] = useState<'login' | 'invite'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!loginUser(email, password)) {
      setError('Invalid email or password.');
    }
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    const result = inviteAnalyst(email, password, name || email.split('@')[0]);
    if (!result.ok) {
      setError(result.error ?? 'Could not create account.');
      return;
    }
    setInfo('Analyst account created — you can log in now.');
    setMode('login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 text-xl font-bold mb-3">S</div>
          <h1 className="text-2xl font-semibold text-white">SamaSini</h1>
          <p className="text-slate-400 text-sm mt-1">AI-assisted Fraud Detection Console</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex mb-5 bg-slate-800/60 rounded-lg p-1 text-sm">
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'login' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'invite' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              onClick={() => setMode('invite')}
            >
              Invite analyst
            </button>
          </div>

          {error && <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</div>}
          {info && <div className="mb-4 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">{info}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="dev@mulai.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 transition text-white rounded-lg py-2 font-medium mt-2">
                Log in
              </button>
              <p className="text-xs text-slate-500 text-center pt-2">Demo seed: dev@mulai.com / fraud123</p>
            </form>
          ) : (
            <form onSubmit={handleInvite} className="space-y-3">
              <Field label="Analyst name" type="text" value={name} onChange={setName} placeholder="Jane Doe" />
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="teammate@company.com" />
              <Field label="Choose password" type="password" value={password} onChange={setPassword} placeholder="Set a password" />
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 transition text-white rounded-lg py-2 font-medium mt-2">
                Create account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block text-left">
      <span className="text-xs text-slate-400 mb-1 block">{label}</span>
      <input
        required
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
      />
    </label>
  );
}
