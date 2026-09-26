import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const KYC_STYLE: Record<string, string> = {
  verified: 'bg-emerald-950/60 text-emerald-400',
  pending: 'bg-amber-950/60 text-amber-400',
  rejected: 'bg-red-950/60 text-red-400',
};

const RISK_STYLE: Record<string, string> = {
  low: 'bg-emerald-950/60 text-emerald-400',
  medium: 'bg-amber-950/60 text-amber-400',
  high: 'bg-red-950/60 text-red-400',
};

export default function Customers() {
  const { customers, transactions } = useApp();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [customers, query]
  );

  const flaggedCountFor = (customerId: string) => transactions.filter((t) => t.customerId === customerId && t.flagged).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">All onboarded accounts in this demo environment.</p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
        {filtered.map((c) => (
          <Link key={c.id} to={`/customers/${c.id}`} className="px-5 py-3 flex items-center justify-between text-sm hover:bg-slate-800/40 transition">
            <div>
              <div className="text-white">{c.name}</div>
              <div className="text-xs text-slate-500">{c.country} · registered {new Date(c.registeredAt).toLocaleDateString()}</div>
            </div>
            <div className="flex items-center gap-2">
              {flaggedCountFor(c.id) > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-950/60 text-red-400">{flaggedCountFor(c.id)} flagged</span>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${KYC_STYLE[c.kycStatus]}`}>{c.kycStatus}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${RISK_STYLE[c.riskTier]}`}>{c.riskTier}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <div className="px-5 py-10 text-sm text-slate-500 text-center">No customers match "{query}".</div>}
      </div>
    </div>
  );
}
