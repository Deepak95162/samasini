import { useApp } from '../context/AppContext';

export default function Overview() {
  const { customers, transactions, alerts, reports } = useApp();

  const verified = customers.filter((c) => c.kycStatus === 'verified').length;
  const pendingKyc = customers.filter((c) => c.kycStatus === 'pending').length;
  const screeningHits = customers.filter((c) => c.screeningHit).length;
  const monitored = transactions.length;
  const openAlerts = alerts.filter((a) => a.status !== 'resolved').length;

  const stages = [
    { label: 'Registration', value: customers.length, note: 'accounts onboarded' },
    { label: 'KYC', value: verified, note: `${pendingKyc} pending review` },
    { label: 'Screening', value: customers.length - screeningHits, note: `${screeningHits} watchlist hits` },
    { label: 'Transaction Monitoring', value: monitored, note: `${openAlerts} flagged now` },
    { label: 'Reporting', value: reports.length, note: 'confirmed fraud reports' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Customer Journey — Fraud Detection Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">End-to-end view from onboarding to fraud reporting, driven by live synthetic data.</p>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {stages.map((s, i) => (
          <div key={s.label} className="relative bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-2">{i + 1}. {s.label}</div>
            <div className="text-2xl font-semibold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Transactions monitored" value={monitored} accent="text-blue-400" />
        <StatCard label="Open fraud alerts" value={openAlerts} accent="text-red-400" />
        <StatCard label="Reports filed" value={reports.length} accent="text-emerald-400" />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="px-4 py-3 border-b border-slate-800 text-sm font-medium text-white">Recent transactions</div>
        <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
          {transactions.slice(0, 12).map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <div className="text-white">{t.customerName}</div>
                <div className="text-xs text-slate-500">
                  ₹{t.amount.toLocaleString('en-IN')} · {t.channel.toUpperCase()} · {t.merchantCategory} · {t.country}
                </div>
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-md ${t.flagged ? 'bg-red-950/60 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                {t.flagged ? `FLAGGED · ${t.score}` : `score ${t.score}`}
              </div>
            </div>
          ))}
          {transactions.length === 0 && <div className="px-4 py-6 text-sm text-slate-500 text-center">Waiting for the first synthetic transactions…</div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
