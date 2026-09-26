import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Alert } from '../types';

export default function Monitoring() {
  const { alerts, transactions, resolveAlert } = useApp();
  const [selected, setSelected] = useState<Alert | null>(null);

  const pending = alerts.filter((a) => a.status !== 'resolved');
  const resolved = alerts.filter((a) => a.status === 'resolved');

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Transaction Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Live synthetic transaction stream. Flags cross the {65}-point risk threshold.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Live feed</div>
          <div className="divide-y divide-slate-800/60 max-h-[32rem] overflow-y-auto">
            {transactions.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="text-white">{t.customerName}</div>
                  <div className="text-xs text-slate-500">
                    ₹{t.amount.toLocaleString('en-IN')} · {t.channel.toUpperCase()} · {t.merchantCategory} · {new Date(t.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-md ${t.flagged ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                  score {t.score}
                </div>
              </div>
            ))}
            {transactions.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No transactions yet.</div>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">
            Alerts needing review <span className="text-slate-500 font-normal">({pending.length})</span>
          </div>
          <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
            {pending.map((a) => (
              <button
                key={a.id}
                data-testid="alert-row"
                onClick={() => setSelected(a)}
                className="w-full text-left px-4 py-3 hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{a.customerName}</span>
                  <span className="text-xs font-semibold text-red-400">{a.score}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{new Date(a.createdAt).toLocaleTimeString()}</div>
              </button>
            ))}
            {pending.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">No alerts pending review.</div>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Recently resolved</div>
          <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
            {resolved.slice(0, 8).map((a) => (
              <div key={a.id} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-white">{a.customerName}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      a.verdict === 'true_positive' ? 'bg-red-950/60 text-red-400' : 'bg-emerald-950/60 text-emerald-400'
                    }`}
                  >
                    {a.verdict === 'true_positive' ? 'True positive' : 'False positive'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">by {a.resolvedBy}</div>
              </div>
            ))}
            {resolved.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">Nothing resolved yet.</div>}
          </div>
        </div>
      </div>

      {selected && (
        <AlertModal
          alert={selected}
          onClose={() => setSelected(null)}
          onResolve={(verdict) => {
            resolveAlert(selected.id, verdict);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

function AlertModal({ alert, onClose, onResolve }: { alert: Alert; onClose: () => void; onResolve: (v: 'true_positive' | 'false_positive') => void }) {
  const drivers = Object.entries(alert.breakdown).sort((a, b) => b[1] - a[1]);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30 px-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-white">{alert.customerName}</h2>
          <span className="text-sm font-semibold text-red-400">Risk score {alert.score}</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Flagged {new Date(alert.createdAt).toLocaleString()}</p>

        <div className="space-y-2 mb-5">
          {drivers.map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span>{Math.round(val)}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${val >= 50 ? 'bg-red-500' : 'bg-slate-600'}`} style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            data-testid="resolve-false-positive"
            onClick={() => onResolve('false_positive')}
            className="flex-1 border border-emerald-800 text-emerald-400 hover:bg-emerald-950/40 rounded-lg py-2 text-sm font-medium transition"
          >
            False positive
          </button>
          <button
            data-testid="resolve-true-positive"
            onClick={() => onResolve('true_positive')}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 text-sm font-medium transition"
          >
            Confirm fraud → file report
          </button>
        </div>
      </div>
    </div>
  );
}
