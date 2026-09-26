import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Monitoring() {
  const { transactions } = useApp();
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const pending = useMemo(() => transactions.filter((t) => t.flagged && t.reviewStatus === 'unreviewed'), [transactions]);
  const resolved = useMemo(() => transactions.filter((t) => t.reviewStatus === 'resolved'), [transactions]);
  const feed = useMemo(() => (flaggedOnly ? transactions.filter((t) => t.flagged) : transactions), [transactions, flaggedOnly]);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Transaction Monitoring</h1>
            <p className="text-sm text-slate-500 mt-1">Live synthetic transaction stream. Flags cross the 65-point risk threshold.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="accent-purple-600" />
            Flagged only
          </label>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Live feed</div>
          <div className="divide-y divide-slate-800/60 max-h-[32rem] overflow-y-auto">
            {feed.map((t) => (
              <Link
                key={t.id}
                to={`/transactions/${t.id}`}
                className="px-4 py-3 flex items-center justify-between text-sm hover:bg-slate-800/40 transition"
              >
                <div>
                  <div className="text-white">{t.customerName}</div>
                  <div className="text-xs text-slate-500">
                    ₹{t.amount.toLocaleString('en-IN')} · {t.channel.toUpperCase()} · {t.merchantCategory} · {new Date(t.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.reviewStatus === 'resolved' && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        t.verdict === 'true_positive' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                      }`}
                    >
                      {t.verdict === 'true_positive' ? 'TP' : 'FP'}
                    </span>
                  )}
                  <div className={`text-xs font-semibold px-2 py-1 rounded-md ${t.flagged ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    score {t.score}
                  </div>
                </div>
              </Link>
            ))}
            {feed.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No transactions yet.</div>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">
            Alerts needing review <span className="text-slate-500 font-normal">({pending.length})</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {pending.map((t) => (
              <Link key={t.id} to={`/transactions/${t.id}`} data-testid="alert-row" className="block px-4 py-3 hover:bg-slate-800/60 transition">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{t.customerName}</span>
                  <span className="text-xs font-semibold text-red-400">{t.score}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(t.timestamp).toLocaleTimeString()}</div>
              </Link>
            ))}
            {pending.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No alerts pending review.</div>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Recently resolved</div>
          <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
            {resolved.slice(0, 8).map((t) => (
              <Link key={t.id} to={`/transactions/${t.id}`} className="block px-4 py-3 text-sm hover:bg-slate-800/60 transition">
                <div className="flex items-center justify-between">
                  <span className="text-white">{t.customerName}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      t.verdict === 'true_positive' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                    }`}
                  >
                    {t.verdict === 'true_positive' ? 'True positive' : 'False positive'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">by {t.resolvedBy}</div>
              </Link>
            ))}
            {resolved.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">Nothing resolved yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
